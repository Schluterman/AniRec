import type { ActivePackId } from './packs';

export type PendingCheckout = { username: string; packId: ActivePackId };

export type CardShopLocationState = {
  prefilledUsername?: string;
};
