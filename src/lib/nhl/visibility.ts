'use client';

import { useEffect, useState } from 'react';

function getVisibility(): boolean {
  if (typeof document === 'undefined') return true;
  return document.visibilityState === 'visible';
}

export function useVisibility(): boolean {
  const [visible, setVisible] = useState(getVisibility);

  useEffect(() => {
    const handler = () => setVisible(getVisibility());
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  return visible;
}

export function usePollingInterval(ms: number | false): number | false {
  const visible = useVisibility();
  return visible ? ms : false;
}
