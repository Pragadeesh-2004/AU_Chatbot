import { useEffect, useState } from 'react';
export function useAuthRedirect(redirectTo = '/modules/authentication') {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/auth/me`, { credentials: 'include' })
      .then(r => r.json())
      .then(json => {
        if (!json?.user) window.location.href = redirectTo;
      })
      .catch(() => (window.location.href = redirectTo))
      .finally(() => setLoading(false));
  }, [redirectTo]);
  return loading;
}