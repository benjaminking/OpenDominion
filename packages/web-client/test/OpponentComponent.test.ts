import '@angular/compiler';
import { runInInjectionContext } from '@angular/core';
import { CardLocation, CardType, NumberType, type CardMetadata } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { MessageDecoderService } from '../src/app/message-decoder.service';
import { OpponentComponent } from '../src/app/players/opponent.component';
import { createAngularTestInjector, setInputSignalValue } from './angular-test-utils';

function createCard(name: string, id: string): CardMetadata {
  return {
    name,
    id,
    location: CardLocation.DISCARD,
    types: [CardType.ACTION],
    cost: { coins: 4 },
  };
}

class FakeMessageDecoderService {
  private readonly cardCountCallbacks = new Map<string, (content: { count: number }) => void>();
  private readonly topCardCallbacks = new Map<string, (content: { topCard: CardMetadata | null }) => void>();
  private readonly statisticCallbacks = new Map<string, (content: { value: number }) => void>();

  subscribeToCardCountUpdate(
    key: { owner: string; location: CardLocation },
    callback: (content: { count: number }) => void,
  ): void {
    this.cardCountCallbacks.set(`${key.owner}:${key.location}`, callback);
  }

  subscribeToTopCardUpdate(
    key: { owner: string; location: CardLocation },
    callback: (content: { topCard: CardMetadata | null }) => void,
  ): void {
    this.topCardCallbacks.set(`${key.owner}:${key.location}`, callback);
  }

  subscribeToStatisticUpdate(
    key: { owner: string; type: NumberType },
    callback: (content: { value: number }) => void,
  ): void {
    this.statisticCallbacks.set(`${key.owner}:${key.type}`, callback);
  }

  emitCardCount(owner: string, location: CardLocation, count: number): void {
    this.cardCountCallbacks.get(`${owner}:${location}`)?.({ count });
  }

  emitTopCard(owner: string, location: CardLocation, topCard: CardMetadata | null): void {
    this.topCardCallbacks.get(`${owner}:${location}`)?.({ topCard });
  }

  emitStatistic(owner: string, type: NumberType, value: number): void {
    this.statisticCallbacks.get(`${owner}:${type}`)?.({ value });
  }
}

describe('OpponentComponent', () => {
  it('updates visible counts, discard card, and statistics for the named opponent', () => {
    const decoder = new FakeMessageDecoderService();
    const { injector, effectScheduler } = createAngularTestInjector([
      { provide: MessageDecoderService, useValue: decoder },
    ]);
    const component = runInInjectionContext(injector, () => new OpponentComponent());
    const silver = createCard('Silver', 'silver-1');

    setInputSignalValue(component.name as () => string, 'Bob');
    effectScheduler.flush();

    decoder.emitCardCount('Bob', CardLocation.HAND, 5);
    decoder.emitCardCount('Bob', CardLocation.DECK, 12);
    decoder.emitCardCount('Bob', CardLocation.SET_ASIDE, 1);
    decoder.emitCardCount('Bob', CardLocation.REVEAL_LIMBO, 2);
    decoder.emitTopCard('Bob', CardLocation.DISCARD, silver);
    decoder.emitStatistic('Bob', NumberType.ACTIONS, 3);
    decoder.emitStatistic('Bob', NumberType.BUYS, 2);
    decoder.emitStatistic('Bob', NumberType.COINS, 7);
    decoder.emitStatistic('Bob', NumberType.SCORE, 18);

    expect(component.handSize()).toBe(5);
    expect(component.deckSize()).toBe(12);
    expect(component.setAsideSize()).toBe(1);
    expect(component.limboSize()).toBe(2);
    expect(component.topDiscard()).toEqual(silver);
    expect(component.actions()).toBe(3);
    expect(component.buys()).toBe(2);
    expect(component.coins()).toBe(7);
    expect(component.score()).toBe(18);
  });
});
