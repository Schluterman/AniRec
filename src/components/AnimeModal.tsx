import { motion, AnimatePresence } from 'framer-motion';
import { getStreamingServicesForAnime } from '../api/anilist';
import type { Media } from '../types/anime';
import type { ProcessedUserData } from '../hooks/useAnimeData';
import { calculateMatchScore } from '../hooks/useAnimeData';
import './AnimeModal.css';

interface AnimeModalProps {
  anime: Media | null;
  processedData: ProcessedUserData | null;
  onClose: () => void;
}

export function AnimeModal({ anime, processedData, onClose }: AnimeModalProps) {
  if (!anime) return null;

  const matchScore = processedData ? calculateMatchScore(anime, processedData) : null;
  const streamingServices = getStreamingServicesForAnime(anime);
  const displayTitle = anime.title.english || anime.title.romaji;
  const studios = anime.studios?.nodes?.map(s => s.name).join(', ');

  // Get streaming links
  const streamingLinks = anime.externalLinks?.filter(link => link.type === 'STREAMING') || [];

  return (
    <AnimatePresence>
      <motion.div 
        className="modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="modal-content"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="modal-close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          {anime.bannerImage && (
            <div className="modal-banner">
              <img src={anime.bannerImage} alt="" />
              <div className="banner-overlay" />
            </div>
          )}

          <div className="modal-body">
            <div className="modal-poster">
              <img 
                src={anime.coverImage?.large || anime.coverImage?.medium} 
                alt={displayTitle}
              />
              {matchScore !== null && (
                <div className="modal-match">
                  <span className="match-value">{matchScore}%</span>
                  <span className="match-text">Match</span>
                </div>
              )}
            </div>

            <div className="modal-info">
              <h2 className="modal-title">{displayTitle}</h2>
              {anime.title.native && (
                <p className="modal-native-title">{anime.title.native}</p>
              )}

              <div className="modal-meta">
                {anime.format && <span className="meta-badge">{anime.format}</span>}
                {anime.status && (
                  <span className={`meta-badge status ${anime.status.toLowerCase()}`}>
                    {anime.status === 'FINISHED' ? 'Complete' : anime.status}
                  </span>
                )}
                {anime.episodes && <span>{anime.episodes} Episodes</span>}
                {anime.seasonYear && <span>{anime.season} {anime.seasonYear}</span>}
              </div>

              <div className="modal-scores">
                {anime.averageScore && (
                  <div className="score-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    <span>{anime.averageScore}% Average Score</span>
                  </div>
                )}
                {anime.popularity && (
                  <div className="score-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    <span>{anime.popularity.toLocaleString()} Users</span>
                  </div>
                )}
              </div>

              {studios && (
                <p className="modal-studios">
                  <strong>Studio:</strong> {studios}
                </p>
              )}

              <div className="modal-genres">
                {anime.genres.map((genre) => (
                  <span key={genre} className="genre-pill">{genre}</span>
                ))}
              </div>

              {anime.description && (
                <div 
                  className="modal-description"
                  dangerouslySetInnerHTML={{ __html: anime.description }}
                />
              )}

              {streamingServices.length > 0 && (
                <div className="modal-streaming">
                  <h3 className="streaming-title">Watch On</h3>
                  <div className="streaming-links">
                    {streamingLinks.map((link, index) => {
                      const service = streamingServices.find(s => 
                        link.site.toLowerCase().includes(s.id.toLowerCase()) ||
                        link.url.toLowerCase().includes(s.id.toLowerCase())
                      );
                      return (
                        <a
                          key={index}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="streaming-link"
                          style={{ '--service-color': service?.color || 'var(--accent-primary)' } as React.CSSProperties}
                        >
                          <span className="link-indicator" />
                          {link.site}
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                            <polyline points="15 3 21 3 21 9"/>
                            <line x1="10" y1="14" x2="21" y2="3"/>
                          </svg>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              <a
                href={`https://anilist.co/anime/${anime.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="anilist-link"
              >
                View on AniList
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </a>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
