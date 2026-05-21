import '@angular/compiler';
import { runInInjectionContext } from '@angular/core';
import { CardLocation, CardType, type CardMetadata } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { MessageDecoderService } from '../src/app/message-decoder.service';
import { HandComponent } from '../src/app/players/hand.component';
import { createAngularTestInjector, setInputSignalValue } from './angular-test-utils';

function createCard(name: string, id: string): CardMetadata {
  return {
    name,
    id,
    location: CardLocation.HAND,
    types: [CardType.ACTION],
    cost: { coins: 3 },
  };
}

class FakeMessageDecoderService {
  private readonly cardsCallbacks = new Map<string, (content: { cards: CardMetadata[] }) => void>();

  subscribeToCardsUpdate(
    key: { owner: string; location: CardLocation },
    callback: (content: { cards: CardMetadata[] }) => void,
  ): void {
    this.cardsCallbacks.set(`${key.owner}:${key.location}`, callback);
  }

  emitCards(owner: string, location: CardLocation, cards: CardMetadata[]): void {
    this.cardsCallbacks.get(`${owner}:${location}`)?.({ cards });
  }
}

describe('HandComponent', () => {
  it('subscribes to the named player hand and updates cards from incoming messages', () => {
    const decoder = new FakeMessageDecoderService();
    const { injector, effectScheduler } = createAngularTestInjector([
      { provide: MessageDecoderService, useValue: decoder },
    ]);
    const component = runInInjectionContext(injector, () => new HandComponent());
    const copper = createCard('Copper', 'copper-1');
    const silver = createCard('Silver', 'silver-1');

    setInputSignalValue(component.name as () => string, 'Alice');
    effectScheduler.flush();
    decoder.emitCards('Alice', CardLocation.HAND, [copper, silver]);

    expect(component.hand()).toEqual([copper, silver]);
  });
});
