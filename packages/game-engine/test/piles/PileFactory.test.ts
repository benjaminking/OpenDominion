import { CardInfo, CardLocation, CardType, Expansion, PileCategory } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { GameMessageBroadcaster } from '../../src/messaging/GameMessageBroadcaster';
import { PileFactory } from '../../src/piles/PileFactory';
import { SharedGameState } from '../../src/game-state/SharedGameState';

const createSharedGameStateMock = () => {
  return {
    cost: vi.fn((card) => card.getOriginalCost()),
    registerEffectTrigger: vi.fn(),
  } as unknown as SharedGameState;
};

const createBroadcaster = () => {
  return {
    sendPileMetadata: vi.fn(),
    updateSharedCards: vi.fn(),
  } as unknown as GameMessageBroadcaster;
};

const estateInfo: CardInfo = {
  name: 'Estate',
  text: '1 VP',
  font_size: 'small',
  cost: {
    coins: 2,
    potions: 0,
    debt: 0,
  },
  types: [CardType.VICTORY],
  expansion: Expansion.BASE,
  mechanics: [],
};

describe('PileFactory', () => {
  it('creates a pile with supply cards using pile-specific ids and locations', () => {
    const pileFactory = new PileFactory(createSharedGameStateMock(), createBroadcaster());

    const pile = pileFactory.createPile(estateInfo, 3, new Set([PileCategory.BASIC_VICTORY]));

    expect(pile.name).toBe('Estate');
    expect(pile.originalSize).toBe(3);
    expect(pile.size()).toBe(3);
    expect(pile.getPileMetadata()).toEqual({
      name: 'Estate',
      size: 3,
      cost: {
        coins: 2,
        potions: 0,
        debt: 0,
        has_asterisk: false,
      },
      topCard: expect.objectContaining({
        name: 'Estate',
        id: 'Estate_pile_2',
        location: CardLocation.PILE,
        types: [CardType.VICTORY],
      }),
      types: [CardType.VICTORY],
      categories: [PileCategory.BASIC_VICTORY],
    });
  });

  it('marks every created card as a supply card', () => {
    const pileFactory = new PileFactory(createSharedGameStateMock(), createBroadcaster());

    const pile = pileFactory.createPile(estateInfo, 2, new Set([PileCategory.KINGDOM]));
    const firstCard = pile.removeTopCard();
    const secondCard = pile.removeTopCard();

    expect(firstCard.isSupplyCard()).toBe(true);
    expect(secondCard.isSupplyCard()).toBe(true);
    expect(firstCard.getId()).toBe('Estate_pile_1');
    expect(secondCard.getId()).toBe('Estate_pile_0');
  });
});
