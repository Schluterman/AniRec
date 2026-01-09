import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Media } from '../types/anime';
import type { ProcessedUserData } from '../hooks/useAnimeData';
import { calculateMatchScore } from '../hooks/useAnimeData';
import { getStreamingServicesForAnime } from '../api/anilist';
import './AnimeRoulette.css';

interface AnimeRouletteProps {
  anime: Media[];
  processedData: ProcessedUserData | null;
  isLoading: boolean;
  onAnimeClick?: (anime: Media) => void;
}

// Animation states
type PackState = 'PACK_IDLE' | 'PACK_TENSION' | 'PACK_TEARING' | 'PACK_OPENING' | 'CARD_REVEAL' | 'POST_REVEAL';

export function AnimeRoulette({
  anime,
  processedData,
  isLoading,
  onAnimeClick
}: AnimeRouletteProps) {
  const [packState, setPackState] = useState<PackState>('PACK_IDLE');
  const [selectedAnime, setSelectedAnime] = useState<Media | null>(null);
  const [isHovering, setIsHovering] = useState(false);

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
  const SWIPE_OPEN_THRESHOLD = 120; // pixels to swipe up to open the pack

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
  }, []);

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
  }, [isMouseDown, isDragging]);

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

  if (isLoading) {
    return (
      <section className="anime-roulette">
        <div className="pack-loading">
          <div className="loading-pack">
            <div className="pack-face" />
          </div>
          <p className="loading-text">Consulting the anime gods...</p>
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
    <section className="anime-roulette">
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
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Flash effect during opening */}
              {packState === 'PACK_OPENING' && (
                <motion.div
                  className="pack-flash"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.7, 0] }}
                  transition={{ duration: 0.35, times: [0, 0.3, 1] }}
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
                  } : packState === 'PACK_TENSION' ? {
                    rotate: [-1.5, 1.5, -2, 2, -1, 1, 0],
                    x: [-4, 4, -6, 6, -3, 3, 0],
                    scale: [1, 1.02, 1.01, 1.03, 1.02, 1.04, 1.08],
                  } : packState === 'PACK_TEARING' ? {
                    scale: 1.08,
                  } : packState === 'PACK_OPENING' ? {
                    scale: [1.08, 1.15, 0.8],
                    y: [0, -40, 150],
                    opacity: [1, 1, 0],
                  } : {}
                }
                transition={
                  packState === 'PACK_IDLE' ? {
                    y: swipeProgress > 0
                      ? { duration: 0 }
                      : isDragging ? { duration: 0 } : { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
                    scale: swipeProgress > 0 ? { duration: 0 } : { duration: 0.25 },
                    rotate: swipeProgress > 0.5 ? { duration: 0.15, repeat: Infinity } : { duration: 0 },
                  } : packState === 'PACK_TENSION' ? {
                    duration: 0.55,
                    ease: "easeInOut",
                  } : packState === 'PACK_TEARING' ? {
                    duration: 0.1,
                  } : packState === 'PACK_OPENING' ? {
                    duration: 0.35,
                    ease: "easeOut",
                  } : {}
                }
              >
                {/* 3D Pack with separate front/back images */}
                <div
                  className="pack-3d"
                  style={{
                    transform: `rotateY(${packRotation}deg)`,
                    transition: isDragging ? 'none' : 'transform 0.3s ease-out'
                  }}
                >
                  {/* Non-tearing view */}
                  {packState !== 'PACK_TEARING' && (
                    <>
                      <div className="pack-face pack-front" />
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
                        transition={{
                          duration: 0.55,
                          ease: [0.22, 1, 0.36, 1]
                        }}
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
                        transition={{
                          duration: 0.55,
                          ease: [0.22, 1, 0.36, 1]
                        }}
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
                            x: (i % 2 === 0 ? 1 : -1) * (30 + Math.random() * 60),
                            y: (Math.random() - 0.5) * 30,
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
                      {swipeProgress >= 0.8 ? '✨ Release!' : '↑ Swipe'}
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
                  <span className="cta-disabled-text">No anime match filters</span>
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
              {/* Particles/Sparkles */}
              <div className="reveal-particles">
                {[...Array(16)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="particle"
                    initial={{
                      opacity: 0,
                      scale: 0,
                      x: 0,
                      y: 0,
                    }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1.2, 0.5],
                      x: (Math.random() - 0.5) * 350,
                      y: (Math.random() - 0.5) * 350,
                    }}
                    transition={{
                      duration: 1.8,
                      delay: i * 0.04,
                      ease: "easeOut",
                    }}
                  />
                ))}
              </div>

              {/* The Revealed Card */}
              <motion.div
                className="revealed-card"
                initial={{ scale: 0.4, rotateY: -180, opacity: 0 }}
                animate={{
                  scale: 1,
                  rotateY: 0,
                  opacity: 1,
                }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
                }}
                onClick={() => onAnimeClick?.(selectedAnime)}
              >
                {/* Glowing Border */}
                <div className="card-glow-border" />

                {/* Card Content */}
                <div className="card-inner">
                  {/* Cover Image */}
                  <div className="card-cover">
                    <img
                      src={selectedAnime.coverImage?.large}
                      alt={selectedAnime.title.english || selectedAnime.title.romaji}
                    />
                    <div className="cover-overlay" />

                    {/* Match Score Badge */}
                    {matchScore !== null && (
                      <motion.div
                        className="match-badge"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.5, type: "spring" }}
                      >
                        <span className="match-value">{matchScore}%</span>
                        <span className="match-label">Match</span>
                      </motion.div>
                    )}
                  </div>

                  {/* Card Info */}
                  <motion.div
                    className="card-info"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <h3 className="card-title">
                      {selectedAnime.title.english || selectedAnime.title.romaji}
                    </h3>

                    <div className="card-meta">
                      <span>{selectedAnime.format}</span>
                      {selectedAnime.episodes && <span>{selectedAnime.episodes} eps</span>}
                      {selectedAnime.averageScore && <span>⭐ {selectedAnime.averageScore}%</span>}
                    </div>

                    <div className="card-genres">
                      {selectedAnime.genres.slice(0, 3).map(genre => (
                        <span key={genre} className="genre-tag">{genre}</span>
                      ))}
                    </div>

                    {becauseYouLiked && (
                      <p className="because-line">
                        Because you liked <strong>{becauseYouLiked.title.english || becauseYouLiked.title.romaji}</strong>
                      </p>
                    )}

                    {streamingServices.length > 0 && (
                      <div className="streaming-row">
                        <span className="streaming-label">Watch on:</span>
                        {streamingServices.slice(0, 2).map(s => (
                          <span key={s.id} className="streaming-tag" style={{ color: s.color }}>
                            {s.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>

                  {/* Card Actions */}
                  <motion.div
                    className="card-actions"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <a
                      href={`https://anilist.co/anime/${selectedAnime.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="action-btn primary"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Open in AniList
                    </a>
                    <button
                      className="action-btn secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAnimeClick?.(selectedAnime);
                      }}
                    >
                      View Details
                    </button>
                  </motion.div>
                </div>

                {/* Foil Shimmer Overlay */}
                <div className="card-foil" />

                {/* Confetti */}
                <div className="confetti-container">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="confetti-piece"
                      initial={{ y: 0, x: 0, rotate: 0, opacity: 1 }}
                      animate={{
                        y: [0, -180, 350],
                        x: (Math.random() - 0.5) * 450,
                        rotate: Math.random() * 720 - 360,
                        opacity: [1, 1, 0]
                      }}
                      transition={{
                        duration: 2.8,
                        delay: i * 0.025,
                        ease: 'easeOut'
                      }}
                      style={{
                        left: '50%',
                        background: ['#3db4f2', '#fc6d89', '#4cca51', '#ef881a', '#c063ff'][i % 5],
                        width: Math.random() * 10 + 5,
                        height: Math.random() * 10 + 5,
                      }}
                    />
                  ))}
                </div>
              </motion.div>

              {/* Another Pull Button */}
              <motion.button
                className="another-pull-btn"
                onClick={resetPack}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>🎲</span>
                Another Pull
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
