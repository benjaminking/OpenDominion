import { CardCategory, CardInfo, CardLocation, CardType, Expansion } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { Card } from '../../src/card/Card';
import { LocationExpectation, NoLocationExpectation } from '../../src/game-state/LocationExpectation';
import { SharedGameState } from '../../src/game-state/SharedGameState';
import { createTestClock } from '../testClock';

const cardInfo: CardInfo = {
  category: CardCategory.CARD,
  name: 'Silver',
  text: '$2',
  font_size: 'small',
  cost: { coins: 3 },
  types: [CardType.TREASURE],
  expansion: Expansion.TESTING,
  mechanics: [],
};

const setUp = () => {
  const clock = createTestClock();
  const sharedGameState = { cost: vi.fn(), registerEffectTrigger: vi.fn(), ...clock } as unknown as SharedGameState;
  const card = new Card(sharedGameState, cardInfo);
  card.setId('silver-0');
  const expectNow = (location: CardLocation) => new LocationExpectation(location, clock.getCurrentTimeStamp());
  return { card, clock, expectNow };
};

describe('LocationExpectation', () => {
  it('is met while the card stays where it is expected', () => {
    const { card, clock, expectNow } = setUp();
    card.setLocation(CardLocation.DISCARD);

    const expectation = expectNow(CardLocation.DISCARD);
    clock.advanceTime();

    expect(expectation.isMet(card)).toBe(true);
  });

  it('is not met when the card is somewhere else', () => {
    const { card, expectNow } = setUp();
    card.setLocation(CardLocation.DISCARD);
    const expectation = expectNow(CardLocation.DISCARD);

    card.setLocation(CardLocation.TRASH);

    expect(expectation.isMet(card)).toBe(false);
  });

  it('is not met when the card has moved away and come back since', () => {
    const { card, expectNow } = setUp();
    card.setLocation(CardLocation.DECK);
    const expectation = expectNow(CardLocation.DECK);

    // e.g. drawn and then put back, or put onto the deck by Watchtower
    card.setLocation(CardLocation.HAND);
    card.setLocation(CardLocation.DECK);

    expect(expectation.isMet(card)).toBe(false);
  });

  it('is met by a card that arrives after the expectation was created', () => {
    const { card, expectNow } = setUp();
    card.setLocation(CardLocation.HAND);
    // e.g. Counterfeit expects the Treasure to be in play once it has played it
    const expectation = expectNow(CardLocation.IN_PLAY);

    card.setLocation(CardLocation.IN_PLAY);

    expect(expectation.isMet(card)).toBe(true);
  });

  it('is not met by a card that left the location before it arrived again after the expectation was created', () => {
    const { card, expectNow } = setUp();
    card.setLocation(CardLocation.HAND);
    const expectation = expectNow(CardLocation.IN_PLAY);

    card.setLocation(CardLocation.IN_PLAY);
    card.setLocation(CardLocation.PILE);
    card.setLocation(CardLocation.IN_PLAY);

    expect(expectation.isMet(card)).toBe(false);
  });

  it('is unaffected by moves between other locations', () => {
    const { card, expectNow } = setUp();
    card.setLocation(CardLocation.DISCARD);
    const discardExpectation = expectNow(CardLocation.DISCARD);
    const otherCard = new Card(
      { cost: vi.fn(), registerEffectTrigger: vi.fn(), ...createTestClock() } as unknown as SharedGameState,
      cardInfo,
    );

    otherCard.setLocation(CardLocation.HAND);
    otherCard.setLocation(CardLocation.DISCARD);

    expect(discardExpectation.isMet(card)).toBe(true);
  });

  it('is always met when there is no expectation', () => {
    const { card } = setUp();
    card.setLocation(CardLocation.TRASH);

    expect(new NoLocationExpectation().isMet(card)).toBe(true);
  });
});
