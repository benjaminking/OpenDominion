import { Component, effect, inject, input, signal } from '@angular/core';
import { CardMetadata } from '../../../../common/dist/card/CardMetadata';
import { MessageDecoderService } from '../message-decoder.service';
import { CardLocation, NumberType } from '@dominion/common';

@Component({
  selector: 'main-player',
  templateUrl: './main-player.component.html',
  styleUrls: ['./main-player.component.css'],
})
export class MainPlayerComponent {
  name = input<string>('');
  deckSize = signal<number>(0);
  topDiscard = signal<CardMetadata | undefined>(undefined);
  setAside = signal<CardMetadata[]>([]);
  limbo = signal<CardMetadata[]>([]);

  actions = signal<number>(0);
  buys = signal<number>(0);
  coins = signal<number>(0);
  score = signal<number>(0);

  private readonly webSocketMessageDecoder = inject(MessageDecoderService);

  constructor() {
    effect(() => {
      this.webSocketMessageDecoder.subscribeToCardCountUpdate(
        { owner: this.name(), location: CardLocation.DECK },
        (cardCountContent: { count: number }) => {
          this.deckSize.set(cardCountContent.count);
        },
      );
      this.webSocketMessageDecoder.subscribeToTopCardUpdate(
        { owner: this.name(), location: CardLocation.DISCARD },
        (topCardContent: { topCard: CardMetadata | undefined }) => {
          this.topDiscard.set(topCardContent.topCard);
        },
      );
      this.webSocketMessageDecoder.subscribeToCardsUpdate(
        { owner: this.name(), location: CardLocation.SET_ASIDE },
        (cardsContent: { cards: CardMetadata[] }) => {
          this.setAside.set(cardsContent.cards);
        },
      );
      this.webSocketMessageDecoder.subscribeToCardsUpdate(
        { owner: this.name(), location: CardLocation.REVEAL_LIMBO },
        (cardsContent: { cards: CardMetadata[] }) => {
          this.limbo.set(cardsContent.cards);
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
