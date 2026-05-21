import '@angular/compiler';
import { Injector, runInInjectionContext, signal } from '@angular/core';
import { CardLocation, CardType, type CardMetadata } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { CardDialogComponent } from '../src/app/cards/card-dialog.component';
import { setInputSignalValue } from './angular-test-utils';

function createCard(name: string, id: string): CardMetadata {
  return {
    name,
    id,
    location: CardLocation.TRASH,
    types: [CardType.ACTION],
    cost: { coins: 2 },
  };
}

describe('CardDialogComponent', () => {
  it('holds provided dialog state and closes by setting visibility false', () => {
    const injector = Injector.create({ providers: [] });
    const component = runInInjectionContext(injector, () => new CardDialogComponent());
    const visible = signal(true);

    setInputSignalValue(component.title as () => string, 'Trash');
    setInputSignalValue(component.cards as () => CardMetadata[], [createCard('Copper', 'copper-1')]);
    component.visible = visible;
    setInputSignalValue(component.grouped as () => boolean, true);
    setInputSignalValue(component.sorted as () => boolean, true);
    setInputSignalValue(component.staggered as () => boolean, false);

    expect(component.title()).toBe('Trash');
    expect(component.cards().map((card) => card.name)).toEqual(['Copper']);
    expect(component.visible()).toBe(true);
    expect(component.grouped()).toBe(true);
    expect(component.sorted()).toBe(true);
    expect(component.staggered()).toBe(false);

    component.close();

    expect(component.visible()).toBe(false);
  });
});
