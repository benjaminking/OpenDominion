import { CardLocation } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { CardFactory } from '../../src/card/CardFactory';
import { SharedGameState } from '../../src/SharedGameState';

const createSharedGameStateMock = () => {
  return {
    cost: vi.fn((card) => card.getOriginalCost()),
    registerEffectTrigger: vi.fn(),
  } as unknown as SharedGameState;
};

describe('CardFactory', () => {
  it('creates a card instance and applies the requested id and location', () => {
    const factory = new CardFactory(createSharedGameStateMock());

    const card = factory.createCard('Copper', 'copper-1', CardLocation.HAND);

    expect(card.getName()).toBe('Copper');
    expect(card.getClassName()).toBe('Copper');
    expect(card.getId()).toBe('copper-1');
    expect(card.getLocation()).toBe(CardLocation.HAND);
  });

  it('creates distinct card instances for separate ids', () => {
    const factory = new CardFactory(createSharedGameStateMock());

    const firstCard = factory.createCard('Estate', 'estate-1', CardLocation.PILE);
    const secondCard = factory.createCard('Estate', 'estate-2', CardLocation.DISCARD);

    expect(firstCard).not.toBe(secondCard);
    expect(firstCard.getId()).toBe('estate-1');
    expect(secondCard.getId()).toBe('estate-2');
    expect(secondCard.getLocation()).toBe(CardLocation.DISCARD);
  });
});
