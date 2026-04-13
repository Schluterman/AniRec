import type { ReactNode } from 'react';
import type { StreamingServiceId } from '../types/anime';

interface StreamingIconProps {
  serviceId: StreamingServiceId;
  size?: number;
  className?: string;
}

export function StreamingIcon({ serviceId, size = 24, className = '' }: StreamingIconProps) {
  const icons: Record<StreamingServiceId, ReactNode> = {
    // Crunchyroll - stylized swirl logo
    crunchyroll: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.5 7.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c2.07 0 3.9 1.05 4.97 2.65a4 4 0 0 0-1.47-.27c-2.21 0-4 1.79-4 4s1.79 4 4 4c.52 0 1.02-.1 1.47-.28C15.9 17.95 14.07 19 12 19z" />
      </svg>
    ),
    // HIDIVE - speech bubble / dive icon
    hidive: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 2.5c2.49 0 4.5 2.01 4.5 4.5s-2.01 4.5-4.5 4.5S7.5 13.49 7.5 11 9.51 6.5 12 6.5zm0 7c1.38 0 2.5-1.12 2.5-2.5s-1.12-2.5-2.5-2.5-2.5 1.12-2.5 2.5 1.12 2.5 2.5 2.5z" />
      </svg>
    ),
    // Netflix - stylized N
    netflix: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M5 3h4l5 12V3h5v18h-4l-5-12v12H5V3z" />
      </svg>
    ),
    // Amazon Prime Video - play arrow in circle
    amazon: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l7 4.5-7 4.5z" />
      </svg>
    ),
    // Hulu - rounded rectangle with letters
    hulu: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <text x="12" y="15" fontSize="7" fontWeight="bold" textAnchor="middle" fill="white" fontFamily="sans-serif">hu</text>
      </svg>
    ),
  };

  return icons[serviceId] || null;
}

// Compact icon versions for chips/buttons
export function StreamingIconCompact({ serviceId, size = 18 }: StreamingIconProps) {
  return <StreamingIcon serviceId={serviceId} size={size} />;
}

