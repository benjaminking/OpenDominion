import { Component, effect, inject, input, OnInit, signal } from '@angular/core';
import { CardLocation, CardMetadata, NumberType } from '@dominion/common';
import { MessageDecoderService } from '../message-decoder.service';

@Component({
  selector: 'opponent',
  templateUrl: './opponent.component.html',
  styleUrls: ['./opponent.component.css'],
})
export class OpponentComponent {
  name = input<string>('');
  handSize = signal<number>(0);
  deckSize = signal<number>(0);
  topDiscard = signal<CardMetadata | null>(null);
  setAsideSize = signal<number>(0);
  limboSize = signal<number>(0);

  actions = signal<number>(0);
  buys = signal<number>(0);
  coins = signal<number>(0);
  score = signal<number>(0);

  private readonly webSocketMessageDecoder = inject(MessageDecoderService);

  constructor() {
    effect(() => {
      this.webSocketMessageDecoder.subscribeToCardCountUpdate(
        { owner: this.name(), location: CardLocation.HAND },
        (cardCountContent: { count: number }) => {
          this.handSize.set(cardCountContent.count);
        },
      );
      this.webSocketMessageDecoder.subscribeToCardCountUpdate(
        { owner: this.name(), location: CardLocation.DECK },
        (cardCountContent: { count: number }) => {
          this.deckSize.set(cardCountContent.count);
        },
      );
      this.webSocketMessageDecoder.subscribeToTopCardUpdate(
        { owner: this.name(), location: CardLocation.DISCARD },
        (topCardContent: { topCard: CardMetadata | null }) => {
          this.topDiscard.set(topCardContent.topCard);
        },
      );
      this.webSocketMessageDecoder.subscribeToCardCountUpdate(
        { owner: this.name(), location: CardLocation.SET_ASIDE },
        (cardCountContent: { count: number }) => {
          this.setAsideSize.set(cardCountContent.count);
        },
      );
      this.webSocketMessageDecoder.subscribeToCardCountUpdate(
        { owner: this.name(), location: CardLocation.REVEAL_LIMBO },
        (cardCountContent: { count: number }) => {
          this.limboSize.set(cardCountContent.count);
        },
      );

      this.webSocketMessageDecoder.subscribeToStatisticUpdate(
        { owner: this.name(), type: NumberType.ACTIONS },
        (statisticContent: { value: number }) => {
          this.actions.set(statisticContent.value);
        },
      );
      this.webSocketMessageDecoder.subscribeToStatisticUpdate(
        { owner: this.name(), type: NumberType.BUYS },
        (statisticContent: { value: number }) => {
          this.buys.set(statisticContent.value);
        },
      );
      this.webSocketMessageDecoder.subscribeToStatisticUpdate(
        { owner: this.name(), type: NumberType.COINS },
        (statisticContent: { value: number }) => {
          this.coins.set(statisticContent.value);
        },
      );
      this.webSocketMessageDecoder.subscribeToStatisticUpdate(
        { owner: this.name(), type: NumberType.SCORE },
        (statisticContent: { value: number }) => {
          this.score.set(statisticContent.value);
        },
      );
    });
  }
}
