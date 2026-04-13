import { useState, useMemo, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { STREAMING_SERVICES } from '../types/anime';
import type { ActivePackId } from '../types/packs';
import type { CardShopLocationState } from '../types/navigation';
import { getPackArt } from '../data/packAssets';
import { StreamingIcon } from '../components/StreamingIcons';
import { PackRevealOverlay } from '../components/PackRevealOverlay';
import { computePoolCounts } from '../utils/packPoolCounts';
import { useSession } from '../context/useSession';
import { useUserAnimeList, useProcessedUserData, useRecommendations } from '../hooks/useAnimeData';
import '../components/LandingHero.css';
import './CardShopPage.css';

const MASTER_LABEL = 'AniRec Pack';
const MASTER_SUB = 'All streaming sources';
const PLANNING_LABEL = 'Planning Pack';
const PLANNING_SUB = 'Matches on your Plan to Watch';

function PlanningPackIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  );
}

type CatalogRow = { id: ActivePackId; title: string; subtitle: string; icon: ReactNode };

function buildCatalog(): CatalogRow[] {
  const rows: CatalogRow[] = [
    { id: 'anirec', title: MASTER_LABEL, subtitle: MASTER_SUB, icon: null },
    { id: 'planning', title: PLANNING_LABEL, subtitle: PLANNING_SUB, icon: <PlanningPackIcon size={28} /> },
  ];
  for (const s of STREAMING_SERVICES) {
    rows.push({
      id: s.id,
      title: `${s.name} Pack`,
      subtitle: `${s.name} catalog`,
      icon: <StreamingIcon serviceId={s.id} size={28} />,
    });
  }
  return rows;
}

const CATALOG = buildCatalog();

export function CardShopPage() {
  const location = useLocation();
  const state = location.state as CardShopLocationState | null;
  const prefilledUsername = state?.prefilledUsername?.trim();
  const prefillKey = prefilledUsername ?? '__none__';
  return (
    <CardShopPageInner key={prefillKey} initialShopUserName={prefilledUsername ?? ''} />
  );
}

function CardShopPageInner({ initialShopUserName }: { initialShopUserName: string }) {
  const {
    theme,
    toggleTheme,
  } = useSession();

  // ── Step-1 state: the username the user types in the shop form
  const [shopUserName, setShopUserName] = useState(initialShopUserName);
  // ── Step-1 state: the verified username (set when Search is confirmed)
  const [verifiedUsername, setVerifiedUsername] = useState(initialShopUserName);
  const [selectedPackId, setSelectedPackId] = useState<ActivePackId>('anirec');
  // ── Step-2 state: open the overlay when checkout is clicked
  const [revealState, setRevealState] = useState<{ username: string; packId: ActivePackId } | null>(null);

  // Data fetch — only active when verifiedUsername is set
  const { isLoading: isLoadingList, error: listError } = useUserAnimeList(verifiedUsername);
  const processedData = useProcessedUserData(verifiedUsername);
  const { filteredMedia, isLoading: isLoadingRecs } = useRecommendations(
    processedData,
    [],
    new Set() // fresh set — dismissed tracked per overlay session
  );

  const isLoading = isLoadingList || isLoadingRecs;
  const profileReady = !!verifiedUsername && !isLoading && !listError;

  // Pool counts per pack — used to disable empty tiles
  const poolCounts = useMemo(
    () => profileReady ? computePoolCounts(filteredMedia, processedData) : null,
    [filteredMedia, processedData, profileReady]
  );

  // ── Step 1: verify username
  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = shopUserName.trim();
    if (!trimmed) return;
    setVerifiedUsername(trimmed);
  };

  // ── Step 2: open overlay
  const handleCheckout = () => {
    if (!verifiedUsername || !profileReady) return;
    setRevealState({ username: verifiedUsername, packId: selectedPackId });
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

  const landingHeader = (
    <header className="app-header app-header--landing">
      <div className="header-content container">
        <Link to="/" className="logo">
          <img src="/AniRecLogoText.png" alt="AniRec" className="logo-image" />
        </Link>
        <div className="header-actions">{themeToggleButton}</div>
      </div>
    </header>
  );

  return (
    <>
      <div className="app app--card-shop app--landing">
        {landingHeader}

        <main className="card-shop-page">
          <section className="card-shop-hero" aria-labelledby="card-shop-hero-title">
            <div className="card-shop-hero-bg" aria-hidden />

            <div className="container card-shop-hero-stack">
              <div className="card-shop-hero-panel">
                <div className="landing-hero-inner card-shop-hero-landing-inner">
                  <h1 id="card-shop-hero-title" className="landing-headline">
                    Introducing
                    <span className="landing-headline-accent">Card Market</span>
                  </h1>

                  <p className="landing-lede">
                    Enter your AniList username to unlock your personal pack selection.
                  </p>

                  {/* ── Step 1: username verify form ── */}
                  <div className="landing-cta-row card-shop-hero-checkout-row">
                    <form id="card-shop-checkout" className="card-shop-checkout-bar" onSubmit={handleVerify}>
                      <label className="visually-hidden" htmlFor="card-shop-username">
                        AniList username
                      </label>
                      <div className="card-shop-checkout-bar-inner">
                        <input
                          id="card-shop-username"
                          type="text"
                          className="card-shop-checkout-input"
                          placeholder="AniList username"
                          value={shopUserName}
                          onChange={e => {
                            setShopUserName(e.target.value);
                            // If user edits after verifying, reset verified state
                            if (verifiedUsername && e.target.value.trim() !== verifiedUsername) {
                              setVerifiedUsername('');
                            }
                          }}
                          autoComplete="username"
                          required
                        />
                        {profileReady ? (
                          <button
                            type="button"
                            className="card-shop-checkout-submit card-shop-checkout-submit--checkout"
                            onClick={handleCheckout}
                          >
                            Checkout
                          </button>
                        ) : (
                          <button
                            type="submit"
                            className="card-shop-checkout-submit"
                            disabled={!shopUserName.trim() || isLoading}
                          >
                            {isLoading ? <><span className="btn-spinner" />{' Loading…'}</> : 'Search'}
                          </button>
                        )}
                      </div>
                      {/* Inline error */}
                      {listError && verifiedUsername && (
                        <p className="card-shop-inline-error" role="alert">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <circle cx="12" cy="16" r="0.5" fill="currentColor" stroke="none" />
                          </svg>
                          {listError instanceof Error ? listError.message : 'Profile not found. Check the username.'}
                        </p>
                      )}
                    </form>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Pack catalog grid ── */}
            <div className="container card-shop-page-inner card-shop-hero-catalog">
              <ul className="card-shop-grid" role="list" aria-label="Booster packs">
                {CATALOG.map(row => {
                  const art = getPackArt(row.id);
                  const selected = selectedPackId === row.id;
                  const locked = !profileReady;
                  const poolEmpty = profileReady && poolCounts !== null && (poolCounts[row.id] ?? 0) === 0;
                  const disabled = locked || poolEmpty;

                  return (
                    <li key={row.id}>
                      <motion.button
                        type="button"
                        className={`card-shop-product ${selected && !disabled ? 'card-shop-product--selected' : ''} ${disabled ? 'card-shop-product--disabled' : ''}`}
                        onClick={() => !disabled && setSelectedPackId(row.id)}
                        layout
                        whileHover={disabled ? {} : { y: -3 }}
                        whileTap={disabled ? {} : { scale: 0.99 }}
                        aria-pressed={selected && !disabled}
                        aria-disabled={disabled}
                        tabIndex={disabled ? -1 : 0}
                      >
                        <span className="card-shop-product-well">
                          <span
                            className="card-shop-product-thumb"
                            style={{ backgroundImage: `url(${art.front})` }}
                            role="img"
                            aria-hidden
                          />
                          {row.icon ? (
                            <span className="card-shop-product-icon">{row.icon}</span>
                          ) : null}
                          {/* Loading shimmer overlay */}
                          {locked && (
                            <span className="card-shop-product-shimmer" aria-hidden />
                          )}
                          {/* Empty pool badge */}
                          {poolEmpty && (
                            <span className="card-shop-product-empty-badge" aria-hidden>
                              No matches
                            </span>
                          )}
                        </span>
                        <span className="card-shop-product-body">
                          <span className="card-shop-product-title-row">
                            <span className="card-shop-product-title">{row.title}</span>
                          </span>
                          <span className="card-shop-product-desc">{row.subtitle}</span>
                          <span className={`card-shop-product-cta ${selected && !disabled ? 'card-shop-product-cta--active' : ''}`}>
                            {poolEmpty ? 'No titles' : locked ? 'Locked' : selected ? 'Selected' : 'Select pack'}
                          </span>
                        </span>
                      </motion.button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        </main>

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
      </div>

      {/* Pack reveal overlay — portalled to body */}
      {revealState && (
        <PackRevealOverlay
          username={revealState.username}
          packId={revealState.packId}
          onClose={() => setRevealState(null)}
        />
      )}
    </>
  );
}
