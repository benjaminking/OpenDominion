import '@angular/compiler';
import { Injector, runInInjectionContext } from '@angular/core';
import { CardLocation, CardType, PileCategory, type CardMetadata, type PileMetadata } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { MessageDecoderService } from '../src/app/message-decoder.service';
import { PilesComponent } from '../src/app/piles/piles.component';

function createTopCard(name: string, id: string): CardMetadata {
  return {
    name,
    displayName: name,
    id,
    location: CardLocation.PILE,
    types: [CardType.ACTION],
    cost: { coins: 3 },
  };
}

function createPile(name: string, coins: number, categories: PileCategory[]): PileMetadata {
  return {
    name,
    size: 10,
    originalCost: { coins },
    topCard: createTopCard(name, `${name.toLowerCase()}-1`),
    types: [CardType.ACTION],
    categories,
  };
}

class FakeMessageDecoderService {
  pileMetadataCallback?: (pileMetadata: PileMetadata) => void;

  subscribeToPileMetadata(callback: (pileMetadata: PileMetadata) => void): void {
    this.pileMetadataCallback = callback;
  }
}

function createComponent() {
  const decoder = new FakeMessageDecoderService();
  const injector = Injector.create({
    providers: [{ provide: MessageDecoderService, useValue: decoder }],
  });
  const component = runInInjectionContext(injector, () => new PilesComponent());

  return { component, decoder };
}

function groupNames(component: PilesComponent) {
  return {
    kingdom: component.kingdomPiles().map((pile) => pile.name),
    treasure: component.treasurePiles().map((pile) => pile.name),
    victory: component.victoryPiles().map((pile) => pile.name),
    nonKingdomSupply: component.nonKingdomSupplyPiles().map((pile) => pile.name),
    nonSupply: component.nonSupplyPiles().map((pile) => pile.name),
  };
}

describe('PilesComponent', () => {
  it('groups incoming piles by category, sorts them, and ignores duplicate names', () => {
    const { component, decoder } = createComponent();
    const village = createPile('Village', 3, [PileCategory.KINGDOM]);
    const market = createPile('Market', 5, [PileCategory.KINGDOM]);
    const silver = createPile('Silver', 3, [PileCategory.BASIC_TREASURE]);
    const duchy = createPile('Duchy', 5, [PileCategory.BASIC_VICTORY]);
    const horseTraders = createPile('Horse Traders', 4, [PileCategory.NON_SUPPLY, PileCategory.KINGDOM]);

    component.ngOnInit();
    decoder.pileMetadataCallback?.(village);
    decoder.pileMetadataCallback?.(market);
    decoder.pileMetadataCallback?.(silver);
    decoder.pileMetadataCallback?.(duchy);
    decoder.pileMetadataCallback?.(horseTraders);
    decoder.pileMetadataCallback?.(createPile('Village', 6, [PileCategory.KINGDOM]));

    expect(component.kingdomPiles().map((pile) => pile.name)).toEqual(['Village', 'Market', 'Horse Traders']);
    expect(component.treasurePiles().map((pile) => pile.name)).toEqual(['Silver']);
    expect(component.victoryPiles().map((pile) => pile.name)).toEqual(['Duchy']);
    // Each pile is placed in exactly one group, and the Kingdom category takes precedence over Non-supply.
    expect(component.nonSupplyPiles().map((pile) => pile.name)).toEqual([]);
    expect(component.nonKingdomSupplyPiles().map((pile) => pile.name)).toEqual([]);
    expect([...component.seenPileNames]).toEqual(['Village', 'Market', 'Silver', 'Duchy', 'Horse Traders']);
  });

  it('routes Supply-only piles to the non-kingdom supply group and Non-supply piles to the non-supply group', () => {
    const { component, decoder } = createComponent();

    component.ngOnInit();
    decoder.pileMetadataCallback?.(createPile('Ruins', 0, [PileCategory.SUPPLY]));
    decoder.pileMetadataCallback?.(createPile('Rewards', 0, [PileCategory.NON_SUPPLY]));
    decoder.pileMetadataCallback?.(createPile('Spoils', 0, [PileCategory.NON_SUPPLY]));
    decoder.pileMetadataCallback?.(createPile('Madman', 0, [PileCategory.NON_SUPPLY]));
    decoder.pileMetadataCallback?.(createPile('Horse', 3, [PileCategory.NON_SUPPLY]));
    decoder.pileMetadataCallback?.(createPile('Knights', 5, [PileCategory.SUPPLY, PileCategory.KINGDOM]));

    expect(groupNames(component)).toEqual({
      kingdom: ['Knights'],
      treasure: [],
      victory: [],
      nonKingdomSupply: ['Ruins'],
      nonSupply: ['Horse', 'Madman', 'Rewards', 'Spoils'],
    });
  });

  it('places each pile in a single group, preferring basic treasure, then basic victory, then kingdom', () => {
    const { component, decoder } = createComponent();

    component.ngOnInit();
    decoder.pileMetadataCallback?.(
      createPile('Potion', 4, [PileCategory.SUPPLY, PileCategory.BASIC_TREASURE, PileCategory.KINGDOM]),
    );
    decoder.pileMetadataCallback?.(
      createPile('Colony', 11, [PileCategory.SUPPLY, PileCategory.BASIC_VICTORY, PileCategory.KINGDOM]),
    );
    decoder.pileMetadataCallback?.(createPile('Market', 5, [PileCategory.SUPPLY, PileCategory.KINGDOM]));
    decoder.pileMetadataCallback?.(createPile('Uncategorized', 2, []));

    expect(groupNames(component)).toEqual({
      kingdom: ['Market'],
      treasure: ['Potion'],
      victory: ['Colony'],
      nonKingdomSupply: [],
      nonSupply: [],
    });
    expect(component.seenPileNames.has('Uncategorized')).toBe(true);
  });

  it('replaces an already-seen non-supply pile in place when its metadata is updated', () => {
    const { component, decoder } = createComponent();
    const updatedRewards = { ...createPile('Rewards', 0, [PileCategory.NON_SUPPLY]), size: 11 };

    component.ngOnInit();
    decoder.pileMetadataCallback?.(createPile('Rewards', 0, [PileCategory.NON_SUPPLY]));
    decoder.pileMetadataCallback?.(createPile('Spoils', 0, [PileCategory.NON_SUPPLY]));
    decoder.pileMetadataCallback?.(updatedRewards);

    expect(component.nonSupplyPiles()).toHaveLength(2);
    expect(component.nonSupplyPiles()[0]).toBe(updatedRewards);
  });

  it('replaces an already-seen non-kingdom supply pile in place when its metadata is updated', () => {
    const { component, decoder } = createComponent();
    const updatedRuins = {
      ...createPile('Ruins', 0, [PileCategory.SUPPLY]),
      size: 9,
      topCard: createTopCard('Survivors', 'survivors-1'),
    };

    component.ngOnInit();
    decoder.pileMetadataCallback?.(createPile('Ruins', 0, [PileCategory.SUPPLY]));
    decoder.pileMetadataCallback?.(updatedRuins);

    expect(component.nonKingdomSupplyPiles()).toHaveLength(1);
    expect(component.nonKingdomSupplyPiles()[0]).toBe(updatedRuins);
  });
});
