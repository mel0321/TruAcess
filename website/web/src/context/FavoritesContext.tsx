import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface FavoritesContextType {
  favorites: number[];
  addFavorite: (placeId: number) => boolean;
  removeFavorite: (placeId: number) => void;
  isFavorite: (placeId: number) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const favoritesKey = user ? `@TruAcess:favoritos:${user.id}` : null;

  const [favorites, setFavorites] = useState<number[]>(() => {
    if (!user || !favoritesKey) return [];
    const saved = localStorage.getItem(favoritesKey);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (!user || !favoritesKey) {
      setFavorites([]);
      return;
    }

    const saved = localStorage.getItem(favoritesKey);
    setFavorites(saved ? JSON.parse(saved) : []);
  }, [user, favoritesKey]);

  useEffect(() => {
    if (!user || !favoritesKey) return;
    localStorage.setItem(favoritesKey, JSON.stringify(favorites));
  }, [favorites, user, favoritesKey]);

  const addFavorite = (placeId: number) => {
    if (!user) return false;

    setFavorites((current) => {
      if (current.includes(placeId)) return current;
      return [...current, placeId];
    });

    return true;
  };

  const removeFavorite = (placeId: number) => {
    setFavorites((current) => current.filter((id) => id !== placeId));
  };

  const isFavorite = (placeId: number) => favorites.includes(placeId);

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites deve ser usado dentro de FavoritesProvider');
  return context;
};