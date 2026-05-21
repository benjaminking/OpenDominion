import { CardLocation, CardType, ChoiceType } from '@dominion/common';

export const createCardMetadata = (name: string, options?: { id?: string; coins?: number; types?: CardType[] }) => ({
  id: options?.id ?? `${name.toLowerCase()}-id`,
  name,
  location: CardLocation.HAND,
  types: options?.types ?? [],
  cost: {
    coins: options?.coins ?? 0,
    debt: 0,
    potions: 0,
  },
});

export const createCardChoice = (name: string, options?: { id?: string; coins?: number; types?: CardType[] }) => ({
  type: ChoiceType.Card,
  card: createCardMetadata(name, options),
});

export const createGameStateStub = (overrides?: {
  countInPile?: (pileName: string) => number;
  countInDeck?: (cardName: string) => number;
  coinsInDeck?: () => number;
}) =>
  ({
    piles: {
      getCountInPile: (pileName: string) => overrides?.countInPile?.(pileName) ?? 0,
    },
    botStatistics: {
      getCountInDeck: (cardName: string) => overrides?.countInDeck?.(cardName) ?? 0,
      getCoinsInDeck: () => overrides?.coinsInDeck?.() ?? 0,
    },
  }) as const;
