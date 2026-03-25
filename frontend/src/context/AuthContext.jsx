import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('rhms_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('rhms_token');
    if (token) {
      authAPI.getMe()
        .then(res => setUser(res.data.data.user))
        .catch(() => {
          localStorage.removeItem('rhms_token');
          localStorage.removeItem('rhms_user');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password, worker_id) => {
    const res = await authAPI.login({ email, password, worker_id });

    const { user, token } = res.data.data;
    localStorage.setItem('rhms_token', token);
    localStorage.setItem('rhms_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('rhms_token');
    localStorage.removeItem('rhms_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};