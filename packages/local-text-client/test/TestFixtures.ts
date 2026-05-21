import { CardLocation, CardType, ChoiceType, LogMessageType } from '@dominion/common';

export const createCardMetadata = (name: string, id?: string) => ({
  id: id ?? `${name.toLowerCase()}-id`,
  name,
  location: CardLocation.HAND,
  types: [CardType.ACTION],
  cost: {
    coins: 3,
    debt: 0,
    potions: 0,
  },
});

export const createLogMessage = (overrides?: {
  text?: string;
  playerName?: string;
  knownCards?: ReturnType<typeof createCardMetadata>[];
  numUnknownCards?: number;
  type?: LogMessageType;
}) => ({
  orderIndex: 1,
  playerName: overrides?.playerName ?? 'Alice',
  text: overrides?.text ?? 'does something',
  knownCards: overrides?.knownCards ?? [],
  numUnknownCards: overrides?.numUnknownCards ?? 0,
  type: overrides?.type ?? LogMessageType.NORMAL,
});

export const createCardChoice = (name: string) => ({
  type: ChoiceType.Card,
  card: createCardMetadata(name),
});

export const createNamedChoice = (name: string) => ({
  type: ChoiceType.ChooseOne,
  name,
});

export const createEffectChoice = (effectName: string, effectId: string) => ({
  type: ChoiceType.Effect,
  effectName,
  effectId,
});

export const createExtraTurnChoice = (name: string) => ({
  type: ChoiceType.ExtraTurn,
  card: createCardMetadata(name),
  name,
});
