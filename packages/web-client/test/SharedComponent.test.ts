import '@angular/compiler';
import { Injector, runInInjectionContext, signal, type Signal, type WritableSignal } from '@angular/core';
import { CardLocation, CardType, type CardMetadata } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { MessageDecoderService } from '../src/app/message-decoder.service';
import { MiscellaneousCardDialogService } from '../src/app/shared/miscellaneous-card-dialog.service';
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
    [ViewName.MISCELLANEOUS]: signal(false),
  };

  getViewVisibilitySignal(viewName: ViewName): Signal<boolean> {
    return this.visibilityByViewName[viewName];
  }

  toggleViewByName(viewName: ViewName): void {
    this.visibilityByViewName[viewName].set(!this.visibilityByViewName[viewName]());
  }
}

function createComponent() {
  const decoder = new FakeMessageDecoderService();
  const viewVisibilityService = new FakeViewVisibilityService();
  const miscellaneousCardDialogService = new MiscellaneousCardDialogService();
  const injector = Injector.create({
    providers: [
      { provide: MessageDecoderService, useValue: decoder },
      { provide: ViewVisibilityService, useValue: viewVisibilityService },
      { provide: MiscellaneousCardDialogService, useValue: miscellaneousCardDialogService },
    ],
  });
  const component = runInInjectionContext(injector, () => new SharedComponent());

  return { component, decoder, viewVisibilityService, miscellaneousCardDialogService };
}

describe('SharedComponent', () => {
  it('subscribes to trash updates and toggles trash visibility', () => {
    const { component, decoder, viewVisibilityService } = createComponent();
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

  it('exposes the miscellaneous dialog cards and view name without affecting trash visibility', () => {
    const { component, viewVisibilityService, miscellaneousCardDialogService } = createComponent();
    const coronet = { ...createCard('Coronet', 'coronet-1'), location: CardLocation.PILE };
    const renown = { ...createCard('Renown', 'renown-1'), location: CardLocation.PILE };

    expect(component.miscellaneousViewName).toBe(ViewName.MISCELLANEOUS);
    expect(component.miscellaneousCards()).toEqual([]);

    miscellaneousCardDialogService.setCards([coronet, renown]);
    expect(component.miscellaneousCards()).toEqual([coronet, renown]);

    miscellaneousCardDialogService.setCards([renown]);
    expect(component.miscellaneousCards()).toEqual([renown]);

    component.toggleTrashVisibility();
    expect(viewVisibilityService.getViewVisibilitySignal(ViewName.TRASH)()).toBe(true);
    expect(viewVisibilityService.getViewVisibilitySignal(ViewName.MISCELLANEOUS)()).toBe(false);
  });
});
