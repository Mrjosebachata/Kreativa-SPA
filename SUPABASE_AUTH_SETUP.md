# Configuración de autenticación de KREATIVA

La SPA ya está preparada para registro, inicio y cierre de sesión con Supabase Auth.
Para activar el flujo completo falta aplicar la migración de base de datos.

## 1. Ejecutar la migración

Abre **Supabase → SQL Editor**, copia el contenido de:

`supabase/migrations/202607230001_auth_and_rls.sql`

y ejecútalo después del esquema base y de las políticas temporales.

La migración:

- conserva `profiles.role` como rol comercial (`client`, `freelancer`, `both` o
  el valor legado `admin`);
- agrega `profiles.account_role` para el acceso real (`user` o `admin`);
- crea un perfil automáticamente al registrar una cuenta;
- reemplaza las políticas `temp_*` por reglas basadas en `auth.uid()`;
- impide que un usuario se convierta a sí mismo en administrador;
- limita la subida de archivos a una carpeta con el UUID del usuario.

Las filas semilla actuales se conservan como catálogo aunque no tengan una
cuenta en `auth.users`.

## 2. Configurar Auth

En **Authentication → URL Configuration**:

- configura **Site URL** con la URL pública de la SPA;
- agrega `http://localhost:5173` a **Redirect URLs** para desarrollo;
- agrega también la URL de Netlify u otro dominio de producción.

La confirmación por correo puede mantenerse activa. Si la desactivas para una
demostración, el registro inicia sesión inmediatamente.

## 3. Crear el primer administrador

Primero registra la cuenta desde la SPA. Después ejecuta en SQL Editor:

```sql
update public.profiles
set account_role = 'admin'
where email = 'tu-correo@ejemplo.com';
```

No expongas una operación equivalente en el navegador. Una futura pantalla de
administración deberá usar una función segura del servidor.

## 4. Nota sobre archivos

Los buckets `commission-attachments` y `message-attachments` siguen usando URLs
públicas porque el frontend existente guarda y muestra `publicUrl`. La migración
protege quién puede subir, pero quien conozca una URL todavía puede leer el
archivo.

Si las referencias y adjuntos deben ser confidenciales, el siguiente cambio
debe convertir ambos buckets a privados y reemplazar las URLs públicas por URLs
firmadas de corta duración.
