import { motion } from 'framer-motion';
import { getStreamingServicesForAnime } from '../api/anilist';
import type { Media } from '../types/anime';
import type { ProcessedUserData } from '../hooks/useAnimeData';
import { calculateMatchScore } from '../hooks/useAnimeData';
import './AnimeCard.css';

interface AnimeCardProps {
  anime: Media;
  processedData: ProcessedUserData | null;
  index: number;
  onClick?: () => void;
}

export function AnimeCard({ anime, processedData, index, onClick }: AnimeCardProps) {
  const matchScore = processedData ? calculateMatchScore(anime, processedData) : null;
  const streamingServices = getStreamingServicesForAnime(anime);
  const displayTitle = anime.title.english || anime.title.romaji;

  const getMatchColor = (score: number) => {
    if (score >= 80) return 'var(--aurora-1)';
    if (score >= 60) return 'var(--aurora-4)';
    if (score >= 40) return 'var(--aurora-2)';
    return 'var(--text-muted)';
  };

  return (
    <motion.article
      className="anime-card"
      initial={false}
      whileHover={{ y: -8 }}
      onClick={onClick}
      style={{
        '--card-accent': anime.coverImage?.color || 'var(--accent-primary)',
      } as React.CSSProperties}
    >
      <div className="card-image-wrapper">
        <img
          src={anime.coverImage?.large || anime.coverImage?.medium}
          alt={displayTitle}
          className="card-image"
          loading="lazy"
        />
        <div className="card-overlay">
          {matchScore !== null && (
            <div 
              className="match-badge"
              style={{ '--match-color': getMatchColor(matchScore) } as React.CSSProperties}
            >
              <span className="match-score">{matchScore}%</span>
              <span className="match-label">match</span>
            </div>
          )}
          
          {anime.averageScore && (
            <div className="score-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <span>{anime.averageScore}%</span>
            </div>
          )}
        </div>
        
        <div className="card-format">{anime.format}</div>
      </div>

      <div className="card-content">
        <h3 className="card-title">{displayTitle}</h3>
        
        <div className="card-meta">
          {anime.seasonYear && <span>{anime.seasonYear}</span>}
          {anime.episodes && <span>{anime.episodes} eps</span>}
          {anime.status && (
            <span className={`status-badge ${anime.status.toLowerCase()}`}>
              {anime.status === 'FINISHED' ? 'Complete' : anime.status}
            </span>
          )}
        </div>

        <div className="card-genres">
          {anime.genres.slice(0, 3).map((genre) => (
            <span key={genre} className="genre-tag">{genre}</span>
          ))}
          {anime.genres.length > 3 && (
            <span className="genre-more">+{anime.genres.length - 3}</span>
          )}
        </div>

        {streamingServices.length > 0 && (
          <div className="card-streaming">
            {streamingServices.map((service) => (
              <span
                key={service.id}
                className="streaming-badge"
                style={{ '--service-color': service.color } as React.CSSProperties}
                title={service.name}
              >
                {service.name.slice(0, 2).toUpperCase()}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.article>
  );
}

export function AnimeCardSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      className="anime-card skeleton-card"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.05 }}
    >
      <div className="skeleton card-image-wrapper" />
      <div className="card-content">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-meta" />
        <div className="skeleton skeleton-genres" />
      </div>
    </motion.div>
  );
}
