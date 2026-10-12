import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { Card } from '../../src/card/Card';
import { CardCollection } from '../../src/card/CardCollection';
import { EffectContext, EffectContextBuilder } from '../../src/effects/EffectContext';

const createCard = (id: string): Card => ({ getId: () => id }) as unknown as Card;

describe('EffectContext', () => {
  it('has no target cards or gain location when empty', () => {
    const effectContext = new EffectContextBuilder().build();

    expect(effectContext.getTargetCard()).toBeUndefined();
    expect(effectContext.getTargetCards()).toBeUndefined();
    expect(effectContext.getGainLocation()).toBeUndefined();
  });

  it('holds a single target card', () => {
    const card = createCard('card-0');

    const effectContext = new EffectContextBuilder().withTargetCard(card).build();

    expect(effectContext.getTargetCard()).toBe(card);
    expect(effectContext.getTargetCards()?.asCardArray()).toEqual([card]);
    expect(effectContext.getGainLocation()).toBeUndefined();
  });

  it('holds several target cards', () => {
    const cards = CardCollection.fromCards([createCard('card-0'), createCard('card-1')]);

    const effectContext = new EffectContextBuilder().withTargetCards(cards).build();

    expect(effectContext.getTargetCards()).toBe(cards);
    expect(effectContext.getGainLocation()).toBeUndefined();
  });

  it('holds a gained card and where it was gained', () => {
    const card = createCard('card-0');

    const effectContext = new EffectContextBuilder().withTargetCard(card).withGainLocation(CardLocation.DECK).build();

    expect(effectContext.getTargetCard()).toBe(card);
    expect(effectContext.getGainLocation()).toBe(CardLocation.DECK);
  });
});
