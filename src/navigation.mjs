import {sections} from './content/portfolio.mjs';
export const paths=['/','/atlas',...sections.map(section=>'/'+section.id)];
export const legacyRoutes={'/research':'/projects','/roots':'/about','/making':'/about','/setup':'/about','/stories':'/about'};
export function readRoute(pathname){
 const path=pathname.replace(/\/+$/,'')||'/';
 return legacyRoutes[path]||(paths.includes(path)?path:'not-found');
}
// Let the browser handle new tabs, downloads, and non-primary clicks.
export function followLink(event, path, navigate) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || (event.currentTarget.target && event.currentTarget.target !== '_self')) return;
  event.preventDefault();
  navigate(path);
}

// Retain the optional comparison view through native links and new tabs.
export function routeHref(path, search='') {
  const mode=new URLSearchParams(search).get('reveal');
  return path+(['section','blend'].includes(mode)?'?reveal='+mode:'');
}
