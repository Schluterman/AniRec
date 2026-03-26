import { useState, useCallback, useEffect, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserStats } from './components/UserStats';
import { FilterPanel } from './components/FilterPanel';
import { AnimeRoulette } from './components/AnimeRoulette';
import { AnimeModal } from './components/AnimeModal';
import { useUserAnimeList, useProcessedUserData, useRecommendations } from './hooks/useAnimeData';
import { getStreamingServicesForAnime } from './api/anilist';
import type { Media, StreamingServiceId } from './types/anime';
import './App.css';

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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

function AppContent() {
  const [userName, setUserName] = useState('');
  const [searchedUser, setSearchedUser] = useState('');
  const [selectedAnime, setSelectedAnime] = useState<Media | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as 'dark' | 'light') || 'dark';
  });

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  // Filter state
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<StreamingServiceId[]>([]);
  const [genresExpanded, setGenresExpanded] = useState(false);

  // Session-level dismissed IDs (thumbs down or thumbs up both remove from pool)
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());

  // Persisted watchlist (thumbs up)
  const [watchlist, setWatchlist] = useState<Map<number, Pick<Media, 'id' | 'title' | 'coverImage'>>>(() => loadWatchlist());

  const { isLoading: isLoadingList, error: listError } = useUserAnimeList(searchedUser);
  const processedData = useProcessedUserData(searchedUser);
  const {
    filteredMedia,
    isLoading: isLoadingRecs,
  } = useRecommendations(processedData, [], dismissedIds);

  // Apply filters to the media
  const finalFilteredMedia = useMemo(() => {
    let result = filteredMedia;
    if (selectedGenres.length > 0) {
      result = result.filter(a => a.genres.some(g => selectedGenres.includes(g)));
    }
    if (selectedServices.length > 0) {
      result = result.filter(a => {
        const services = getStreamingServicesForAnime(a);
        return services.some(s => selectedServices.includes(s.id));
      });
    }
    return result;
  }, [filteredMedia, selectedGenres, selectedServices]);

  const toggleGenre = useCallback((genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  }, []);

  const toggleService = useCallback((serviceId: StreamingServiceId) => {
    setSelectedServices(prev =>
      prev.includes(serviceId) ? prev.filter(s => s !== serviceId) : [...prev, serviceId]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedGenres([]);
    setSelectedServices([]);
  }, []);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim()) {
      setSearchedUser(userName.trim());
      setDismissedIds(new Set()); // Reset session dismissals on new user search
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

  // Hero search (separate input in landing state)
  const [heroUserName, setHeroUserName] = useState('');
  const handleHeroSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = heroUserName.trim();
    if (trimmed) {
      setUserName(trimmed);
      setSearchedUser(trimmed);
      setDismissedIds(new Set());
    }
  }, [heroUserName]);

  const isLoading = isLoadingList || isLoadingRecs;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content container">
          <a href="/" className="logo">
            <img
              src="/AniRecLogoText.png"
              alt="AniRec"
              className="logo-image" />
          </a>

          <div className="header-search">
            <form className="search-form" onSubmit={handleSearch}>
              <div className="search-input-wrapper">
                <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Enter AniList username..."
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                />
              </div>
              <button type="submit" className="search-button" disabled={isLoading}>
                {isLoading ? 'Loading...' : 'Search'}
              </button>
            </form>
          </div>

          <div className="header-actions">
            {watchlist.size > 0 && (
              <div className="watchlist-badge" title="Saved to Watchlist">
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M2 20h2c.55 0 1-.45 1-1v-9c0-.55-.45-1-1-1H2v11zm19.83-7.12c.11-.25.17-.52.17-.8V11c0-1.1-.9-2-2-2h-5.5l.92-4.65c.05-.22.02-.46-.08-.66-.23-.45-.52-.86-.88-1.22L14 2 7.59 8.41C7.21 8.79 7 9.3 7 9.83V19c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3-7.09z"/>
                </svg>
                <span>{watchlist.size}</span>
              </div>
            )}
            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero — shown when no user has been searched yet */}
      {!searchedUser && !isLoading && (
        <main className="hero-section">
          <div className="hero-content animate-fade-up">
            <div className="hero-eyebrow">
              <span className="hero-eyebrow-dot" />
              Powered by your AniList profile
            </div>

            <h1 className="hero-title">
              Discover your next<br />
              <span className="hero-title-gradient">anime obsession</span>
            </h1>

            <p className="hero-subtitle">
              Enter your AniList username. We analyse your watch history, uncover your taste DNA, and deal you a personalised card from the anime universe.
            </p>

            <form className="hero-search-form" onSubmit={handleHeroSearch}>
              <div className="hero-search-wrapper">
                <svg className="hero-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  className="hero-search-input"
                  placeholder="Your AniList username…"
                  value={heroUserName}
                  onChange={e => setHeroUserName(e.target.value)}
                  autoFocus
                />
              </div>
              <button type="submit" className="hero-search-btn" disabled={!heroUserName.trim()}>
                Let's Go
              </button>
            </form>

            <div className="hero-steps">
              <div className="hero-step">
                <div className="step-icon step-icon-1">🔍</div>
                <span className="step-title">Connect Profile</span>
                <span className="step-desc">We read your public AniList watch history</span>
              </div>
              <div className="hero-step">
                <div className="step-icon step-icon-2">🧠</div>
                <span className="step-title">Analyse Taste</span>
                <span className="step-desc">Genres, tags, ratings &amp; recent trends</span>
              </div>
              <div className="hero-step">
                <div className="step-icon step-icon-3">🃏</div>
                <span className="step-title">Open Your Pack</span>
                <span className="step-desc">Pull a personalised card &amp; decide to watch</span>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* App — shown once a user is searched */}
      {searchedUser && (
        <main className="main-content container">
          {listError ? (
            <div className="error-state">
              <div className="error-icon">⚠️</div>
              <h2 className="error-title">Failed to load user data</h2>
              <p className="error-message">
                {listError instanceof Error ? listError.message : 'User not found or API error'}
              </p>
              <p className="error-hint">
                Make sure the username exists and the profile is public on AniList.
              </p>
            </div>
          ) : (
            <div className="content-grid">
              <div className="content-left">
                {processedData && (
                  <UserStats data={processedData} userName={searchedUser} />
                )}
                <FilterPanel
                  selectedGenres={selectedGenres}
                  selectedServices={selectedServices}
                  onToggleGenre={toggleGenre}
                  onToggleService={toggleService}
                  onClearFilters={clearFilters}
                  filteredCount={finalFilteredMedia.length}
                  genresExpanded={genresExpanded}
                  onToggleGenresExpanded={() => setGenresExpanded(prev => !prev)}
                />
              </div>

              <div className="content-right">
                <AnimeRoulette
                  anime={finalFilteredMedia}
                  processedData={processedData}
                  isLoading={isLoading}
                  onAnimeClick={setSelectedAnime}
                  onThumbsUp={handleThumbsUp}
                  onThumbsDown={handleThumbsDown}
                />
              </div>
            </div>
          )}
        </main>
      )}

      <footer className="app-footer">
        <div className="container">
          <p>
            Built with ♥ using the{' '}
            <a href="https://anilist.gitbook.io/anilist-apiv2-docs" target="_blank" rel="noopener noreferrer">
              AniList API
            </a>
          </p>
          <p className="footer-disclaimer">
            Streaming availability data is sourced from AniList and may not be complete.
          </p>
        </div>
      </footer>

      <AnimeModal
        anime={selectedAnime}
        processedData={processedData}
        onClose={() => setSelectedAnime(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
