import '@angular/compiler';
import { Injector, runInInjectionContext } from '@angular/core';
import { CardLocation, CardType, type CardMetadata } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { CardDisplayComponent } from '../src/app/cards/card-display.component';
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

describe('CardDisplayComponent', () => {
  it('groups duplicate names when grouped mode is enabled', () => {
    const injector = Injector.create({ providers: [] });
    const component = runInInjectionContext(injector, () => new CardDisplayComponent());
    const copperA = createCard('Copper', 'copper-1', [CardType.TREASURE]);
    const copperB = createCard('Copper', 'copper-2', [CardType.TREASURE]);
    const village = createCard('Village', 'village-1', [CardType.ACTION]);

    setInputSignalValue(component.cards as () => CardMetadata[], [copperA, village, copperB]);
    setInputSignalValue(component.grouped as () => boolean, true);
    setInputSignalValue(component.sorted as () => boolean, false);

    const groups = component.cardGroups();

    expect(groups).toHaveLength(2);
    expect(groups.find((group) => group.name === 'Copper')?.numCards).toBe(2);
    expect(groups.find((group) => group.name === 'Village')?.numCards).toBe(1);
  });

  it('keeps single-card groups and sorts when grouped mode is disabled', () => {
    const injector = Injector.create({ providers: [] });
    const component = runInInjectionContext(injector, () => new CardDisplayComponent());
    const estate = createCard('Estate', 'estate-1', [CardType.VICTORY]);
    const silver = createCard('Silver', 'silver-1', [CardType.TREASURE]);

    setInputSignalValue(component.cards as () => CardMetadata[], [estate, silver]);
    setInputSignalValue(component.grouped as () => boolean, false);
    setInputSignalValue(component.sorted as () => boolean, true);

    const groups = component.cardGroups();

    expect(groups).toHaveLength(2);
    expect(groups[0].numCards).toBe(1);
    expect(groups[1].numCards).toBe(1);
    expect(groups.map((group) => group.name)).toEqual(['Silver', 'Estate']);
  });
});
