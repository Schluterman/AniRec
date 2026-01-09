import { motion } from 'framer-motion';
import { STREAMING_SERVICES } from '../types/anime';
import type { StreamingServiceId } from '../types/anime';
import './StreamingFilter.css';

interface StreamingFilterProps {
  selectedServices: StreamingServiceId[];
  onToggleService: (serviceId: StreamingServiceId) => void;
  onClearAll: () => void;
}

export function StreamingFilter({ 
  selectedServices, 
  onToggleService,
  onClearAll
}: StreamingFilterProps) {
  return (
    <motion.div 
      className="streaming-filter"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="filter-header">
        <h3 className="filter-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          Filter by Streaming Service
        </h3>
        {selectedServices.length > 0 && (
          <button className="clear-button" onClick={onClearAll}>
            Clear all
          </button>
        )}
      </div>
      
      <div className="services-grid">
        {STREAMING_SERVICES.map((service) => {
          const isSelected = selectedServices.includes(service.id);
          return (
            <motion.button
              key={service.id}
              className={`service-chip ${isSelected ? 'selected' : ''}`}
              onClick={() => onToggleService(service.id)}
              style={{
                '--service-color': service.color,
              } as React.CSSProperties}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="service-indicator" />
              <span className="service-name">{service.name}</span>
              {isSelected && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </motion.button>
          );
        })}
      </div>

      {selectedServices.length > 0 && (
        <p className="filter-info">
          Showing anime available on {selectedServices.length} selected service{selectedServices.length > 1 ? 's' : ''}
        </p>
      )}
    </motion.div>
  );
}
