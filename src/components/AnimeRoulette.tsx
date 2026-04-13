import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Media } from '../types/anime';
import type { ProcessedUserData } from '../hooks/useAnimeData';
import { calculateMatchScore } from '../hooks/useAnimeData';
import { getStreamingServicesForAnime } from '../api/anilist';
import type { PackArtUrls } from '../data/packAssets';
import './AnimeRoulette.css';

interface AnimeRouletteProps {
  anime: Media[];
  processedData: ProcessedUserData | null;
  isLoading: boolean;
  packArt: PackArtUrls;
  onAnimeClick?: (anime: Media) => void;
  onThumbsUp?: (anime: Media) => void;
  onThumbsDown?: (anime: Media) => void;
  /** When true, opens one pack automatically once the pool is ready (e.g. after Card Market checkout). */
  autoOpenPackOnce?: boolean;
  onDismissCheckoutOverlay?: () => void;
  onSwitchPack?: () => void;
  /** When true, shows description + all genres, hides View Details button. */
  expandedReveal?: boolean;
}

// Animation states
type PackState = 'PACK_IDLE' | 'PACK_TENSION' | 'PACK_TEARING' | 'PACK_OPENING' | 'CARD_REVEAL' | 'POST_REVEAL';

/** Deterministic jitter in [0, 1) for motion props (pure; avoids Math.random during render). */
function motionJitter(i: number, salt: number): number {
  const x = Math.sin(i * 12.9898 + salt * 43758.5453) * 43758.5453;
  return x - Math.floor(x);
}

export function AnimeRoulette({
  anime,
  processedData,
  isLoading,
  packArt,
  onAnimeClick,
  onThumbsUp,
  onThumbsDown,
  autoOpenPackOnce = false,
  onDismissCheckoutOverlay,
  onSwitchPack,
  expandedReveal = false,
}: AnimeRouletteProps) {
  const [packState, setPackState] = useState<PackState>('PACK_IDLE');
  const [selectedAnime, setSelectedAnime] = useState<Media | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Drag rotation state
  const [packRotation, setPackRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [swipeProgress, setSwipeProgress] = useState(0); // 0 to 1 for swipe-to-open
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const rotationStart = useRef(0);
  const hasDragged = useRef(false);
  const swipeDirection = useRef<'horizontal' | 'vertical' | null>(null);
  const DRAG_THRESHOLD = 8; // pixels before it counts as a drag
  const [isNarrowViewport, setIsNarrowViewport] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const apply = () => setIsNarrowViewport(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);
  const SWIPE_OPEN_THRESHOLD = isNarrowViewport ? 88 : 120;

  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Use the pre-filtered anime passed in as props
  const filteredAnime = anime;

  const openPack = useCallback(() => {
    if (filteredAnime.length === 0 || packState !== 'PACK_IDLE') return;

    // Reset rotation when opening
    setPackRotation(0);

    // Pick random anime
    const randomIndex = Math.floor(Math.random() * filteredAnime.length);
    const chosen = filteredAnime[randomIndex];
    setSelectedAnime(chosen);

    if (prefersReducedMotion) {
      // Simple fade transition for reduced motion
      setPackState('CARD_REVEAL');
      setTimeout(() => setPackState('POST_REVEAL'), 500);
      return;
    }

    // Full animation sequence with tear effect
    // Step 1: Tension buildup (0.0s → 0.6s)
    setPackState('PACK_TENSION');

    // Step 2: Pack tearing (0.6s → 1.2s)
    setTimeout(() => {
      setPackState('PACK_TEARING');
    }, 600);

    // Step 3: Opening burst (1.2s → 1.6s)
    setTimeout(() => {
      setPackState('PACK_OPENING');
    }, 1200);

    // Step 4: Card Reveal (1.6s → 2.2s)
    setTimeout(() => {
      setPackState('CARD_REVEAL');
    }, 1600);

    // Step 5: Post Reveal (2.2s → 2.7s)
    setTimeout(() => {
      setPackState('POST_REVEAL');
    }, 2200);
  }, [filteredAnime, packState, prefersReducedMotion]);

  const resetPack = useCallback(() => {
    setPackState('PACK_IDLE');
    setSelectedAnime(null);
    setPackRotation(0);
    setShowSavedToast(false);
    onDismissCheckoutOverlay?.();
  }, [onDismissCheckoutOverlay]);

  const autoOpenFiredRef = useRef(false);
  useEffect(() => {
    if (!autoOpenPackOnce || autoOpenFiredRef.current) return;
    if (isLoading || filteredAnime.length === 0 || packState !== 'PACK_IDLE') return;
    autoOpenFiredRef.current = true;
    queueMicrotask(() => {
      openPack();
    });
  }, [autoOpenPackOnce, isLoading, filteredAnime.length, packState, openPack]);

  const nextPullPendingRef = useRef(false);
  useEffect(() => {
    if (!nextPullPendingRef.current) return;
    if (packState !== 'PACK_IDLE') return;
    if (filteredAnime.length === 0) {
      nextPullPendingRef.current = false;
      return;
    }
    nextPullPendingRef.current = false;
    queueMicrotask(() => {
      openPack();
    });
  }, [packState, filteredAnime.length, openPack]);

  const handleNextCard = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!selectedAnime) return;
      onThumbsDown?.(selectedAnime);
      nextPullPendingRef.current = true;
      resetPack();
    },
    [selectedAnime, onThumbsDown, resetPack]
  );

  // Checkout-flow only: draw again without dismissing the overlay or penalising the current card
  const handleDrawAgain = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    nextPullPendingRef.current = true;
    setPackState('PACK_IDLE');
    setSelectedAnime(null);
    setPackRotation(0);
    setShowSavedToast(false);
  }, []);

  const handleSwitchPack = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDismissCheckoutOverlay?.();
      onSwitchPack?.();
    },
    [onDismissCheckoutOverlay, onSwitchPack]
  );

  const handleThumbsUp = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedAnime) return;
    onThumbsUp?.(selectedAnime);
    setShowSavedToast(true);
    setTimeout(() => {
      resetPack();
    }, 1400);
  }, [selectedAnime, onThumbsUp, resetPack]);

  const handleThumbsDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedAnime) return;
    onThumbsDown?.(selectedAnime);
    resetPack();
  }, [selectedAnime, onThumbsDown, resetPack]);

  // Drag handlers for 360° pack rotation AND swipe-to-open
  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    if (packState !== 'PACK_IDLE') return;
    setIsMouseDown(true);
    hasDragged.current = false;
    swipeDirection.current = null;
    dragStartX.current = clientX;
    dragStartY.current = clientY;
    rotationStart.current = packRotation;
    setSwipeProgress(0);
  }, [packState, packRotation]);

  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!isMouseDown) return;
    const deltaX = clientX - dragStartX.current;
    const deltaY = dragStartY.current - clientY; // Inverted: positive = dragging up

    // Determine swipe direction if not already set
    if (!swipeDirection.current && (Math.abs(deltaX) > DRAG_THRESHOLD || Math.abs(deltaY) > DRAG_THRESHOLD)) {
      // If vertical movement is greater, it's a swipe-to-open gesture
      if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY > 0) {
        swipeDirection.current = 'vertical';
      } else {
        swipeDirection.current = 'horizontal';
      }
      setIsDragging(true);
      hasDragged.current = true;
    }

    if (swipeDirection.current === 'vertical') {
      // Swipe-to-open: calculate progress (0 to 1)
      const progress = Math.min(Math.max(deltaY / SWIPE_OPEN_THRESHOLD, 0), 1);
      setSwipeProgress(progress);
    } else if (swipeDirection.current === 'horizontal') {
      // Horizontal: rotate the pack
      const newRotation = rotationStart.current + (deltaX * 0.5);
      setPackRotation(newRotation);
    }
  }, [isMouseDown, SWIPE_OPEN_THRESHOLD]);

  const handleDragEnd = useCallback(() => {
    const wasDragging = hasDragged.current;
    const wasVerticalSwipe = swipeDirection.current === 'vertical';
    const shouldOpen = swipeProgress >= 0.8; // 80% threshold to trigger open

    setIsMouseDown(false);
    setIsDragging(false);
    setIsHovering(false);
    setSwipeProgress(0);
    swipeDirection.current = null;

    // If user swiped up enough, open the pack
    if (wasVerticalSwipe && shouldOpen && packState === 'PACK_IDLE') {
      openPack();
      return true;
    }

    return wasDragging;
  }, [swipeProgress, packState, openPack]);

  // Mouse event handlers
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY);
  }, [handleDragStart]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    handleDragMove(e.clientX, e.clientY);
  }, [handleDragMove]);

  const onMouseUp = useCallback(() => {
    const wasHandled = handleDragEnd();
    // Only open pack on tap (not drag) if it wasn't already handled by swipe
    if (!wasHandled && packState === 'PACK_IDLE') {
      openPack();
    }
  }, [handleDragEnd, packState, openPack]);

  const onMouseLeave = useCallback(() => {
    if (isMouseDown) {
      setSwipeProgress(0);
      handleDragEnd();
    }
  }, [isMouseDown, handleDragEnd]);

  // Touch event handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
  }, [handleDragStart]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
  }, [handleDragMove]);

  const onTouchEnd = useCallback(() => {
    const wasHandled = handleDragEnd();
    if (!wasHandled && packState === 'PACK_IDLE') {
      openPack();
    }
  }, [handleDragEnd, packState, openPack]);

  const packCssVars = useMemo(
    () =>
      ({
        '--pack-front': `url("${packArt.front}")`,
        '--pack-back': `url("${packArt.back}")`,
        '--pack-edge': `url("${packArt.edge}")`,
        '--pack-foil-mask': `url("${packArt.foilMask}")`,
        '--pack-tear-mask': `url("${packArt.tearMask}")`,
        '--pack-front-mask': `url("${packArt.frontMask}")`,
      }) as React.CSSProperties,
    [packArt]
  );

  if (isLoading) {
    return (
      <section className="anime-roulette" style={packCssVars}>
        <div className="pack-loading">
          <div className="loading-pack">
            <div className="pack-face" />
          </div>
          <p className="loading-text">Stocking the shelf…</p>
        </div>
      </section>
    );
  }

  const matchScore = selectedAnime && processedData
    ? calculateMatchScore(selectedAnime, processedData)
    : null;

  const streamingServices = selectedAnime
    ? getStreamingServicesForAnime(selectedAnime)
    : [];

  // Find "because you liked" anime
  const becauseYouLiked = processedData?.byStatus.completed
    .filter(entry => entry.score >= 8)
    .find(entry => {
      if (!selectedAnime) return false;
      return entry.media.genres.some(g => selectedAnime.genres.includes(g));
    })?.media;

  return (
    <section className="anime-roulette" style={packCssVars}>
      {/* Pack Container */}
      <div className="pack-container">
        <AnimatePresence mode="wait">
          {/* Pack States: IDLE, TENSION, TEARING, OPENING */}
          {(packState === 'PACK_IDLE' || packState === 'PACK_TENSION' || packState === 'PACK_TEARING' || packState === 'PACK_OPENING') && (
            <motion.div
              key="pack"
              className="pack-stage"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 1.12, transition: { type: 'spring', stiffness: 280, damping: 22 } }
              }
              transition={
                prefersReducedMotion
                  ? { duration: 0.2 }
                  : { type: 'spring', stiffness: 320, damping: 28, mass: 0.9 }
              }
            >
              {/* Flash effect during opening */}
              {packState === 'PACK_OPENING' && (
                <motion.div
                  className="pack-flash"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.85, 0] }}
                  transition={
                    prefersReducedMotion
                      ? { duration: 0.25, times: [0, 0.35, 1] }
                      : { duration: 0.3, times: [0, 0.22, 1], ease: ['easeOut', 'easeIn'] }
                  }
                />
              )}

              {/* The AniRec Pack */}
              <motion.div
                className={`pack-wrapper ${packState} ${isDragging ? 'dragging' : ''} ${swipeProgress > 0 ? 'swiping' : ''}`}
                onMouseDown={packState === 'PACK_IDLE' ? onMouseDown : undefined}
                onMouseMove={packState === 'PACK_IDLE' ? onMouseMove : undefined}
                onMouseUp={packState === 'PACK_IDLE' ? onMouseUp : undefined}
                onMouseLeave={packState === 'PACK_IDLE' ? onMouseLeave : undefined}
                onTouchStart={packState === 'PACK_IDLE' ? onTouchStart : undefined}
                onTouchMove={packState === 'PACK_IDLE' ? onTouchMove : undefined}
                onTouchEnd={packState === 'PACK_IDLE' ? onTouchEnd : undefined}
                onMouseEnter={() => !isDragging && setIsHovering(true)}
                animate={
                  packState === 'PACK_IDLE' ? {
                    // During swipe-up, show tension effect
                    y: swipeProgress > 0
                      ? -swipeProgress * 30  // Move up as user swipes
                      : isDragging ? 0 : (isHovering ? -12 : [0, -8, 0]),
                    scale: swipeProgress > 0
                      ? 1 + swipeProgress * 0.12  // Scale up during swipe
                      : isDragging ? 1.05 : (isHovering ? 1.03 : 1),
                    // Add shake/vibrate as swipe increases
                    rotate: swipeProgress > 0.5
                      ? [0, -1, 1, -1, 1, 0]
                      : 0,
                  } : packState === 'PACK_TENSION' ? (
                    prefersReducedMotion
                      ? {
                          rotate: [-1.5, 1.5, -2, 2, -1, 1, 0],
                          x: [-4, 4, -6, 6, -3, 3, 0],
                          scale: [1, 1.02, 1.01, 1.03, 1.02, 1.04, 1.08],
                        }
                      : {
                          rotate: [-2, 2, -2.8, 2.8, -1.8, 1.8, 0],
                          x: [-6, 6, -9, 9, -4, 4, 0],
                          scale: [1, 0.97, 1.04, 1.02, 1.06, 1.04, 1.12],
                        }
                  ) : packState === 'PACK_TEARING' ? {
                    scale: prefersReducedMotion ? 1.08 : 1.1,
                  } : packState === 'PACK_OPENING' ? (
                    prefersReducedMotion
                      ? {
                          scale: [1.08, 1.15, 0.8],
                          y: [0, -40, 150],
                          opacity: [1, 1, 0],
                        }
                      : {
                          scale: [1.08, 1.24, 0.72],
                          y: [0, -56, 172],
                          opacity: [1, 1, 0],
                        }
                  ) : {}
                }
                transition={
                  packState === 'PACK_IDLE' ? {
                    y: swipeProgress > 0
                      ? { duration: 0 }
                      : isDragging ? { duration: 0 } : { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
                    scale: swipeProgress > 0 ? { duration: 0 } : { duration: 0.25 },
                    rotate: swipeProgress > 0.5 ? { duration: 0.15, repeat: Infinity } : { duration: 0 },
                  } : packState === 'PACK_TENSION' ? (
                    prefersReducedMotion
                      ? { duration: 0.55, ease: "easeInOut" }
                      : { type: 'spring', stiffness: 400, damping: 17, mass: 0.88 }
                  ) : packState === 'PACK_TEARING' ? (
                    prefersReducedMotion
                      ? { duration: 0.1 }
                      : { type: 'spring', stiffness: 340, damping: 22 }
                  ) : packState === 'PACK_OPENING' ? (
                    prefersReducedMotion
                      ? { duration: 0.35, ease: "easeOut" }
                      : {
                          duration: 0.5,
                          times: [0, 0.3, 1],
                          ease: ['easeInOut', [0.22, 1, 0.36, 1]],
                        }
                  ) : {}
                }
              >
                {/* 3D Pack with separate front/back images */}
                <div
                  className="pack-3d"
                  style={{
                    ...packCssVars,
                    transform: `rotateY(${packRotation}deg)`,
                    transition: isDragging ? 'none' : 'transform 0.3s ease-out',
                  }}
                >
                  {/* Non-tearing view */}
                  {packState !== 'PACK_TEARING' && (
                    <>
                      <div className="pack-face pack-front" />
                      <div className="pack-face pack-spine" aria-hidden />
                      <div className="pack-face pack-back" />

                      {/* Premium Foil Layer - clipped to pack shape */}
                      <div className="pack-foil-clip">
                        <div className="pack-foil-layer">
                          <div className="pack-foil-gradient" />
                        </div>
                      </div>

                      {/* Light streak for extra premium feel */}
                      <div className="pack-light-streak" />
                    </>
                  )}

                  {/* Tearing animation view */}
                  {packState === 'PACK_TEARING' && (
                    <div className="pack-tear-container">
                      {/* Left torn half */}
                      <motion.div
                        className="pack-tear-left"
                        initial={{ x: 0, rotateY: 0, rotateZ: 0 }}
                        animate={{
                          x: -100,
                          rotateY: -20,
                          rotateZ: -3,
                          opacity: [1, 1, 0.6]
                        }}
                        transition={
                          prefersReducedMotion
                            ? { duration: 0.55, ease: [0.22, 1, 0.36, 1] }
                            : { duration: 0.52, ease: [0.17, 1, 0.32, 1.02] }
                        }
                      />

                      {/* Right torn half */}
                      <motion.div
                        className="pack-tear-right-wrapper"
                        initial={{ x: 0, rotateY: 0, rotateZ: 0 }}
                        animate={{
                          x: 100,
                          rotateY: 20,
                          rotateZ: 3,
                          opacity: [1, 1, 0.6]
                        }}
                        transition={
                          prefersReducedMotion
                            ? { duration: 0.55, ease: [0.22, 1, 0.36, 1] }
                            : { duration: 0.52, ease: [0.17, 1, 0.32, 1.02] }
                        }
                      >
                        <div className="pack-tear-right" />
                      </motion.div>

                      {/* Glowing tear edge */}
                      <motion.div
                        className="pack-tear-glow"
                        initial={{ opacity: 0, scaleY: 0.3 }}
                        animate={{
                          opacity: [0, 1, 0.8, 0],
                          scaleY: [0.3, 1, 1.1, 1],
                          scaleX: [1, 1.5, 2, 3]
                        }}
                        transition={{ duration: 0.55, ease: "easeOut" }}
                      />

                      {/* Tear sparks */}
                      {[...Array(12)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="tear-spark"
                          style={{
                            left: '50%',
                            top: `${10 + i * 7}%`,
                          }}
                          initial={{ opacity: 0, scale: 0, x: 0 }}
                          animate={{
                            opacity: [0, 1, 1, 0],
                            scale: [0, 1.2, 1, 0.5],
                            x: (i % 2 === 0 ? 1 : -1) * (30 + motionJitter(i, 0) * 60),
                            y: (motionJitter(i, 1) - 0.5) * 30,
                          }}
                          transition={{
                            duration: 0.5,
                            delay: i * 0.025,
                            ease: "easeOut"
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Burst rings during opening */}
                {packState === 'PACK_OPENING' && (
                  <div className="pack-burst">
                    <div className="burst-ring" />
                    <div className="burst-ring" />
                    <div className="burst-ring" />
                  </div>
                )}

                {/* Glow effect - intensifies during swipe */}
                <div
                  className={`pack-glow ${packState === 'PACK_TENSION' || packState === 'PACK_TEARING' || swipeProgress > 0.3 ? 'intense' : ''}`}
                  style={swipeProgress > 0 ? {
                    opacity: 0.6 + swipeProgress * 0.6,
                    transform: `translate(-50%, -50%) scale(${1 + swipeProgress * 0.5})`,
                  } : undefined}
                />

                {/* Swipe-to-open indicator */}
                {swipeProgress > 0 && (
                  <motion.div
                    className="swipe-indicator"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                      opacity: swipeProgress,
                      scale: 1,
                      y: -20 - swipeProgress * 30
                    }}
                  >
                    <div
                      className="swipe-progress-ring"
                      style={{
                        background: `conic-gradient(
                          rgba(61, 180, 242, 1) ${swipeProgress * 360}deg,
                          rgba(255, 255, 255, 0.2) ${swipeProgress * 360}deg
                        )`
                      }}
                    />
                    <span className="swipe-text">
                      {swipeProgress >= 0.8 ? 'Release!' : 'Swipe up'}
                    </span>
                  </motion.div>
                )}
              </motion.div>

              {/* Empty filter message */}
              {packState === 'PACK_IDLE' && filteredAnime.length === 0 && (
                <motion.div
                  className="pack-empty-message"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <span className="cta-disabled-text">No titles in this booster pool—try another pack</span>
                  <Link to="/card-shop" className="pack-empty-market-link">
                    Pick another pack at the Card Market
                  </Link>
                </motion.div>
              )}

              {packState === 'PACK_TENSION' && (
                <motion.p
                  className="pack-status"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  Analyzing your taste profile...
                </motion.p>
              )}

              {packState === 'PACK_TEARING' && (
                <motion.p
                  className="pack-status"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  Opening pack...
                </motion.p>
              )}
            </motion.div>
          )}

          {/* Card Reveal States */}
          {(packState === 'CARD_REVEAL' || packState === 'POST_REVEAL') && selectedAnime && (
            <motion.div
              key="card"
              className="card-stage"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {/* Left column: card + actions */}
              <div className="reveal-left">
                <motion.div
                  className="revealed-card"
                  initial={{ scale: 0.4, rotateY: -180, opacity: 0 }}
                  animate={{ scale: 1, rotateY: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                >
                  <div className="template-card">
                    <img
                      className="template-cover"
                      src={selectedAnime.coverImage?.large || selectedAnime.coverImage?.medium}
                      alt={selectedAnime.title.english || selectedAnime.title.romaji}
                    />
                    <div className="template-title">
                      <h3>{selectedAnime.title.english || selectedAnime.title.romaji}</h3>
                    </div>
                    <img className="template-frame" src="/AnimeCard.png" alt="" draggable={false} />
                  </div>
                  <div className="card-foil" />
                </motion.div>

                <motion.div
                  className="reveal-actions"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                >
                  <div className="card-vote card-vote--circles">
                    <button className="vote-circle vote-circle--save" onClick={handleThumbsUp} aria-label="Save to watchlist" title="Save to Watchlist">
                      <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                        <path d="M2 20h2c.55 0 1-.45 1-1v-9c0-.55-.45-1-1-1H2v11zm19.83-7.12c.11-.25.17-.52.17-.8V11c0-1.1-.9-2-2-2h-5.5l.92-4.65c.05-.22.02-.46-.08-.66-.23-.45-.52-.86-.88-1.22L14 2 7.59 8.41C7.21 8.79 7 9.3 7 9.83V19c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3-7.09z"/>
                      </svg>
                    </button>
                    <button className="vote-circle vote-circle--skip" onClick={handleThumbsDown} aria-label="Skip this anime" title="Skip">
                      <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                        <path d="M22 4h-2c-.55 0-1 .45-1 1v9c0 .55.45 1 1 1h2V4zM2.17 11.12c-.11.25-.17.52-.17.8V13c0 1.1.9 2 2 2h5.5l-.92 4.65c-.05.22-.02.46.08.66.23.45.52.86.88 1.22L10 22l6.41-6.41c.38-.38.59-.89.59-1.42V5c0-1.1-.9-2-2-2H6c-.83 0-1.54.5-1.84 1.22l-3 7.09z"/>
                      </svg>
                    </button>
                  </div>
                  <AnimatePresence>
                    {showSavedToast && (
                      <motion.div
                        className="saved-toast"
                        initial={{ opacity: 0, y: 8, scale: 0.92 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.92 }}
                        transition={{ duration: 0.25 }}
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                          <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                        </svg>
                        Saved to Watchlist!
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>

              {/* Right column: details panel */}
              <motion.div
                className="reveal-right"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35, duration: 0.4 }}
              >
                <span className="reveal-eyebrow">Picked for you</span>

                {matchScore !== null && (
                  <div className="reveal-match">
                    <span className="reveal-match-value">{matchScore}%</span>
                    <span className="reveal-match-label">Match</span>
                  </div>
                )}

                <h2 className="reveal-detail-title">
                  {selectedAnime.title.english || selectedAnime.title.romaji}
                </h2>

                <div className="reveal-detail-meta">
                  <span>{selectedAnime.format}</span>
                  {selectedAnime.episodes && <span>{selectedAnime.episodes} eps</span>}
                  {selectedAnime.averageScore && <span>⭐ {selectedAnime.averageScore}%</span>}
                  {selectedAnime.seasonYear && <span>{selectedAnime.seasonYear}</span>}
                  {selectedAnime.studios?.nodes?.[0] && <span>{selectedAnime.studios.nodes[0].name}</span>}
                </div>

                <div className="reveal-detail-genres">
                  {selectedAnime.genres.map(genre => (
                    <span key={genre} className="genre-tag">{genre}</span>
                  ))}
                </div>

                {selectedAnime.description && (
                  <p className="reveal-detail-synopsis">
                    {selectedAnime.description.replace(/<[^>]*>/g, '').slice(0, 400)}
                    {selectedAnime.description.replace(/<[^>]*>/g, '').length > 400 ? '…' : ''}
                  </p>
                )}

                {becauseYouLiked && (
                  <p className="reveal-detail-because">
                    Because you liked <strong>{becauseYouLiked.title.english || becauseYouLiked.title.romaji}</strong>
                  </p>
                )}

                {streamingServices.length > 0 && (
                  <div className="reveal-detail-streaming">
                    <span className="reveal-streaming-label">Where to Watch</span>
                    <div className="reveal-streaming-list">
                      {streamingServices.map(s => (
                        <span key={s.id} className="reveal-streaming-badge" style={{ '--svc-color': s.color } as React.CSSProperties}>
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <a
                  href={`https://anilist.co/anime/${selectedAnime.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="reveal-detail-anilist"
                >
                  Open in AniList
                </a>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
