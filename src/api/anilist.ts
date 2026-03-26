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

// Query for searching anime by genres
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
      relations {
        edges {
          relationType(version: 2)
          node {
            id
          }
        }
      }
    }
  }
}
`;

// Query for searching anime with score filter — supports genre_in OR tag_in
const SEARCH_RECOMMENDATIONS_QUERY = `
query ($page: Int, $perPage: Int, $genres: [String], $tags: [String], $sort: [MediaSort], $minimumScore: Int) {
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
      tag_in: $tags,
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
      relations {
        edges {
          relationType(version: 2)
          node {
            id
          }
        }
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
  const data = await fetchGraphQL(SEARCH_RECOMMENDATIONS_QUERY, {
    page,
    perPage,
    genres: genres.length > 0 ? genres : undefined,
    tags: undefined,
    sort: ['SCORE_DESC', 'POPULARITY_DESC'],
    minimumScore,
  });
  return data.Page;
}

// Fetch one page and return media + whether more pages exist
async function fetchPoolPage(
  genres: string[] | undefined,
  tags: string[] | undefined,
  sort: string[],
  minScore: number,
  page: number
): Promise<{ media: Media[]; hasNextPage: boolean }> {
  try {
    const data = await fetchGraphQL(SEARCH_RECOMMENDATIONS_QUERY, {
      page,
      perPage: 50,
      genres: genres && genres.length > 0 ? genres : undefined,
      tags: tags && tags.length > 0 ? tags : undefined,
      sort,
      minimumScore: minScore,
    });
    return {
      media: (data.Page?.media || []) as Media[],
      hasNextPage: data.Page?.pageInfo?.hasNextPage ?? false,
    };
  } catch {
    return { media: [], hasNextPage: false };
  }
}

// Fetch all pages for a stream until exhausted (capped at maxPages per stream)
async function fetchStreamAllPages(
  genres: string[] | undefined,
  tags: string[] | undefined,
  sort: string[],
  minScore: number,
  maxPages: number = 10
): Promise<Media[]> {
  // Fetch page 1 first to learn total pages
  const first = await fetchPoolPage(genres, tags, sort, minScore, 1);
  const allMedia = [...first.media];

  if (!first.hasNextPage) return allMedia;

  // Fire remaining pages in parallel (up to maxPages)
  const remaining: Promise<{ media: Media[] }>[] = [];
  for (let p = 2; p <= maxPages; p++) {
    remaining.push(fetchPoolPage(genres, tags, sort, minScore, p));
  }

  const results = await Promise.all(remaining);
  for (const r of results) {
    allMedia.push(...r.media);
    if (!('hasNextPage' in r) || !(r as { hasNextPage: boolean }).hasNextPage) break;
  }

  return allMedia;
}

// Fetch a large, uncapped pool driven by the user's top genres and tags.
// Each stream independently paginates until AniList has no more results (max 10 pages per stream).
export async function fetchLargeAnimePool(
  genres: string[],
  tags: string[]
): Promise<Media[]> {
  const top3Genres = genres.slice(0, 3);
  const top3Tags = tags.slice(0, 3);

  // Build parallel stream promises — each exhausts its own pages
  const streams: Promise<Media[]>[] = [];

  // Genre-based streams
  for (const genre of top3Genres) {
    streams.push(fetchStreamAllPages([genre], undefined, ['SCORE_DESC'], 60));
    streams.push(fetchStreamAllPages([genre], undefined, ['POPULARITY_DESC'], 40));
  }

  // Tag-based streams
  for (const tag of top3Tags) {
    streams.push(fetchStreamAllPages(undefined, [tag], ['SCORE_DESC'], 60));
    streams.push(fetchStreamAllPages(undefined, [tag], ['POPULARITY_DESC'], 40));
  }

  // Combined top genres for variety
  if (top3Genres.length > 0) {
    streams.push(fetchStreamAllPages(top3Genres, undefined, ['SCORE_DESC'], 70));
    streams.push(fetchStreamAllPages(top3Genres, undefined, ['TRENDING_DESC'], 40));
    streams.push(fetchStreamAllPages(top3Genres, undefined, ['FAVOURITES_DESC'], 50));
    streams.push(fetchStreamAllPages(top3Genres, undefined, ['START_DATE_DESC'], 55));
  }

  // Global discovery streams (no genre/tag filter) to surface anything relevant
  streams.push(fetchStreamAllPages(undefined, undefined, ['TRENDING_DESC'], 60));
  streams.push(fetchStreamAllPages(undefined, undefined, ['FAVOURITES_DESC'], 70));

  const results = await Promise.all(streams);

  // Deduplicate across all streams
  const seenIds = new Set<number>();
  const allMedia: Media[] = [];
  for (const batch of results) {
    for (const media of batch) {
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
