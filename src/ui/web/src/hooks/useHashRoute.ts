import { useEffect, useState } from 'react';

export type RouteKey = 'coach' | 'analyst' | 'library' | 'reports' | 'settings';

const routes: RouteKey[] = ['coach', 'analyst', 'library', 'reports', 'settings'];

const getRouteFromHash = (): RouteKey => {
  const hash = window.location.hash.replace('#', '').trim();
  if (routes.includes(hash as RouteKey)) {
    return hash as RouteKey;
  }
  return 'coach';
};

export const useHashRoute = () => {
  const [route, setRoute] = useState<RouteKey>(() => getRouteFromHash());

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(getRouteFromHash());
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (!window.location.hash) {
      window.location.hash = '#coach';
    }
  }, []);

  return route;
};
