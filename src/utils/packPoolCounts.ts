import { getStreamingServicesForAnime } from '../api/anilist';
import { STREAMING_SERVICES } from '../types/anime';
import type { Media } from '../types/anime';
import type { ActivePackId } from '../types/packs';
import type { ProcessedUserData } from '../hooks/useAnimeData';

export function computePoolCounts(
  filteredMedia: Media[],
  processedData: ProcessedUserData | null
): Record<ActivePackId, number> {
  const counts = {} as Record<ActivePackId, number>;
  counts.anirec = filteredMedia.length;
  counts.planning = processedData
    ? processedData.byStatus.planning.length
    : 0;
  for (const s of STREAMING_SERVICES) {
    counts[s.id] = filteredMedia.filter(a =>
      getStreamingServicesForAnime(a).some(x => x.id === s.id)
    ).length;
  }
  return counts;
}
