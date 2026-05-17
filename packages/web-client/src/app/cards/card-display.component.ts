import { Component, computed, input } from '@angular/core';
import { CardGroupComponent } from './card-group.component';

import { CardMetadata } from '@dominion/common';
import { CardGrouper, SingleCardGrouper } from '@dominion/client-common';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'card-display',
  templateUrl: './card-display.component.html',
  styleUrls: ['./card-display.component.css'],
  imports: [CommonModule, CardGroupComponent],
})
export class CardDisplayComponent {
  cards = input.required<CardMetadata[]>();
  grouped = input<boolean>(false);
  sorted = input<boolean>(false);
  staggered = input<boolean>(false);

  cardGroups = computed(() => {
    if (this.grouped()) {
      return new CardGrouper(this.cards(), this.sorted()).getCardGroups();
    }
    return new SingleCardGrouper(this.cards(), this.sorted()).getCardGroups();
  });
}
