import '@angular/compiler';
import { Injector, runInInjectionContext } from '@angular/core';
import { CardLocation, CardType, type CardMetadata } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { CardComponent } from '../src/app/cards/card.component';
import { GlobalSettingsService } from '../src/app/settings/global-settings.service';
import { setInputSignalValue } from './angular-test-utils';

function createCard(name: string, id: string, types: CardType[]): CardMetadata {
  return {
    name,
    id,
    location: CardLocation.HAND,
    types,
    cost: { coins: 4 },
  };
}

describe('CardComponent', () => {
  it('uses full-layout metadata, card info, and art settings for basic treasure cards', () => {
    const settingsService = new GlobalSettingsService();
    const injector = Injector.create({
      providers: [{ provide: GlobalSettingsService, useValue: settingsService }],
    });
    const component = runInInjectionContext(injector, () => new CardComponent());

    setInputSignalValue(
      component.metadata as () => CardMetadata,
      createCard('Copper', 'copper-1', [CardType.TREASURE]),
    );

    expect(component.fileName()).toBe('copper');
    expect(component.layoutType()).toBe(component.LayoutType.PORTRAIT_FULL);
    expect(component.overlayType()).toBe(component.OverlayType.TREASURE);
    expect(component.coinCostSymbol()).toBe('0');
    expect(component.productionSymbol()).toBe('1');
    expect(component.cardAssetDirectory()).toBe('card_assets');

    settingsService.useOfficialArt();
    expect(component.cardAssetDirectory()).toBe('official_card_assets');
  });

  it('sorts type labels and computes size buckets from the number of types', () => {
    const injector = Injector.create({
      providers: [{ provide: GlobalSettingsService, useValue: new GlobalSettingsService() }],
    });
    const component = runInInjectionContext(injector, () => new CardComponent());

    setInputSignalValue(
      component.metadata as () => CardMetadata,
      createCard('Harem', 'harem-1', [CardType.VICTORY, CardType.TREASURE, CardType.REACTION]),
    );

    expect(component.typesStr()).toBe('Victory - Treasure - Reaction');
    expect(component.typesSize()).toBe('medium');

    setInputSignalValue(
      component.metadata as () => CardMetadata,
      createCard('Test Card', 'test-1', [CardType.VICTORY, CardType.TREASURE, CardType.REACTION, CardType.DURATION]),
    );

    expect(component.typesSize()).toBe('small');
  });

  it('derives overlay and symbol variants for variable-production and asterisk-cost cards', () => {
    const injector = Injector.create({
      providers: [{ provide: GlobalSettingsService, useValue: new GlobalSettingsService() }],
    });
    const component = runInInjectionContext(injector, () => new CardComponent());

    setInputSignalValue(
      component.metadata as () => CardMetadata,
      createCard('Investment', 'investment-1', [CardType.ACTION, CardType.REACTION]),
    );
    expect(component.layoutType()).toBe(component.LayoutType.PORTRAIT);
    expect(component.overlayType()).toBe(component.OverlayType.REACTION);
    expect(component.productionSymbol()).toBe('?');

    setInputSignalValue(component.metadata as () => CardMetadata, createCard('Hoard', 'hoard-1', [CardType.TREASURE]));
    expect(component.coinCostSymbol()).toBe('6*');

    setInputSignalValue(component.metadata as () => CardMetadata, createCard('Duchy', 'duchy-1', [CardType.VICTORY]));
    expect(component.overlayType()).toBe(component.OverlayType.VICTORY);

    setInputSignalValue(
      component.metadata as () => CardMetadata,
      createCard('Harem', 'harem-2', [CardType.TREASURE, CardType.VICTORY]),
    );
    expect(component.overlayType()).toBe(component.OverlayType.TREASURE_VICTORY);

    setInputSignalValue(
      component.metadata as () => CardMetadata,
      createCard('Caravan', 'caravan-1', [CardType.ACTION, CardType.DURATION]),
    );
    expect(component.overlayType()).toBe(component.OverlayType.DURATION);

    setInputSignalValue(
      component.metadata as () => CardMetadata,
      createCard('Wealthy Village', 'wealthy-village-1', [CardType.TREASURE, CardType.DURATION]),
    );
    expect(component.overlayType()).toBe(component.OverlayType.TREASURE_DURATION);

    setInputSignalValue(
      component.metadata as () => CardMetadata,
      createCard('Watchtower', 'watchtower-1', [CardType.ACTION, CardType.DURATION, CardType.REACTION]),
    );
    expect(component.overlayType()).toBe(component.OverlayType.DURATION_REACTION);

    setInputSignalValue(component.metadata as () => CardMetadata, createCard('Curse', 'curse-1', [CardType.CURSE]));
    expect(component.overlayType()).toBe(component.OverlayType.CURSE);
  });
});
