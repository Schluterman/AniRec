import { useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { PackShop } from '../components/PackShop';
import { BoosterSheet } from '../components/BoosterSheet';
import { LandingHero } from '../components/LandingHero';
import { AnimeRoulette } from '../components/AnimeRoulette';
import { AnimeModal } from '../components/AnimeModal';
import { useUserAnimeList, useProcessedUserData, useRecommendations } from '../hooks/useAnimeData';
import { getStreamingServicesForAnime } from '../api/anilist';
import { STREAMING_SERVICES } from '../types/anime';
import { getPackArt } from '../data/packAssets';
import { useSession } from '../context/useSession';
import '../App.css';

export function HomePage() {
  const navigate = useNavigate();

  const {
    theme,
    toggleTheme,
    userName,
    setUserName,
    searchedUser,
    dismissedIds,
    watchlist,
    activePackId,
    selectPack,
    boosterSheetOpen,
    setBoosterSheetOpen,
    selectedAnime,
    setSelectedAnime,
    handleSearch,
    handleThumbsUp,
    handleThumbsDown,
  } = useSession();

  const { isLoading: isLoadingList, error: listError } = useUserAnimeList(searchedUser);
  const processedData = useProcessedUserData(searchedUser);
  const { filteredMedia, isLoading: isLoadingRecs } = useRecommendations(processedData, [], dismissedIds);

  const finalFilteredMedia = useMemo(() => {
    if (activePackId === 'planning' && processedData) {
      return processedData.byStatus.planning.map(e => e.media);
    }
    if (activePackId === 'anirec') return filteredMedia;
    return filteredMedia.filter(a => {
      const services = getStreamingServicesForAnime(a);
      return services.some(s => s.id === activePackId);
    });
  }, [filteredMedia, activePackId, processedData]);

  const isLoading = isLoadingList || isLoadingRecs;

  const packArt = getPackArt(activePackId);
  const activePackThumb = packArt.front;
  const activePackLabel =
    activePackId === 'anirec'
      ? 'AniRec Pack'
      : activePackId === 'planning'
        ? 'Planning Pack'
        : `${STREAMING_SERVICES.find(s => s.id === activePackId)?.name ?? activePackId} Pack`;

  const packShopShared = {
    activePackId,
    onSelectPack: selectPack,
  };

  const themeToggleButton = (
    <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
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
  );

  const landingHeaderChrome = (
    <header className="app-header app-header--landing app-header--body-root">
      <div className="header-content container">
        <Link to="/" className="logo">
          <img src="/AniRecLogoText.png" alt="AniRec" className="logo-image" />
        </Link>
        <div className="header-actions">{themeToggleButton}</div>
      </div>
    </header>
  );

  const handleSwitchPack = useCallback(() => {
    navigate('/card-shop', { state: { prefilledUsername: searchedUser } });
  }, [navigate, searchedUser]);

  return (
    <>
      {!searchedUser && createPortal(landingHeaderChrome, document.body)}

      <div className={`app ${searchedUser ? 'app--session' : 'app--landing'}`}>
        {searchedUser ? (
          <header className="app-header">
            <div className="header-content container">
              <Link to="/" className="logo">
                <img src="/AniRecLogoText.png" alt="AniRec" className="logo-image" />
              </Link>

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
                      placeholder="AniList username…"
                      value={userName}
                      onChange={e => setUserName(e.target.value)}
                      autoComplete="username"
                    />
                  </div>
                  <button type="submit" className="search-button" disabled={isLoading && !!searchedUser}>
                    {isLoading && searchedUser
                      ? <><span className="btn-spinner" />{' Loading…'}</>
                      : 'Search'}
                  </button>
                </form>
              </div>

              <div className="header-actions">
                {watchlist.size > 0 && (
                  <div className="watchlist-badge" title="Saved to Watchlist">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden>
                      <path d="M2 20h2c.55 0 1-.45 1-1v-9c0-.55-.45-1-1-1H2v11zm19.83-7.12c.11-.25.17-.52.17-.8V11c0-1.1-.9-2-2-2h-5.5l.92-4.65c.05-.22.02-.46-.08-.66-.23-.45-.52-.86-.88-1.22L14 2 7.59 8.41C7.21 8.79 7 9.3 7 9.83V19c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3-7.09z" />
                    </svg>
                    <span>{watchlist.size}</span>
                  </div>
                )}
                {themeToggleButton}
              </div>
            </div>
          </header>
        ) : null}

        {!searchedUser && !isLoading && <LandingHero />}

        {searchedUser && (
          <main className="main-content container">
            {listError ? (
              <div className="error-state" role="alert">
                <div className="error-icon-wrap" aria-hidden>
                  <svg className="error-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <circle cx="12" cy="16" r="0.5" fill="currentColor" stroke="none" />
                  </svg>
                </div>
                <h2 className="error-title">Couldn&apos;t load that profile</h2>
                <p className="error-message">
                  {listError instanceof Error ? listError.message : 'User not found or API error'}
                </p>
                <p className="error-hint">Check the username and that the AniList profile is public.</p>
                <p className="error-hint" style={{ marginTop: '1rem' }}>
                  <Link to="/card-shop">Go to Card Market</Link> to try again.
                </p>
              </div>
            ) : (
              <>
                <div className="mobile-booster-bar">
                  <button
                    type="button"
                    className="mobile-booster-chip"
                    onClick={() => setBoosterSheetOpen(true)}
                  >
                    <span
                      className="mobile-booster-thumb"
                      style={{ backgroundImage: `url(${activePackThumb})` }}
                      aria-hidden
                    />
                    <span className="mobile-booster-label">
                      <span className="mobile-booster-kicker">Active booster</span>
                      <span className="mobile-booster-name">{activePackLabel}</span>
                    </span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                </div>

                <div className="content-grid">
                  <div className="content-left">
                    <div className="pack-shop--sidebar-only">
                      <PackShop {...packShopShared} />
                    </div>
                  </div>

                  <div className="content-right">
                    <AnimeRoulette
                      key={activePackId}
                      anime={finalFilteredMedia}
                      processedData={processedData}
                      isLoading={isLoading}
                      packArt={packArt}
                      onAnimeClick={setSelectedAnime}
                      onThumbsUp={handleThumbsUp}
                      onThumbsDown={handleThumbsDown}
                      onSwitchPack={handleSwitchPack}
                    />
                  </div>
                </div>

                <BoosterSheet
                  open={boosterSheetOpen}
                  onClose={() => setBoosterSheetOpen(false)}
                  packShopProps={packShopShared}
                />
              </>
            )}
          </main>
        )}

        <footer className="app-footer">
          <div className="container">
            <p>
              Built with care using the{' '}
              <a href="https://anilist.gitbook.io/anilist-apiv2-docs" target="_blank" rel="noopener noreferrer">
                AniList API
              </a>
            </p>
            <p className="footer-disclaimer">Streaming data from AniList may be incomplete.</p>
          </div>
        </footer>

        <AnimeModal anime={selectedAnime} processedData={processedData} onClose={() => setSelectedAnime(null)} />
      </div>
    </>
  );
}
