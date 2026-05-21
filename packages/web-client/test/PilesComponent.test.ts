import '@angular/compiler';
import { Injector, runInInjectionContext } from '@angular/core';
import { CardLocation, CardType, PileCategory, type CardMetadata, type PileMetadata } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { MessageDecoderService } from '../src/app/message-decoder.service';
import { PilesComponent } from '../src/app/piles/piles.component';

function createTopCard(name: string, id: string): CardMetadata {
  return {
    name,
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
    cost: { coins },
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

describe('PilesComponent', () => {
  it('groups incoming piles by category, sorts them, and ignores duplicate names', () => {
    const decoder = new FakeMessageDecoderService();
    const injector = Injector.create({
      providers: [{ provide: MessageDecoderService, useValue: decoder }],
    });
    const component = runInInjectionContext(injector, () => new PilesComponent());
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

    expect(component.kingdomPiles().map((pile) => pile.name)).toEqual(['Market', 'Horse Traders', 'Village']);
    expect(component.treasurePiles().map((pile) => pile.name)).toEqual(['Silver']);
    expect(component.victoryPiles().map((pile) => pile.name)).toEqual(['Duchy']);
    expect(component.nonSupplyPiles().map((pile) => pile.name)).toEqual(['Horse Traders']);
    expect([...component.seenPileNames]).toEqual(['Village', 'Market', 'Silver', 'Duchy', 'Horse Traders']);
  });
});
