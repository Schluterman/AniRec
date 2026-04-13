import { STREAMING_SERVICES } from '../types/anime';
import type { StreamingServiceId } from '../types/anime';
import type { ActivePackId } from '../types/packs';

/**
 * Pack face assets in /public — filenames must match files on disk (see repo `public/`).
 * Masks (foil, tear) reuse AniRec master art when platform-specific masks are absent.
 */
export interface PackArtUrls {
  front: string;
  edge: string;
  back: string;
  foilMask: string;
  tearMask: string;
  frontMask: string;
}

const ANIREC_BASE = {
  front: '/AniRecPack_frontv2.png',
  edge: '/AniRecPack_backv2.png',
  back: '/AniRecPack_backv2.png',
  foilMask: '/AniRecPack_foil_mask.png',
  tearMask: '/AniRecPack_split_tear_mask.png',
  frontMask: '/AniRecPack_frontv2.png',
} satisfies PackArtUrls;

const EDGE_FALLBACK = ANIREC_BASE.edge;

/** Plan-to-watch themed pack (not a streaming provider). */
const PLANNING_FACES = {
  front: '/planningFrontCard-removebg-preview.png',
  edge: '/planningEdge.png',
  back: '/planningBackCard-removebg-preview.png',
};

/**
 * Platform pack art — front/edge/back per streaming service.
 */
const PLATFORM_PACKS: Record<
  StreamingServiceId,
  Pick<PackArtUrls, 'front' | 'edge' | 'back'>
> = {
  crunchyroll: {
    front: '/ChrunchyrollFrontCard-removebg-preview.png',
    edge: '/ChrunchyrollEdge.png',
    back: '/ChrunchyRollBackCard-removebg-preview.png',
  },
  hidive: {
    front: '/HIDIVEFrontCard-removebg-preview.png',
    edge: '/HIDIVEEdge.png',
    back: '/HIDIVEBackCard-removebg-preview.png',
  },
  netflix: {
    front: '/NetflixFrontCard-removebg-preview.png',
    edge: '/NetflixEdge.png',
    back: '/NetflixBackOfCard-removebg-preview.png',
  },
  amazon: {
    front: '/PrimeVideoFrontCard-removebg-preview.png',
    edge: '/PrimeVideoEdge.png',
    back: '/PrimeVideoBackCard-removebg-preview.png',
  },
  hulu: {
    front: '/HuluFrontCard-removebg-preview.png',
    edge: '/HuluEdge.png',
    back: '/HuluBackCard-removebg-preview.png',
  },
};

function withSharedMasks(
  faces: Pick<PackArtUrls, 'front' | 'edge' | 'back'>
): PackArtUrls {
  return {
    ...faces,
    foilMask: ANIREC_BASE.foilMask,
    tearMask: ANIREC_BASE.tearMask,
    frontMask: ANIREC_BASE.frontMask,
  };
}

export function getPackArt(packId: ActivePackId): PackArtUrls {
  if (packId === 'anirec') {
    return { ...ANIREC_BASE };
  }
  if (packId === 'planning') {
    return withSharedMasks(PLANNING_FACES);
  }
  const faces = PLATFORM_PACKS[packId];
  return withSharedMasks({
    front: faces.front,
    back: faces.back,
    edge: faces.edge || EDGE_FALLBACK,
  });
}

export const ALL_PACK_IDS: ActivePackId[] = [
  'anirec',
  'planning',
  ...STREAMING_SERVICES.map(s => s.id),
];

/** Streaming-only filter; use with planning handled separately in App. */
export function activePackToServiceFilter(packId: ActivePackId): StreamingServiceId[] {
  if (packId === 'anirec' || packId === 'planning') return [];
  return [packId];
}
