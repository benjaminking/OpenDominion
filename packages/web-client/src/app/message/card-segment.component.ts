import { Component, computed, input } from '@angular/core';
import { CardMetadata, CardType } from '@dominion/common';

@Component({
  selector: 'card-segment',
  templateUrl: './card-segment.component.html',
  styleUrls: ['./card-segment.component.css'],
})
export class CardSegmentComponent {
  text = input.required<string>();
  card = input.required<CardMetadata>();
  size = input<string>('medium');

  isAction = computed<boolean>(() => {
    return this.card().types.includes(CardType.ACTION);
  });

  isTreasure = computed<boolean>(() => {
    return this.card().types.includes(CardType.TREASURE);
  });

  isVictory = computed<boolean>(() => {
    return this.card().types.includes(CardType.VICTORY);
  });

  isCurse = computed<boolean>(() => {
    return this.card().types.includes(CardType.CURSE);
  });

  isDuration = computed<boolean>(() => {
    return this.card().types.includes(CardType.DURATION);
  });

  isReaction = computed<boolean>(() => {
    return this.card().types.includes(CardType.REACTION);
  });
}
