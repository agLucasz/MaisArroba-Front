import React, { createContext, useContext, useEffect, useState } from 'react';
import { compradorService, type CompradorPerfilDTO } from '../Services/compradorService';

interface CompradorContextValue {
  comprador:  CompradorPerfilDTO | null;
  token:      string | null;
  isLoggedIn: boolean;
  login:      (token: string) => Promise<void>;
  logout:     () => void;
}

const CompradorContext = createContext<CompradorContextValue | null>(null);

const TOKEN_KEY = 'comprador_token';

export const CompradorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token,     setToken]     = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [comprador, setComprador] = useState<CompradorPerfilDTO | null>(null);

  useEffect(() => {
    if (!token) { setComprador(null); return; }
    compradorService.getPerfil(token)
      .then(setComprador)
      .catch(() => { localStorage.removeItem(TOKEN_KEY); setToken(null); });
  }, [token]);

  const login = async (newToken: string) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    const perfil = await compradorService.getPerfil(newToken);
    setComprador(perfil);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setComprador(null);
  };

  return (
    <CompradorContext.Provider value={{ comprador, token, isLoggedIn: !!token, login, logout }}>
      {children}
    </CompradorContext.Provider>
  );
};

export const useComprador = () => {
  const ctx = useContext(CompradorContext);
  if (!ctx) throw new Error('useComprador must be used inside CompradorProvider');
  return ctx;
};
