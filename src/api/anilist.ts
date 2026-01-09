import type { Media, MediaListCollection, StreamingServiceId } from '../types/anime';
import { STREAMING_SERVICES } from '../types/anime';

export type { Media, MediaListEntry, MediaListCollection, StreamingServiceId } from '../types/anime';
export { STREAMING_SERVICES } from '../types/anime';

const ANILIST_API = 'https://graphql.anilist.co';

// Query to get user's anime list
const USER_ANIME_LIST_QUERY = `
query ($userName: String) {
  MediaListCollection(userName: $userName, type: ANIME) {
    lists {
      name
      status
      entries {
        id
        status
        score
        progress
        updatedAt
        completedAt {
          year
          month
          day
        }
        media {
          id
          title {
            romaji
            english
            native
          }
          coverImage {
            large
            medium
            color
          }
          bannerImage
          genres
          tags {
            name
            rank
          }
          averageScore
          popularity
          episodes
          status
          season
          seasonYear
          format
          description
          studios {
            nodes {
              name
            }
          }
          externalLinks {
            site
            url
            type
          }
        }
      }
    }
  }
}
`;

// Query to get anime recommendations based on genres and tags
const RECOMMENDATIONS_QUERY = `
query ($page: Int, $perPage: Int, $genres: [String], $excludeIds: [Int], $sort: [MediaSort]) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      total
      currentPage
      lastPage
      hasNextPage
    }
    media(type: ANIME, genre_in: $genres, id_not_in: $excludeIds, sort: $sort, status_in: [FINISHED, RELEASING]) {
      id
      title {
        romaji
        english
        native
      }
      coverImage {
        large
        medium
        color
      }
      bannerImage
      genres
      tags {
        name
        rank
      }
      averageScore
      popularity
      episodes
      status
      season
      seasonYear
      format
      description
      studios {
        nodes {
          name
        }
      }
      externalLinks {
        site
        url
        type
      }
    }
  }
}
`;

// Query for searching anime with more filters
const SEARCH_RECOMMENDATIONS_QUERY = `
query ($page: Int, $perPage: Int, $genres: [String], $excludeIds: [Int], $sort: [MediaSort], $minimumScore: Int) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      total
      currentPage
      lastPage
      hasNextPage
    }
    media(
      type: ANIME, 
      genre_in: $genres, 
      id_not_in: $excludeIds, 
      sort: $sort, 
      status_in: [FINISHED, RELEASING],
      averageScore_greater: $minimumScore
    ) {
      id
      title {
        romaji
        english
        native
      }
      coverImage {
        large
        medium
        color
      }
      bannerImage
      genres
      tags {
        name
        rank
      }
      averageScore
      popularity
      episodes
      status
      season
      seasonYear
      format
      description
      studios {
        nodes {
          name
        }
      }
      externalLinks {
        site
        url
        type
      }
    }
  }
}
`;

async function fetchGraphQL(query: string, variables: Record<string, unknown>) {
  const response = await fetch(ANILIST_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await response.json();

  if (json.errors) {
    throw new Error(json.errors[0].message);
  }

  return json.data;
}

export async function fetchUserAnimeList(userName: string): Promise<MediaListCollection> {
  const data = await fetchGraphQL(USER_ANIME_LIST_QUERY, { userName });
  return data.MediaListCollection;
}

export async function fetchRecommendations(
  genres: string[],
  excludeIds: number[],
  page: number = 1,
  perPage: number = 50
): Promise<{ pageInfo: { hasNextPage: boolean; total: number }; media: Media[] }> {
  const data = await fetchGraphQL(RECOMMENDATIONS_QUERY, {
    page,
    perPage,
    genres: genres.length > 0 ? genres : undefined,
    excludeIds,
    sort: ['POPULARITY_DESC', 'SCORE_DESC'],
  });
  return data.Page;
}

export async function fetchAdvancedRecommendations(
  genres: string[],
  _tags: string[],
  _excludeIds: number[],
  page: number = 1,
  perPage: number = 50,
  minimumScore: number = 60
): Promise<{ pageInfo: { hasNextPage: boolean; total: number }; media: Media[] }> {
  // Note: We don't send excludeIds to the API anymore since large lists cause issues
  // Instead, we filter client-side in useRecommendations hook
  const data = await fetchGraphQL(SEARCH_RECOMMENDATIONS_QUERY, {
    page,
    perPage,
    genres: genres.length > 0 ? genres : undefined,
    excludeIds: [], // Empty - we filter client-side
    sort: ['SCORE_DESC', 'POPULARITY_DESC'],
    minimumScore,
  });
  return data.Page;
}

// Fetch a MASSIVE pool of anime by loading multiple pages with variety
export async function fetchLargeAnimePool(
  genres: string[],
  pagesToFetch: number = 10
): Promise<Media[]> {
  const allMedia: Media[] = [];
  const fetchPromises: Promise<Media[]>[] = [];

  // Different sort strategies for variety
  const sortStrategies = [
    { sort: ['SCORE_DESC'], minScore: 70 },      // High rated
    { sort: ['SCORE_DESC'], minScore: 50 },      // Medium+ rated
    { sort: ['POPULARITY_DESC'], minScore: 40 }, // Popular
    { sort: ['TRENDING_DESC'], minScore: 30 },   // Trending
    { sort: ['FAVOURITES_DESC'], minScore: 40 }, // Fan favorites
    { sort: ['START_DATE_DESC'], minScore: 50 }, // Recent releases
    { sort: ['SCORE_DESC'], minScore: 60 },      // Good anime
    { sort: ['POPULARITY_DESC'], minScore: 30 }, // Very popular (lower threshold)
    { sort: ['TRENDING_DESC'], minScore: 40 },   // More trending
    { sort: ['START_DATE_DESC'], minScore: 40 }, // More recent
  ];

  // For each page, use a different strategy
  for (let i = 0; i < pagesToFetch; i++) {
    const strategy = sortStrategies[i % sortStrategies.length];
    const page = Math.floor(i / sortStrategies.length) + 1;

    // If we have genres, use them; otherwise fetch general popular anime
    fetchPromises.push(
      fetchGraphQL(SEARCH_RECOMMENDATIONS_QUERY, {
        page,
        perPage: 50, // AniList max is 50 per page
        genres: genres.length > 0 ? genres : undefined,
        excludeIds: [],
        sort: strategy.sort,
        minimumScore: strategy.minScore,
      })
        .then(data => (data.Page?.media || []) as Media[])
        .catch(() => [] as Media[]) // Don't fail if one request fails
    );
  }

  // If user has specific genres, also fetch some from individual top genres for variety
  if (genres.length > 0) {
    for (const genre of genres.slice(0, 3)) {
      fetchPromises.push(
        fetchGraphQL(SEARCH_RECOMMENDATIONS_QUERY, {
          page: 1,
          perPage: 50,
          genres: [genre], // Single genre for more targeted results
          excludeIds: [],
          sort: ['POPULARITY_DESC'],
          minimumScore: 40,
        })
          .then(data => (data.Page?.media || []) as Media[])
          .catch(() => [] as Media[])
      );
    }
  }

  // Fetch all pages in parallel
  const results = await Promise.all(fetchPromises);

  // Combine and deduplicate
  const seenIds = new Set<number>();
  for (const mediaList of results) {
    for (const media of mediaList) {
      if (!seenIds.has(media.id)) {
        seenIds.add(media.id);
        allMedia.push(media);
      }
    }
  }

  console.log(`Fetched ${allMedia.length} unique anime for recommendation pool`);

  return allMedia;
}

export function getStreamingServicesForAnime(anime: Media): typeof STREAMING_SERVICES[number][] {
  if (!anime.externalLinks) return [];

  const streamingLinks = anime.externalLinks.filter(link => link.type === 'STREAMING');

  return STREAMING_SERVICES.filter(service =>
    streamingLinks.some(link =>
      link.site.toLowerCase().includes(service.id.toLowerCase()) ||
      link.url.toLowerCase().includes(service.id.toLowerCase())
    )
  );
}

export function filterByStreamingService(
  animeList: Media[],
  selectedServices: StreamingServiceId[]
): Media[] {
  if (selectedServices.length === 0) return animeList;

  return animeList.filter(anime => {
    const animeServices = getStreamingServicesForAnime(anime);
    return animeServices.some(service => selectedServices.includes(service.id));
  });
}
