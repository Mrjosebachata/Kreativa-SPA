import { supabase } from '../supabaseClient';
import { removePublicFiles, uploadFiles } from './storage';

const PROJECT_SELECT = `
  id,
  freelancer_id,
  title,
  description,
  project_url,
  created_at,
  updated_at,
  project_images ( id, image_url, display_order ),
  project_links ( id, label, url, display_order ),
  project_collaborators ( id, name, contact_url, display_order )
`;

function assertProjectImage(file) {
  if (!file?.type?.startsWith('image/')) {
    throw new Error('Cada archivo del proyecto debe ser una imagen.');
  }

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Las imágenes deben estar en formato JPG, PNG o WEBP.');
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Cada imagen no puede superar 10 MB.');
  }
}

function normalizeProject(row) {
  return {
    id: row.id,
    freelancerId: row.freelancer_id,
    title: row.title,
    description: row.description ?? '',
    projectUrl: row.project_url ?? '',
    images: (row.project_images ?? [])
      .slice()
      .sort((a, b) => a.display_order - b.display_order)
      .map((image) => ({
        id: image.id,
        url: image.image_url,
        displayOrder: image.display_order,
      })),
    links: (row.project_links ?? [])
      .slice()
      .sort((a, b) => a.display_order - b.display_order)
      .map((link) => ({
        id: link.id,
        label: link.label,
        url: link.url,
        displayOrder: link.display_order,
      })),
    collaborators: (row.project_collaborators ?? [])
      .slice()
      .sort((a, b) => a.display_order - b.display_order)
      .map((collaborator) => ({
        id: collaborator.id,
        name: collaborator.name,
        contactUrl: collaborator.contact_url ?? '',
        displayOrder: collaborator.display_order,
      })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeLinks(links = []) {
  return links
    .map((link) => ({
      label: String(link.label ?? '').trim(),
      url: String(link.url ?? '').trim(),
    }))
    .filter((link) => link.label && link.url)
    .slice(0, 8);
}

function normalizeCollaborators(collaborators = []) {
  return collaborators
    .map((collaborator) => ({
      name: String(
        typeof collaborator === 'string'
          ? collaborator
          : collaborator?.name ?? ''
      ).trim(),
      contactUrl: String(
        typeof collaborator === 'string'
          ? ''
          : collaborator?.contactUrl ?? ''
      ).trim(),
    }))
    .filter((collaborator) => collaborator.name)
    .slice(0, 12);
}

async function insertProjectRelations(projectId, links, collaborators) {
  if (links.length > 0) {
    const { error } = await supabase.from('project_links').insert(
      links.map((link, index) => ({
        project_id: projectId,
        label: link.label,
        url: link.url,
        display_order: index,
      }))
    );

    if (error) throw error;
  }

  if (collaborators.length > 0) {
    const { error } = await supabase
      .from('project_collaborators')
      .insert(
        collaborators.map((collaborator, index) => ({
          project_id: projectId,
          name: collaborator.name,
          contact_url: collaborator.contactUrl || null,
          display_order: index,
        }))
      );

    if (error) throw error;
  }
}

async function insertProjectImages(projectId, imageUrls) {
  if (imageUrls.length === 0) return;

  const { error } = await supabase.from('project_images').insert(
    imageUrls.map((imageUrl, index) => ({
      project_id: projectId,
      image_url: imageUrl,
      display_order: index,
    }))
  );

  if (error) throw error;
}

export async function fetchProjectsByFreelancerId(freelancerId) {
  if (!supabase || !freelancerId) return [];

  const { data, error } = await supabase
    .from('projects')
    .select(PROJECT_SELECT)
    .eq('freelancer_id', freelancerId)
    .order('updated_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map(normalizeProject);
}

export async function createProject({
  freelancerId,
  title,
  description,
  projectUrl = '',
  imageFiles = [],
  links = [],
  collaborators = [],
}) {
  if (!supabase) {
    throw new Error('Supabase no está conectado.');
  }

  if (!freelancerId) {
    throw new Error('No se encontró el dueño del proyecto.');
  }

  if (title.trim().length < 2) {
    throw new Error('El título debe tener al menos 2 caracteres.');
  }

  if (imageFiles.length === 0) {
    throw new Error('Agrega al menos una imagen al proyecto.');
  }

  if (imageFiles.length > 12) {
    throw new Error('Puedes agregar hasta 12 imágenes por proyecto.');
  }

  imageFiles.forEach(assertProjectImage);

  let uploadedUrls = [];

  try {
    uploadedUrls = await uploadFiles('service-images', imageFiles);

    const { data, error } = await supabase
      .from('projects')
      .insert({
        freelancer_id: freelancerId,
        title: title.trim(),
        description: description.trim(),
        project_url: projectUrl.trim() || null,
      })
      .select('id')
      .single();

    if (error) throw error;

    const normalizedLinks = normalizeLinks(links);
    const normalizedCollaborators = normalizeCollaborators(collaborators);

    await insertProjectImages(data.id, uploadedUrls);
    await insertProjectRelations(
      data.id,
      normalizedLinks,
      normalizedCollaborators
    );

    const projects = await fetchProjectsByFreelancerId(freelancerId);
    return projects.find((project) => project.id === data.id);
  } catch (error) {
    try {
      await removePublicFiles('service-images', uploadedUrls);
    } catch (cleanupError) {
      console.error('No se pudieron limpiar las imágenes del proyecto:', cleanupError);
    }

    throw error;
  }
}

export async function updateProject({
  projectId,
  freelancerId,
  title,
  description,
  projectUrl = '',
  existingImageUrls = [],
  newImageFiles = [],
  removedImageUrls = [],
  links = [],
  collaborators = [],
}) {
  if (!supabase) {
    throw new Error('Supabase no está conectado.');
  }

  if (!projectId || !freelancerId) {
    throw new Error('No se encontró el proyecto que deseas editar.');
  }

  if (title.trim().length < 2) {
    throw new Error('El título debe tener al menos 2 caracteres.');
  }

  if (existingImageUrls.length + newImageFiles.length === 0) {
    throw new Error('El proyecto debe conservar al menos una imagen.');
  }

  if (existingImageUrls.length + newImageFiles.length > 12) {
    throw new Error('Puedes tener hasta 12 imágenes por proyecto.');
  }

  newImageFiles.forEach(assertProjectImage);

  let uploadedUrls = [];

  try {
    uploadedUrls = await uploadFiles('service-images', newImageFiles);
    const nextImageUrls = [...existingImageUrls, ...uploadedUrls];

    const { error } = await supabase
      .from('projects')
      .update({
        title: title.trim(),
        description: description.trim(),
        project_url: projectUrl.trim() || null,
      })
      .eq('id', projectId)
      .eq('freelancer_id', freelancerId);

    if (error) throw error;

    const relationTables = [
      'project_images',
      'project_links',
      'project_collaborators',
    ];

    for (const table of relationTables) {
      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .eq('project_id', projectId);

      if (deleteError) throw deleteError;
    }

    await insertProjectImages(projectId, nextImageUrls);
    await insertProjectRelations(
      projectId,
      normalizeLinks(links),
      normalizeCollaborators(collaborators)
    );

    try {
      await removePublicFiles('service-images', removedImageUrls);
    } catch (cleanupError) {
      console.error('No se pudieron eliminar imágenes anteriores:', cleanupError);
    }

    const projects = await fetchProjectsByFreelancerId(freelancerId);
    return projects.find((project) => project.id === projectId);
  } catch (error) {
    try {
      await removePublicFiles('service-images', uploadedUrls);
    } catch (cleanupError) {
      console.error('No se pudieron limpiar las imágenes nuevas:', cleanupError);
    }

    throw error;
  }
}

export async function deleteProject({ projectId, freelancerId }) {
  if (!supabase) {
    throw new Error('Supabase no está conectado.');
  }

  const { data, error: fetchError } = await supabase
    .from('projects')
    .select(`freelancer_id, project_images ( image_url )`)
    .eq('id', projectId)
    .eq('freelancer_id', freelancerId)
    .single();

  if (fetchError) throw fetchError;

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('freelancer_id', freelancerId);

  if (error) throw error;

  try {
    await removePublicFiles(
      'service-images',
      (data.project_images ?? []).map((image) => image.image_url)
    );
  } catch (cleanupError) {
    console.error('El proyecto se eliminó, pero no se limpiaron todas sus imágenes:', cleanupError);
  }
}
