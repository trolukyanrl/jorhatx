import { createContext } from 'react';

export const AuthContext = createContext({
  handleLoginSuccess: () => {},
  handleLogout: async () => ({ success: true }),
});

