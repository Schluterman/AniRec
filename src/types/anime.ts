export interface Media {
  id: number;
  title: {
    romaji: string;
    english: string | null;
    native: string;
  };
  coverImage: {
    large: string;
    medium: string;
    color: string | null;
  };
  bannerImage: string | null;
  genres: string[];
  tags: { name: string; rank: number }[];
  averageScore: number | null;
  popularity: number;
  episodes: number | null;
  status: string;
  season: string | null;
  seasonYear: number | null;
  format: string;
  description: string | null;
  studios: {
    nodes: { name: string }[];
  };
  externalLinks: {
    site: string;
    url: string;
    type: string;
  }[];
  relations?: {
    edges: {
      relationType: string;
      node: { id: number };
    }[];
  };
}

export interface MediaListEntry {
  id: number;
  status: string;
  score: number;
  progress: number;
  updatedAt: number; // Unix timestamp
  completedAt?: {
    year: number | null;
    month: number | null;
    day: number | null;
  };
  media: Media;
}

export interface MediaListCollection {
  lists: {
    name: string;
    status: string;
    entries: MediaListEntry[];
  }[];
}

export const STREAMING_SERVICES = [
  { id: 'crunchyroll', name: 'Crunchyroll', color: '#F47521' },
  { id: 'hidive', name: 'HIDIVE', color: '#00BAAD' },
  { id: 'netflix', name: 'Netflix', color: '#E50914' },
  { id: 'amazon', name: 'Amazon Prime Video', color: '#00A8E1' },
  { id: 'hulu', name: 'Hulu', color: '#1CE783' },
] as const;

export type StreamingServiceId = typeof STREAMING_SERVICES[number]['id'];

