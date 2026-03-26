import { useQuery } from '@tanstack/react-query';
import {
  fetchUserAnimeList,
  fetchLargeAnimePool,
  filterByStreamingService,
} from '../api/anilist';
import type { Media, MediaListEntry, StreamingServiceId } from '../types/anime';
import { useMemo } from 'react';

export function useUserAnimeList(userName: string) {
  return useQuery({
    queryKey: ['userAnimeList', userName],
    queryFn: () => fetchUserAnimeList(userName),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!userName,
  });
}

export type ProcessedUserData = {
  allEntries: MediaListEntry[];
  watchedIds: number[];
  favoriteGenres: { genre: string; count: number; avgScore: number }[];
  favoriteTags: { tag: string; count: number; avgScore: number }[];
  byStatus: {
    completed: MediaListEntry[];
    watching: MediaListEntry[];
    planning: MediaListEntry[];
    dropped: MediaListEntry[];
    paused: MediaListEntry[];
  };
};

export function useProcessedUserData(userName: string): ProcessedUserData | null {
  const { data } = useUserAnimeList(userName);

  return useMemo(() => {
    if (!data?.lists) return null;

    const allEntries: MediaListEntry[] = [];
    const seenIds = new Set<number>();
    const byStatus = {
      completed: [] as MediaListEntry[],
      watching: [] as MediaListEntry[],
      planning: [] as MediaListEntry[],
      dropped: [] as MediaListEntry[],
      paused: [] as MediaListEntry[],
    };

    // Process all lists, avoiding duplicates
    for (const list of data.lists) {
      for (const entry of list.entries) {
        // Skip if we've already seen this anime
        if (seenIds.has(entry.media.id)) continue;
        seenIds.add(entry.media.id);

        allEntries.push(entry);

        const status = entry.status?.toLowerCase() || list.status?.toLowerCase();
        if (status === 'completed') byStatus.completed.push(entry);
        else if (status === 'current' || status === 'watching') byStatus.watching.push(entry);
        else if (status === 'planning') byStatus.planning.push(entry);
        else if (status === 'dropped') byStatus.dropped.push(entry);
        else if (status === 'paused') byStatus.paused.push(entry);
      }
    }

    // Get all anime IDs from the user's list (to exclude from recommendations)
    const watchedIds = allEntries.map(entry => entry.media.id);

    // Analyze favorite genres from completed anime
    const genreStats = new Map<string, { count: number; totalScore: number; scoredCount: number; recencyBonus: number }>();
    const tagStats = new Map<string, { count: number; totalScore: number; scoredCount: number; recencyBonus: number }>();

    // Check how many scored entries we have
    const scoredEntries = byStatus.completed.filter(e => e.score >= 7);
    const hasEnoughScores = scoredEntries.length >= 10;

    // Sort completed anime by most recent (updatedAt timestamp, descending)
    const sortedCompleted = [...byStatus.completed].sort((a, b) =>
      (b.updatedAt || 0) - (a.updatedAt || 0)
    );

    // Use EITHER scored entries (if user rates) OR most recent 15 completions
    // This handles users who don't rate their anime
    const preferenceEntries = hasEnoughScores
      ? scoredEntries
      : sortedCompleted.slice(0, 15); // Last 15 completed shows

    // For recency weighting, get the 10 most recent completions
    const recentIds = new Set(sortedCompleted.slice(0, 10).map(e => e.media.id));

    for (const entry of preferenceEntries) {
      const { media, score } = entry;
      const isRecent = recentIds.has(media.id);
      const recencyMultiplier = isRecent ? 2 : 1; // Double weight for recent anime

      // Count genres
      for (const genre of media.genres || []) {
        const existing = genreStats.get(genre) || { count: 0, totalScore: 0, scoredCount: 0, recencyBonus: 0 };
        existing.count += recencyMultiplier;
        if (isRecent) existing.recencyBonus++;
        if (score > 0) {
          existing.totalScore += score;
          existing.scoredCount++;
        }
        genreStats.set(genre, existing);
      }

      // Count tags (only high rank tags)
      for (const tag of (media.tags || []).filter(t => t.rank >= 60)) {
        const existing = tagStats.get(tag.name) || { count: 0, totalScore: 0, scoredCount: 0, recencyBonus: 0 };
        existing.count += recencyMultiplier;
        if (isRecent) existing.recencyBonus++;
        if (score > 0) {
          existing.totalScore += score;
          existing.scoredCount++;
        }
        tagStats.set(tag.name, existing);
      }
    }

    // Convert to sorted arrays - prioritize by count (which includes recency bonus)
    // If user has scores, also factor in avgScore; otherwise just use count
    const favoriteGenres = Array.from(genreStats.entries())
      .map(([genre, stats]) => ({
        genre,
        count: stats.count,
        avgScore: stats.scoredCount > 0 ? stats.totalScore / stats.scoredCount : 0,
        recencyBonus: stats.recencyBonus,
      }))
      .sort((a, b) => {
        // If we have scores, use score * count; otherwise use count + recency
        if (hasEnoughScores) {
          return (b.avgScore * b.count) - (a.avgScore * a.count);
        }
        return (b.count + b.recencyBonus * 2) - (a.count + a.recencyBonus * 2);
      })
      .slice(0, 10);

    const favoriteTags = Array.from(tagStats.entries())
      .map(([tag, stats]) => ({
        tag,
        count: stats.count,
        avgScore: stats.scoredCount > 0 ? stats.totalScore / stats.scoredCount : 0,
        recencyBonus: stats.recencyBonus,
      }))
      .sort((a, b) => {
        if (hasEnoughScores) {
          return (b.avgScore * b.count) - (a.avgScore * a.count);
        }
        return (b.count + b.recencyBonus * 2) - (a.count + a.recencyBonus * 2);
      })
      .slice(0, 15);

    return {
      allEntries,
      watchedIds,
      favoriteGenres,
      favoriteTags,
      byStatus,
    };
  }, [data]);
}

export function useRecommendations(
  processedData: ProcessedUserData | null,
  selectedServices: StreamingServiceId[],
  dismissedIds: Set<number> = new Set()
) {
  // Get top genres and tags from user's watch history
  const topGenres = useMemo(() =>
    processedData?.favoriteGenres.slice(0, 5).map(g => g.genre) || [],
    [processedData]
  );

  const topTags = useMemo(() =>
    processedData?.favoriteTags.slice(0, 8).map(t => t.tag) || [],
    [processedData]
  );

  // Get all watched IDs for client-side filtering
  const allWatchedIds = processedData?.watchedIds || [];
  const watchedIdSet = useMemo(() => new Set(allWatchedIds), [allWatchedIds]);

  // Fetch a large, uncapped pool driven by genres + tags
  const query = useQuery({
    queryKey: ['recommendations-pool', topGenres, topTags],
    queryFn: () => fetchLargeAnimePool(topGenres, topTags),
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
    enabled: !!processedData,
  });

  // Filter out watched, sequel-unsafe, dismissed, and by streaming service
  const filteredMedia = useMemo(() => {
    if (!query.data) return [];

    const filtered = query.data.filter(anime => {
      // Exclude anything already on the user's list
      if (watchedIdSet.has(anime.id)) return false;

      // Exclude shows dismissed this session
      if (dismissedIds.has(anime.id)) return false;

      // Sequel safety: if this show has a PREQUEL edge, the prequel must be in watchedIds
      const prequelEdge = anime.relations?.edges.find(e => e.relationType === 'PREQUEL');
      if (prequelEdge && !watchedIdSet.has(prequelEdge.node.id)) return false;

      return true;
    });

    // Apply streaming service filter
    const serviceFiltered = filterByStreamingService(filtered, selectedServices);

    return shuffleArray(serviceFiltered);
  }, [query.data, selectedServices, watchedIdSet, dismissedIds]);

  // Count of unwatched anime before streaming filter
  const unwatchedCount = useMemo(() => {
    if (!query.data) return 0;
    return query.data.filter(anime => !watchedIdSet.has(anime.id)).length;
  }, [query.data, watchedIdSet]);

  return {
    ...query,
    filteredMedia,
    totalBeforeFilter: unwatchedCount,
  };
}

// Fisher-Yates shuffle for randomizing the pool
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Calculate match score based on user preferences
export function calculateMatchScore(
  anime: Media,
  processedData: ProcessedUserData
): number {
  let score = 0;
  const maxScore = 100;

  // Genre matching (up to 40 points)
  const genreWeight = 40;
  const matchedGenres = anime.genres.filter(g =>
    processedData.favoriteGenres.some(fg => fg.genre === g)
  );
  const genreScore = (matchedGenres.length / Math.max(anime.genres.length, 1)) * genreWeight;
  score += genreScore;

  // Tag matching (up to 30 points)
  const tagWeight = 30;
  const matchedTags = anime.tags?.filter(t =>
    processedData.favoriteTags.some(ft => ft.tag === t.name)
  ) || [];
  const tagScore = (matchedTags.length / Math.max(anime.tags?.length || 1, 1)) * tagWeight;
  score += tagScore;

  // AniList score bonus (up to 20 points)
  if (anime.averageScore) {
    score += (anime.averageScore / 100) * 20;
  }

  // Popularity bonus (up to 10 points)
  const popularityScore = Math.min(anime.popularity / 100000, 1) * 10;
  score += popularityScore;

  return Math.round((score / maxScore) * 100);
}
