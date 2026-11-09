const CHATBOT_THEMES = { '/unid': 'unid' };

export function resolveChatbotTheme(pathname) {
  const path = (pathname || '/').replace(/\/$/, '') || '/';
  return Object.entries(CHATBOT_THEMES).find(([prefix]) =>
    path === prefix || path.startsWith(prefix + '/'))?.[1] || 'default';
}
