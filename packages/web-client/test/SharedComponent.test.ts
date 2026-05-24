import '@angular/compiler';
import { Injector, runInInjectionContext, signal, type Signal, type WritableSignal } from '@angular/core';
import { CardLocation, CardType, type CardMetadata } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { MessageDecoderService } from '../src/app/message-decoder.service';
import { SharedComponent } from '../src/app/shared/shared.component';
import { ViewVisibilityService } from '../src/app/view-visibility.service';
import { ViewName } from '../src/app/view-names';

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

describe('SharedComponent', () => {
  it('subscribes to trash updates and toggles trash visibility', () => {
    const decoder = new FakeMessageDecoderService();
    const viewVisibilityService = new FakeViewVisibilityService();
    const injector = Injector.create({
      providers: [
        { provide: MessageDecoderService, useValue: decoder },
        { provide: ViewVisibilityService, useValue: viewVisibilityService },
      ],
    });
    const component = runInInjectionContext(injector, () => new SharedComponent());
    const copper = createCard('Copper', 'copper-1');
    const silver = createCard('Silver', 'silver-1');

    component.ngOnInit();
    decoder.sharedCardsCallback?.({ cards: [copper, silver] });

    expect(component.trash()).toEqual([copper, silver]);
    expect(component.trashViewName).toBe(ViewName.TRASH);
    expect(viewVisibilityService.getViewVisibilitySignal(ViewName.TRASH)()).toBe(false);

    component.toggleTrashVisibility();
    expect(viewVisibilityService.getViewVisibilitySignal(ViewName.TRASH)()).toBe(true);

    component.toggleTrashVisibility();
    expect(viewVisibilityService.getViewVisibilitySignal(ViewName.TRASH)()).toBe(false);
  });
});
