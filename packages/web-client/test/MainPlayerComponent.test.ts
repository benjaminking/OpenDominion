import '@angular/compiler';
import { runInInjectionContext, signal, type Signal, type WritableSignal } from '@angular/core';
import { CardLocation, CardType, NumberType, type CardMetadata } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { MessageDecoderService } from '../src/app/message-decoder.service';
import { MainPlayerComponent } from '../src/app/players/main-player.component';
import { ViewVisibilityService } from '../src/app/view-visibility.service';
import { ViewName } from '../src/app/view-names';
import { createAngularTestInjector, setInputSignalValue } from './angular-test-utils';

class FakeViewVisibilityService {
  private readonly visibilityByViewName: Record<ViewName, WritableSignal<boolean>> = {
    [ViewName.REVEALED_LIMBO]: signal(false),
    [ViewName.SET_ASIDE]: signal(false),
    [ViewName.TRASH]: signal(false),
    [ViewName.DISCARD]: signal(false),
  };

  getViewVisibilitySignal(viewName: ViewName): Signal<boolean> {
    return this.visibilityByViewName[viewName];
  }

  toggleViewByName(viewName: ViewName): void {
    this.visibilityByViewName[viewName].set(!this.visibilityByViewName[viewName]());
  }
}

function createCard(name: string, id: string, location: CardLocation): CardMetadata {
  return {
    name,
    id,
    location,
    types: [CardType.ACTION],
    cost: { coins: 5 },
  };
}

class FakeMessageDecoderService {
  private readonly cardCountCallbacks = new Map<string, (content: { count: number }) => void>();
  private readonly topCardCallbacks = new Map<string, (content: { topCard: CardMetadata | undefined }) => void>();
  private readonly cardsCallbacks = new Map<string, (content: { cards: CardMetadata[] }) => void>();
  private readonly statisticCallbacks = new Map<string, (content: { value: number }) => void>();

  subscribeToCardCountUpdate(
    key: { owner: string; location: CardLocation },
    callback: (content: { count: number }) => void,
  ): void {
    this.cardCountCallbacks.set(`${key.owner}:${key.location}`, callback);
  }

  subscribeToTopCardUpdate(
    key: { owner: string; location: CardLocation },
    callback: (content: { topCard: CardMetadata | undefined }) => void,
  ): void {
    this.topCardCallbacks.set(`${key.owner}:${key.location}`, callback);
  }

  subscribeToCardsUpdate(
    key: { owner: string; location: CardLocation },
    callback: (content: { cards: CardMetadata[] }) => void,
  ): void {
    this.cardsCallbacks.set(`${key.owner}:${key.location}`, callback);
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

  emitTopCard(owner: string, location: CardLocation, topCard: CardMetadata | undefined): void {
    this.topCardCallbacks.get(`${owner}:${location}`)?.({ topCard });
  }

  emitCards(owner: string, location: CardLocation, cards: CardMetadata[]): void {
    this.cardsCallbacks.get(`${owner}:${location}`)?.({ cards });
  }

  emitStatistic(owner: string, type: NumberType, value: number): void {
    this.statisticCallbacks.get(`${owner}:${type}`)?.({ value });
  }
}

describe('MainPlayerComponent', () => {
  it('updates card zones and statistics for the named main player', () => {
    const decoder = new FakeMessageDecoderService();
    const viewVisibilityService = new FakeViewVisibilityService();
    const { injector, effectScheduler } = createAngularTestInjector([
      { provide: MessageDecoderService, useValue: decoder },
      { provide: ViewVisibilityService, useValue: viewVisibilityService },
    ]);
    const component = runInInjectionContext(injector, () => new MainPlayerComponent());
    const duchy = createCard('Duchy', 'duchy-1', CardLocation.DISCARD);
    const horse = createCard('Horse', 'horse-1', CardLocation.SET_ASIDE);
    const imp = createCard('Imp', 'imp-1', CardLocation.REVEAL_LIMBO);

    setInputSignalValue(component.name as () => string, 'Alice');
    effectScheduler.flush();

    decoder.emitCardCount('Alice', CardLocation.DECK, 17);
    decoder.emitTopCard('Alice', CardLocation.DISCARD, duchy);
    decoder.emitCards('Alice', CardLocation.SET_ASIDE, [horse]);
    decoder.emitCards('Alice', CardLocation.REVEAL_LIMBO, [imp]);
    decoder.emitStatistic('Alice', NumberType.ACTIONS, 2);
    decoder.emitStatistic('Alice', NumberType.BUYS, 1);
    decoder.emitStatistic('Alice', NumberType.COINS, 6);
    decoder.emitStatistic('Alice', NumberType.SCORE, 24);

    expect(component.deckSize()).toBe(17);
    expect(component.topDiscard()).toEqual(duchy);
    expect(component.setAside()).toEqual([horse]);
    expect(component.limbo()).toEqual([imp]);
    expect(component.actions()).toBe(2);
    expect(component.buys()).toBe(1);
    expect(component.coins()).toBe(6);
    expect(component.score()).toBe(24);
  });
});
