import { createContext } from 'react';
import type { Dispatch, FormEvent, SetStateAction } from 'react';
import type { Media } from '../types/anime';
import type { ActivePackId } from '../types/packs';

export interface SessionContextValue {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  userName: string;
  setUserName: (v: string) => void;
  searchedUser: string;
  setSearchedUser: (v: string) => void;
  dismissedIds: Set<number>;
  setDismissedIds: Dispatch<SetStateAction<Set<number>>>;
  watchlist: Map<number, Pick<Media, 'id' | 'title' | 'coverImage'>>;
  setWatchlist: Dispatch<SetStateAction<Map<number, Pick<Media, 'id' | 'title' | 'coverImage'>>>>;
  activePackId: ActivePackId;
  setActivePackId: Dispatch<SetStateAction<ActivePackId>>;
  boosterSheetOpen: boolean;
  setBoosterSheetOpen: (v: boolean) => void;
  selectedAnime: Media | null;
  setSelectedAnime: (v: Media | null) => void;
  handleSearch: (e: FormEvent) => void;
  handleThumbsUp: (anime: Media) => void;
  handleThumbsDown: (anime: Media) => void;
  selectPack: (id: ActivePackId) => void;
}

export const SessionContext = createContext<SessionContextValue | null>(null);
