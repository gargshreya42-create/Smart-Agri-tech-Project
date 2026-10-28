import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore } from '../services/api';
import { useLanguage } from './LanguageContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(Boolean(tokenStore.get()));
  const { setLanguage } = useLanguage();

  const applyUser = useCallback((nextUser) => {
    setUser(nextUser);
    if (nextUser && nextUser.language) setLanguage(nextUser.language);
  }, [setLanguage]);

  // Restore the session from a stored token.
  useEffect(() => {
    if (!tokenStore.get()) return;
    api.get('/auth/me')
      .then((res) => applyUser(res.data.user))
      .catch(() => tokenStore.clear())
      .finally(() => setBooting(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The API client fires this when a token is rejected (expired, revoked, account deactivated).
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const login = useCallback(async (identifier, password) => {
    const res = await api.post('/auth/login', { identifier, password });
    tokenStore.set(res.data.token);
    applyUser(res.data.user);
    return res.data.user;
  }, [applyUser]);

  const register = useCallback(async (payload) => {
    const res = await api.post('/auth/register', payload);
    tokenStore.set(res.data.token);
    applyUser(res.data.user);
    return res.data.user;
  }, [applyUser]);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch { /* token may already be invalid */ }
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, booting, isAdmin: user?.role === 'admin', login, register, logout, setUser: applyUser }),
    [user, booting, login, register, logout, applyUser]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
