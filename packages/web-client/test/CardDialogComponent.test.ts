import '@angular/compiler';
import { Injector, runInInjectionContext, signal, type Signal, type WritableSignal } from '@angular/core';
import { CardLocation, CardType, type CardMetadata } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { CardDialogComponent } from '../src/app/cards/card-dialog.component';
import { ViewVisibilityService } from '../src/app/view-visibility.service';
import { ViewName } from '../src/app/view-names';
import { setInputSignalValue } from './angular-test-utils';

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
  it('uses ViewVisibilityService to expose and toggle dialog visibility', () => {
    const viewVisibilityService = new FakeViewVisibilityService();
    const injector = Injector.create({
      providers: [{ provide: ViewVisibilityService, useValue: viewVisibilityService }],
    });
    const component = runInInjectionContext(injector, () => new CardDialogComponent());

    setInputSignalValue(component.title as () => string, 'Trash');
    setInputSignalValue(component.name as () => ViewName, ViewName.TRASH);
    setInputSignalValue(component.cards as () => CardMetadata[], [createCard('Copper', 'copper-1')]);
    setInputSignalValue(component.grouped as () => boolean, true);
    setInputSignalValue(component.sorted as () => boolean, true);
    setInputSignalValue(component.staggered as () => boolean, false);

    expect(component.title()).toBe('Trash');
    expect(component.cards().map((card) => card.name)).toEqual(['Copper']);
    expect(component.visible()).toBe(false);

    viewVisibilityService.toggleViewByName(ViewName.TRASH);
    expect(component.visible()).toBe(true);

    expect(component.grouped()).toBe(true);
    expect(component.sorted()).toBe(true);
    expect(component.staggered()).toBe(false);

    component.close();

    expect(component.visible()).toBe(false);
  });
});
