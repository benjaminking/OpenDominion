import '@angular/compiler';
import { Injector, runInInjectionContext } from '@angular/core';
import { CardLocation, CardType, type CardMetadata } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { MessageDecoderService } from '../src/app/message-decoder.service';
import { SharedComponent } from '../src/app/shared/shared.component';

function createCard(name: string, id: string): CardMetadata {
  return {
    name,
    id,
    location: CardLocation.TRASH,
    types: [CardType.ACTION],
    cost: { coins: 2 },
  };
}

class FakeMessageDecoderService {
  sharedCardsCallback?: (content: { cards: CardMetadata[] }) => void;

  subscribeToSharedCardsUpdate(
    _key: { location: CardLocation },
    callback: (sharedCardsContent: { cards: CardMetadata[] }) => void,
  ): void {
    this.sharedCardsCallback = callback;
  }
}

describe('SharedComponent', () => {
  it('subscribes to trash updates and toggles trash visibility', () => {
    const decoder = new FakeMessageDecoderService();
    const injector = Injector.create({
      providers: [{ provide: MessageDecoderService, useValue: decoder }],
    });
    const component = runInInjectionContext(injector, () => new SharedComponent());
    const copper = createCard('Copper', 'copper-1');
    const silver = createCard('Silver', 'silver-1');

    component.ngOnInit();
    decoder.sharedCardsCallback?.({ cards: [copper, silver] });

    expect(component.trash()).toEqual([copper, silver]);
    expect(component.isTrashVisible).toBe(false);

    component.toggleTrashVisibility();
    expect(component.isTrashVisible).toBe(true);

    component.toggleTrashVisibility();
    expect(component.isTrashVisible).toBe(false);
  });
});
