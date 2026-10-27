import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface FavoritesContextType {
  favorites: number[];
  addFavorite: (placeId: number) => void;
  removeFavorite: (placeId: number) => void;
  isFavorite: (placeId: number) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<number[]>(() => {
    const saved = localStorage.getItem('@TruAcess:favoritos');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('@TruAcess:favoritos', JSON.stringify(favorites));
  }, [favorites]);

  const addFavorite = (placeId: number) => {
    if (!favorites.includes(placeId)) setFavorites([...favorites, placeId]);
  };

  const removeFavorite = (placeId: number) => {
    setFavorites(favorites.filter(id => id !== placeId));
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