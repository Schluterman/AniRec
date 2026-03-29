import type { StreamingServiceId } from './anime';

/** Single active booster: master, Plan-to-Watch pool, or one streaming SKU. */
export type ActivePackId = 'anirec' | 'planning' | StreamingServiceId;
