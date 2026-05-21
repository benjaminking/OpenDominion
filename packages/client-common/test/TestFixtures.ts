import { CardLocation, CardMetadata, CardType, ChoiceType } from '@dominion/common';

export const createCardMetadata = (
  name: string,
  options?: { coins?: number; types?: CardType[]; id?: string; location?: CardLocation },
): CardMetadata => {
  const coins = options?.coins ?? 0;
  const types = options?.types ?? [];
  const location = options?.location ?? CardLocation.HAND;

  return {
    id: options?.id ?? `${name.toLowerCase()}-id`,
    name,
    types,
    location,
    cost: {
      coins,
      debt: 0,
      potions: 0,
    },
  } as CardMetadata;
};

export const createCardChoice = (name: string, coins: number, types: CardType[] = []) =>
  ({
    type: ChoiceType.Card,
    card: createCardMetadata(name, { coins, types }),
  }) as const;

export const createMultiCardChoice = (name: string, coins: number, types: CardType[] = []) =>
  ({
    type: ChoiceType.MultiCard,
    cards: [createCardMetadata(name, { coins, types })],
  }) as const;
