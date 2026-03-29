import { motion } from 'framer-motion';
import type { ProcessedUserData } from '../hooks/useAnimeData';
import './UserStats.css';

interface UserStatsProps {
  data: ProcessedUserData;
  userName: string;
}

export function UserStats({ data, userName }: UserStatsProps) {
  const totalAnime = data.allEntries.length;

  return (
    <section className="user-stats">
      <div className="stats-content">
        <div className="stats-header">
          <div className="profile-badge">
            <span className="badge-letter">{userName.charAt(0).toUpperCase()}</span>
          </div>
          <div className="stats-intro">
            <p className="intro-text">
              Here's what we gathered from{' '}
              <a 
                href={`https://anilist.co/user/${userName}`}
                target="_blank"
                rel="noopener noreferrer"
                className="username-link"
              >
                {userName}'s
              </a>
              {' '}profile
            </p>
          </div>
        </div>

        <div className="stats-summary">
          <motion.div 
            className="stat-highlight"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <span className="highlight-value">{totalAnime}</span>
            <span className="highlight-label">Total Shows</span>
          </motion.div>

          <motion.div 
            className="top-genres"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="genres-label">Top Genres:</span>
            <div className="genres-list">
              {data.favoriteGenres.slice(0, 5).map(g => (
                <span key={g.genre} className="genre-pill">
                  {g.genre}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
