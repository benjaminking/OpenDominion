import '@angular/compiler';
import { Injector, runInInjectionContext } from '@angular/core';
import { CardLocation, CardType, type CardMetadata } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { CardComponent } from '../src/app/cards/card.component';
import { GlobalSettingsService } from '../src/app/settings/global-settings.service';
import { setInputSignalValue } from './angular-test-utils';

function createCard(name: string, id: string, types: CardType[], coins = 4): CardMetadata {
  return {
    name,
    displayName: name,
    id,
    location: CardLocation.HAND,
    types,
    cost: { coins },
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
      createCard('Copper', 'copper-1', [CardType.TREASURE], 0),
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

    setInputSignalValue(
      component.metadata as () => CardMetadata,
      createCard('Hoard', 'hoard-1', [CardType.TREASURE], 6),
    );
    expect(component.coinCostSymbol()).toBe('6');

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

  it('reports a potion cost only when the card metadata cost includes potions', () => {
    const injector = Injector.create({
      providers: [{ provide: GlobalSettingsService, useValue: new GlobalSettingsService() }],
    });
    const component = runInInjectionContext(injector, () => new CardComponent());

    setInputSignalValue(component.metadata as () => CardMetadata, {
      ...createCard('Vineyard', 'vineyard-1', [CardType.VICTORY]),
      cost: { coins: 0, potions: 1 },
    });
    expect(component.hasPotionCost()).toBe(true);
    expect(component.coinCostSymbol()).toBe('0');

    setInputSignalValue(component.metadata as () => CardMetadata, {
      ...createCard('Familiar', 'familiar-1', [CardType.ACTION, CardType.ATTACK]),
      cost: { coins: 3, potions: 1 },
    });
    expect(component.hasPotionCost()).toBe(true);
    expect(component.coinCostSymbol()).toBe('3');

    setInputSignalValue(component.metadata as () => CardMetadata, {
      ...createCard('Village', 'village-1', [CardType.ACTION]),
      cost: { coins: 3, potions: 0 },
    });
    expect(component.hasPotionCost()).toBe(false);

    setInputSignalValue(
      component.metadata as () => CardMetadata,
      createCard('Smithy', 'smithy-1', [CardType.ACTION], 4),
    );
    expect(component.hasPotionCost()).toBe(false);
  });

  it('reports potion production from card info, with a zero coin production symbol for Potion', () => {
    const injector = Injector.create({
      providers: [{ provide: GlobalSettingsService, useValue: new GlobalSettingsService() }],
    });
    const component = runInInjectionContext(injector, () => new CardComponent());

    setInputSignalValue(
      component.metadata as () => CardMetadata,
      createCard('Potion', 'potion-1', [CardType.TREASURE], 4),
    );
    expect(component.hasPotionProduction()).toBe(true);
    expect(component.productionSymbol()).toBe('0');
    expect(component.layoutType()).toBe(component.LayoutType.PORTRAIT_FULL);

    setInputSignalValue(
      component.metadata as () => CardMetadata,
      createCard('Silver', 'silver-1', [CardType.TREASURE], 3),
    );
    expect(component.hasPotionProduction()).toBe(false);
    expect(component.productionSymbol()).toBe('2');

    setInputSignalValue(
      component.metadata as () => CardMetadata,
      createCard('Village', 'village-1', [CardType.ACTION]),
    );
    expect(component.hasPotionProduction()).toBe(false);
  });
});
