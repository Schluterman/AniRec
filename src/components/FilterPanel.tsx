import { motion } from 'framer-motion';
import { STREAMING_SERVICES } from '../api/anilist';
import type { StreamingServiceId } from '../types/anime';
import { StreamingIcon } from './StreamingIcons';
import './FilterPanel.css';

const GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 'Fantasy',
  'Horror', 'Mahou Shoujo', 'Mecha', 'Music', 'Mystery', 'Psychological',
  'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller'
];

interface FilterPanelProps {
  selectedGenres: string[];
  selectedServices: StreamingServiceId[];
  onToggleGenre: (genre: string) => void;
  onToggleService: (serviceId: StreamingServiceId) => void;
  onClearFilters: () => void;
  filteredCount: number;
  genresExpanded: boolean;
  onToggleGenresExpanded: () => void;
}

const VISIBLE_GENRES_COUNT = 6;

export function FilterPanel({
  selectedGenres,
  selectedServices,
  onToggleGenre,
  onToggleService,
  onClearFilters,
  filteredCount,
  genresExpanded,
  onToggleGenresExpanded,
}: FilterPanelProps) {
  const hasActiveFilters = selectedGenres.length > 0 || selectedServices.length > 0;

  return (
    <div className="filter-panel">
      <div className="filter-section">
        <h3 className="filter-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          Filter by Genre
        </h3>
        <div className="filter-chips">
          {GENRES.slice(0, VISIBLE_GENRES_COUNT).map(genre => (
            <button
              key={genre}
              className={`filter-chip ${selectedGenres.includes(genre) ? 'active' : ''}`}
              onClick={() => onToggleGenre(genre)}
            >
              {genre}
            </button>
          ))}
          
          {!genresExpanded ? (
            <button
              className="filter-chip expand-chip"
              onClick={onToggleGenresExpanded}
            >
              +{GENRES.length - VISIBLE_GENRES_COUNT} more
            </button>
          ) : (
            <>
              {GENRES.slice(VISIBLE_GENRES_COUNT).map(genre => (
                <motion.button
                  key={genre}
                  className={`filter-chip ${selectedGenres.includes(genre) ? 'active' : ''}`}
                  onClick={() => onToggleGenre(genre)}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {genre}
                </motion.button>
              ))}
              <button
                className="filter-chip collapse-chip"
                onClick={onToggleGenresExpanded}
              >
                Show less
              </button>
            </>
          )}
        </div>
      </div>

      <div className="filter-section">
        <h3 className="filter-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          Filter by Streaming Service
        </h3>
        <div className="filter-chips streaming-chips">
          {STREAMING_SERVICES.map(service => (
            <button
              key={service.id}
              className={`filter-chip service-icon ${selectedServices.includes(service.id) ? 'active' : ''}`}
              onClick={() => onToggleService(service.id)}
              style={{ '--service-color': service.color } as React.CSSProperties}
              title={service.name}
            >
              <StreamingIcon serviceId={service.id} size={22} />
            </button>
          ))}
        </div>
      </div>

      <div className="filter-info">
        <span className="anime-count">{filteredCount} anime in the summoning pool</span>
        {hasActiveFilters && (
          <button className="clear-filters" onClick={onClearFilters}>
            Reset filters
          </button>
        )}
      </div>
    </div>
  );
}

