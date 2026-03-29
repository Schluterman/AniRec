import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Media } from '../types/anime';
import type { ActivePackId } from '../types/packs';
import { SessionContext, type SessionContextValue } from './session-context';

const WATCHLIST_KEY = 'aniRec_watchlist';

function loadWatchlist(): Map<number, Pick<Media, 'id' | 'title' | 'coverImage'>> {
  try {
    const raw = localStorage.getItem(WATCHLIST_KEY);
    if (!raw) return new Map();
    const entries = JSON.parse(raw) as [number, Pick<Media, 'id' | 'title' | 'coverImage'>][];
    return new Map(entries);
  } catch {
    return new Map();
  }
}

function saveWatchlist(map: Map<number, Pick<Media, 'id' | 'title' | 'coverImage'>>) {
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify([...map.entries()]));
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [userName, setUserName] = useState('');
  const [searchedUser, setSearchedUser] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as 'dark' | 'light') || 'dark';
  });
  const [activePackId, setActivePackId] = useState<ActivePackId>('anirec');
  const [boosterSheetOpen, setBoosterSheetOpen] = useState(false);
  const [selectedAnime, setSelectedAnime] = useState<Media | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());
  const [watchlist, setWatchlist] = useState<Map<number, Pick<Media, 'id' | 'title' | 'coverImage'>>>(() =>
    loadWatchlist()
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim()) {
      setSearchedUser(userName.trim());
      setDismissedIds(new Set());
    }
  }, [userName]);

  const handleThumbsUp = useCallback((anime: Media) => {
    setDismissedIds(prev => new Set([...prev, anime.id]));
    setWatchlist(prev => {
      const next = new Map(prev);
      next.set(anime.id, { id: anime.id, title: anime.title, coverImage: anime.coverImage });
      saveWatchlist(next);
      return next;
    });
  }, []);

  const handleThumbsDown = useCallback((anime: Media) => {
    setDismissedIds(prev => new Set([...prev, anime.id]));
  }, []);

  const selectPack = useCallback((id: ActivePackId) => {
    setActivePackId(id);
    setBoosterSheetOpen(false);
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      theme,
      toggleTheme,
      userName,
      setUserName,
      searchedUser,
      setSearchedUser,
      dismissedIds,
      setDismissedIds,
      watchlist,
      setWatchlist,
      activePackId,
      setActivePackId,
      boosterSheetOpen,
      setBoosterSheetOpen,
      selectedAnime,
      setSelectedAnime,
      handleSearch,
      handleThumbsUp,
      handleThumbsDown,
      selectPack,
    }),
    [
      theme,
      toggleTheme,
      userName,
      searchedUser,
      dismissedIds,
      watchlist,
      activePackId,
      boosterSheetOpen,
      selectedAnime,
      handleSearch,
      handleThumbsUp,
      handleThumbsDown,
      selectPack,
    ]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
