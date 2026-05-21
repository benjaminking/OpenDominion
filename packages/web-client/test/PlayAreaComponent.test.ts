import '@angular/compiler';
import { runInInjectionContext } from '@angular/core';
import { CardLocation, CardType, type CardMetadata } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { MessageDecoderService } from '../src/app/message-decoder.service';
import { PlayAreaComponent } from '../src/app/shared/play-area.component';
import { createAngularTestInjector, setInputSignalValue } from './angular-test-utils';

function createCard(name: string, id: string): CardMetadata {
  return {
    name,
    id,
    location: CardLocation.IN_PLAY,
    types: [CardType.ACTION],
    cost: { coins: 4 },
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

describe('PlayAreaComponent', () => {
  it('tracks in-play cards separately for each named player', () => {
    const decoder = new FakeMessageDecoderService();
    const { injector, effectScheduler } = createAngularTestInjector([
      { provide: MessageDecoderService, useValue: decoder },
    ]);
    const component = runInInjectionContext(injector, () => new PlayAreaComponent());
    const village = createCard('Village', 'village-1');
    const smithy = createCard('Smithy', 'smithy-1');

    setInputSignalValue(component.playerNames as () => string[], ['Alice', 'Bob']);
    setInputSignalValue(component.currentPlayerName as () => string, 'Bob');
    effectScheduler.flush();

    decoder.emitCards('Alice', CardLocation.IN_PLAY, [village]);
    decoder.emitCards('Bob', CardLocation.IN_PLAY, [smithy]);

    expect(component.playerInPlays().get('Alice')?.()).toEqual([village]);
    expect(component.playerInPlays().get('Bob')?.()).toEqual([smithy]);
    expect(component.playerInPlays().size).toBe(2);
  });
});
