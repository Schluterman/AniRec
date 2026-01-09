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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

function AppContent() {
  const [userName, setUserName] = useState('ZorgBurg');
  const [searchedUser, setSearchedUser] = useState('ZorgBurg');
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

  const { isLoading: isLoadingList, error: listError } = useUserAnimeList(searchedUser);
  const processedData = useProcessedUserData(searchedUser);
  const {
    filteredMedia,
    isLoading: isLoadingRecs,
  } = useRecommendations(processedData, []);

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
    }
  }, [userName]);

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
              />
            </div>
          </div>
        )}
      </main>

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
