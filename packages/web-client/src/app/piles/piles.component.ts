import { Component, computed, inject, input, OnInit, signal, ViewChild } from '@angular/core';
import { MessageDecoderService } from '../message-decoder.service';
import { PileCategory, PileMetadata } from '@dominion/common';
import { PileComponent } from './pile.component';
import { GlobalSettingsService } from '../settings/global-settings.service';

@Component({
  selector: 'piles',
  templateUrl: './piles.component.html',
  styleUrls: ['./piles.component.css'],
  imports: [PileComponent],
})
export class PilesComponent implements OnInit {
  kingdomPiles = signal<PileMetadata[]>([]);
  treasurePiles = signal<PileMetadata[]>([]);
  victoryPiles = signal<PileMetadata[]>([]);
  nonSupplyPiles = signal<PileMetadata[]>([]);
  seenPileNames: Set<string> = new Set();

  private readonly webSocketMessageDecoder = inject(MessageDecoderService);

  ngOnInit(): void {
    this.webSocketMessageDecoder.subscribeToPileMetadata((pileMetadata: PileMetadata) => {
      this.addPileToGroup(pileMetadata);
    });
  }

  private addPileToGroup(pile: PileMetadata): void {
    if (this.seenPileNames.has(pile.name)) {
      return;
    }
    this.seenPileNames.add(pile.name);

    for (const category of pile.categories) {
      if (category === PileCategory.NON_SUPPLY) {
        this.nonSupplyPiles.update((currentValue: PileMetadata[]) => {
          return [...currentValue, pile].sort(pileSortingFunction);
        });
      }
      if (category === PileCategory.KINGDOM) {
        this.kingdomPiles.update((currentValue: PileMetadata[]) => {
          return [...currentValue, pile].sort(pileSortingFunction);
        });
      }
      if (category === PileCategory.BASIC_TREASURE) {
        this.treasurePiles.update((currentValue: PileMetadata[]) => {
          return [...currentValue, pile].sort(pileSortingFunction);
        });
      }
      if (category === PileCategory.BASIC_VICTORY) {
        this.victoryPiles.update((currentValue: PileMetadata[]) => {
          return [...currentValue, pile].sort(pileSortingFunction);
        });
      }
    }
  }
}

function pileSortingFunction(a: PileMetadata, b: PileMetadata): number {
  return b.cost.coins - a.cost.coins || a.name.localeCompare(b.name);
}
