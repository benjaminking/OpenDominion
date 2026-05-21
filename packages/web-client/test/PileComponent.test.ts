import '@angular/compiler';
import { Injector, runInInjectionContext, signal } from '@angular/core';
import {
  CardLocation,
  CardSelectionPurpose,
  CardType,
  PileCategory,
  type CardMetadata,
  type PileMetadata,
} from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { DecisionManagerService } from '../src/app/decisions/decision-manager.service';
import { DecisionType } from '../src/app/decisions/DecisionType';
import { MessageDecoderService } from '../src/app/message-decoder.service';
import { PileComponent } from '../src/app/piles/pile.component';
import { GlobalSettingsService } from '../src/app/settings/global-settings.service';
import { setInputSignalValue } from './angular-test-utils';

function createCard(name: string, id: string, types: CardType[]): CardMetadata {
  return {
    name,
    id,
    location: CardLocation.PILE,
    types,
    cost: { coins: 4 },
  };
}

class FakeMessageDecoderService {
  pileMetadataCallback?: (content: PileMetadata) => void;

  subscribeToPileMetadata(callback: (content: PileMetadata) => void): void {
    this.pileMetadataCallback = callback;
  }
}

class FakeDecisionManagerService {
  readonly currentDecision = signal<any>(undefined);
  readonly resolveDecisionWithCard = vi.fn();
}

function createComponent() {
  const decoder = new FakeMessageDecoderService();
  const decisionManager = new FakeDecisionManagerService();
  const settingsService = new GlobalSettingsService();
  const injector = Injector.create({
    providers: [
      { provide: MessageDecoderService, useValue: decoder },
      { provide: DecisionManagerService, useValue: decisionManager },
      { provide: GlobalSettingsService, useValue: settingsService },
    ],
  });
  const component = runInInjectionContext(injector, () => new PileComponent());

  setInputSignalValue(component.name as () => string, 'Silver');
  setInputSignalValue(component.cost as () => { coins: number; has_asterisk?: boolean } | undefined, {
    coins: 3,
    has_asterisk: true,
  });
  setInputSignalValue(component.categories as () => PileCategory[], [PileCategory.SUPPLY, PileCategory.BASIC_TREASURE]);
  setInputSignalValue(component.types as () => CardType[], [CardType.TREASURE]);

  return { component, decoder, decisionManager, settingsService };
}

describe('PileComponent', () => {
  it('derives display metadata and reacts to matching pile updates', () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { component, decoder, settingsService } = createComponent();
    const updatedTopCard = createCard('Silver', 'silver-1', [CardType.TREASURE]);

    component.ngOnInit();
    decoder.pileMetadataCallback?.({
      name: 'Silver',
      size: 37,
      cost: { coins: 3 },
      topCard: updatedTopCard,
      types: [CardType.TREASURE],
      categories: [PileCategory.SUPPLY, PileCategory.BASIC_TREASURE],
    });

    expect(component.fileName()).toBe('silver');
    expect(component.isBasicPile()).toBe(true);
    expect(component.isSupply()).toBe(true);
    expect(component.isKingdom()).toBe(false);
    expect(component.isTreasure()).toBe(true);
    expect(component.isAction()).toBe(false);
    expect(component.isEmpty()).toBe(false);
    expect(component.count()).toBe(37);
    expect(component.topCard()).toEqual(updatedTopCard);
    expect(component.costSymbol()).toBe('3*');
    expect(component.cardAssetDirectory()).toBe('card_assets');

    settingsService.useOfficialArt();
    expect(component.cardAssetDirectory()).toBe('official_card_assets');

    consoleLogSpy.mockRestore();
  });

  it('ignores pile updates for other names and only selects eligible top cards', () => {
    const { component, decoder, decisionManager } = createComponent();
    const silver = createCard('Silver', 'silver-1', [CardType.TREASURE]);

    component.ngOnInit();
    component.count.set(10);
    component.topCard.set(silver);

    decoder.pileMetadataCallback?.({
      name: 'Gold',
      size: 30,
      cost: { coins: 6 },
      topCard: createCard('Gold', 'gold-1', [CardType.TREASURE]),
      types: [CardType.TREASURE],
      categories: [PileCategory.SUPPLY, PileCategory.BASIC_TREASURE],
    });

    expect(component.count()).toBe(10);
    expect(component.topCard()).toEqual(silver);
    expect(component.isSelectable()).toBe(false);

    decisionManager.currentDecision.set({
      type: DecisionType.BUY_PHASE_CHOICE,
      prompt: 'Buy a card',
      selectionType: CardSelectionPurpose.PLAY,
      eligibleCardIds: new Set(['silver-1']),
    });

    expect(component.isSelectable()).toBe(true);
    component.selectPile();
    expect(decisionManager.resolveDecisionWithCard).toHaveBeenCalledWith(silver);
  });

  it('reports empty and kingdom/action state for non-basic kingdom piles', () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { component } = createComponent();

    setInputSignalValue(component.name as () => string, 'Village');
    setInputSignalValue(component.categories as () => PileCategory[], [PileCategory.SUPPLY, PileCategory.KINGDOM]);
    setInputSignalValue(component.types as () => CardType[], [CardType.ACTION]);
    component.count.set(0);
    component.topCard.set(undefined);

    expect(component.isBasicPile()).toBe(false);
    expect(component.isKingdom()).toBe(true);
    expect(component.isAction()).toBe(true);
    expect(component.isEmpty()).toBe(true);
    expect(component.isSelectable()).toBe(false);
    expect(component.costSymbol()).toBe('3*');

    consoleLogSpy.mockRestore();
  });
});
