/** Minimal hash-based router for the static pages (#/dashboard, #/share/<id>, ...). */

export type RouteName =
  | 'home'
  | 'features'
  | 'analyzing'
  | 'result'
  | 'share'
  | 'dashboard'
  | 'docs'
  | 'playground'
  | 'status'
  | 'privacy'
  | 'terms'
  | 'compare'
  | 'video'
  | 'source'
  | 'widget'
  | 'calibration'
  | 'notfound';

export interface Route {
  name: RouteName;
  shareId?: string;
}

export function parseHash(): Route | null {
  const raw = window.location.hash.replace(/^#\/?/, '');
  if (!raw) return null;
  const [seg, param] = raw.split('/');
  if (seg === 'share' && param) return { name: 'share', shareId: param };
  if (seg === 'home') return null;
  const known: RouteName[] = ['features', 'dashboard', 'docs', 'playground', 'status', 'privacy', 'terms', 'compare', 'video', 'source', 'widget', 'calibration'];
  if (known.includes(seg as RouteName)) return { name: seg as RouteName };
  return { name: 'notfound' };
}

export function navigate(route: RouteName | string): void {
  if (route === 'home') {
    window.location.hash = '#/';
  } else {
    window.location.hash = route.startsWith('#') ? route : `#/${route}`;
  }
}
