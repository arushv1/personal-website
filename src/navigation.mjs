export const paths = ['/', '/atlas', '/research', '/roots', '/making', '/setup', '/stories', '/about'];
export function readRoute(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/';
  return paths.includes(path) ? path : 'not-found';
}
// Let the browser handle new tabs, downloads, and non-primary clicks.
export function followLink(event, path, navigate) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || (event.currentTarget.target && event.currentTarget.target !== '_self')) return;
  event.preventDefault();
  navigate(path);
}
