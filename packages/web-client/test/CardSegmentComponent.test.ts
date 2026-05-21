import '@angular/compiler';
import { Injector, runInInjectionContext } from '@angular/core';
import { CardLocation, CardType, type CardMetadata } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { CardSegmentComponent } from '../src/app/message/card-segment.component';
import { setInputSignalValue } from './angular-test-utils';

function createCard(name: string, id: string, types: CardType[]): CardMetadata {
  return {
    name,
    id,
    location: CardLocation.HAND,
    types,
    cost: { coins: 3 },
  };
}

describe('CardSegmentComponent', () => {
  it('derives style flags from the card type list', () => {
    const injector = Injector.create({ providers: [] });
    const component = runInInjectionContext(injector, () => new CardSegmentComponent());

    setInputSignalValue(component.text as () => string, 'Village');
    setInputSignalValue(
      component.card as () => CardMetadata,
      createCard('Village', 'village-1', [CardType.ACTION, CardType.DURATION, CardType.REACTION]),
    );

    expect(component.isAction()).toBe(true);
    expect(component.isDuration()).toBe(true);
    expect(component.isReaction()).toBe(true);
    expect(component.isTreasure()).toBe(false);
    expect(component.isVictory()).toBe(false);
    expect(component.isCurse()).toBe(false);

    setInputSignalValue(component.card as () => CardMetadata, createCard('Curse', 'curse-1', [CardType.CURSE]));

    expect(component.isCurse()).toBe(true);
    expect(component.isAction()).toBe(false);
    expect(component.isDuration()).toBe(false);
    expect(component.isReaction()).toBe(false);
  });
});
