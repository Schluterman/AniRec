import { motion } from 'framer-motion';
import type { Media } from '../types/anime';
import type { ProcessedUserData } from '../hooks/useAnimeData';
import { AnimeCard, AnimeCardSkeleton } from './AnimeCard';
import './RecommendationGrid.css';

interface RecommendationGridProps {
  anime: Media[];
  processedData: ProcessedUserData | null;
  isLoading: boolean;
  totalBeforeFilter: number;
  onAnimeClick?: (anime: Media) => void;
}

export function RecommendationGrid({ 
  anime, 
  processedData, 
  isLoading,
  totalBeforeFilter,
  onAnimeClick
}: RecommendationGridProps) {
  if (isLoading) {
    return (
      <section className="recommendation-grid-section">
        <div className="grid-header">
          <h2 className="grid-title">
            <span className="loading-spinner-small" />
            Finding recommendations...
          </h2>
        </div>
        <div className="anime-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <AnimeCardSkeleton key={i} index={i} />
          ))}
        </div>
      </section>
    );
  }

  if (anime.length === 0) {
    return (
      <section className="recommendation-grid-section">
        <motion.div 
          className="empty-state"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="empty-icon">🔍</div>
          <h3 className="empty-title">No recommendations found</h3>
          <p className="empty-description">
            {totalBeforeFilter > 0 
              ? `${totalBeforeFilter} anime found, but none match your streaming service filters. Try selecting different services.`
              : 'Try adjusting your filters or check back later for new anime.'}
          </p>
        </motion.div>
      </section>
    );
  }

  return (
    <section className="recommendation-grid-section">
      <motion.div 
        className="grid-header"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="grid-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          Recommended For You
        </h2>
        <p className="grid-subtitle">
          {anime.length} anime{totalBeforeFilter !== anime.length ? ` (${totalBeforeFilter} before filtering)` : ''} based on your taste
        </p>
      </motion.div>

      <div className="anime-grid">
        {anime.map(item => (
          <AnimeCard
            key={item.id}
            anime={item}
            processedData={processedData}
            onClick={() => onAnimeClick?.(item)}
          />
        ))}
      </div>
    </section>
  );
}
