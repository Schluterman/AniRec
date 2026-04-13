import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserAnimeList, useProcessedUserData, useRecommendations } from '../hooks/useAnimeData';
import { getStreamingServicesForAnime } from '../api/anilist';
import { getPackArt } from '../data/packAssets';
import type { ActivePackId } from '../types/packs';
import { AnimeRoulette } from './AnimeRoulette';
import { AnimeModal } from './AnimeModal';
import { useSession } from '../context/useSession';
import './PackRevealOverlay.css';

interface PackRevealOverlayProps {
  username: string;
  packId: ActivePackId;
  onClose: () => void;
}

export function PackRevealOverlay({ username, packId, onClose }: PackRevealOverlayProps) {
  const {
    dismissedIds,
    handleThumbsDown,
    handleThumbsUp: sessionThumbsUp,
    selectedAnime,
    setSelectedAnime,
  } = useSession();

  const { error: listError } = useUserAnimeList(username);
  const processedData = useProcessedUserData(username);
  const { filteredMedia, isLoading } = useRecommendations(processedData, [], dismissedIds);

  const finalFilteredMedia = useMemo(() => {
    if (packId === 'planning' && processedData) {
      return processedData.byStatus.planning.map(e => e.media);
    }
    if (packId === 'anirec') return filteredMedia;
    return filteredMedia.filter(a =>
      getStreamingServicesForAnime(a).some(s => s.id === packId)
    );
  }, [filteredMedia, packId, processedData]);

  const packArt = getPackArt(packId);

  const handleThumbsUp = useMemo(() => (anime: Parameters<typeof sessionThumbsUp>[0]) => {
    sessionThumbsUp(anime);
    setTimeout(() => onClose(), 1500);
  }, [sessionThumbsUp, onClose]);

  const content = (
    <AnimatePresence>
      <motion.div
        className="pro-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClose}
      >
        <motion.div
          className="pro-dialog"
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          onClick={e => e.stopPropagation()}
        >
          <button
            type="button"
            className="pro-close"
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {listError ? (
            <div className="pro-error">
              <svg className="pro-error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="40" height="40">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <circle cx="12" cy="16" r="0.5" fill="currentColor" stroke="none" />
              </svg>
              <h2 className="pro-error-title">Couldn&apos;t load that profile</h2>
              <p className="pro-error-message">
                {listError instanceof Error ? listError.message : 'User not found or API error.'}
              </p>
              <button type="button" className="pro-error-retry" onClick={onClose}>
                Try another username
              </button>
            </div>
          ) : isLoading && finalFilteredMedia.length === 0 ? (
            <div className="pro-loading">
              <motion.div
                className="pro-loading-pack"
                initial={{ y: 60, opacity: 0, scale: 0.85 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 22 }}
              />
              <p className="pro-loading-label">Stocking your pack</p>
              <div className="pro-loading-dots">
                <span /><span /><span />
              </div>
            </div>
          ) : (
            <div className="pro-body">
              <AnimeRoulette
                key={packId}
                anime={finalFilteredMedia}
                processedData={processedData}
                isLoading={isLoading && finalFilteredMedia.length === 0}
                packArt={packArt}
                onAnimeClick={setSelectedAnime}
                onThumbsUp={handleThumbsUp}
                onThumbsDown={handleThumbsDown}
                autoOpenPackOnce
                expandedReveal
                onDismissCheckoutOverlay={onClose}
                onSwitchPack={onClose}
              />
            </div>
          )}
        </motion.div>

        <AnimeModal
          anime={selectedAnime}
          processedData={processedData}
          onClose={() => setSelectedAnime(null)}
        />
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
