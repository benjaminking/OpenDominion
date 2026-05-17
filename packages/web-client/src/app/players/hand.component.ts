import { Component, computed, effect, inject, input, OnInit, Signal, signal, WritableSignal } from '@angular/core';
import { CardLocation, CardMetadata, NumberType } from '@dominion/common';
import { MessageDecoderService } from '../message-decoder.service';
import { CardDisplayComponent } from '../cards/card-display.component';

@Component({
  selector: 'hand',
  templateUrl: './hand.component.html',
  styleUrls: ['./hand.component.css'],
  imports: [CardDisplayComponent],
})
export class HandComponent {
  name = input<string>('');
  hand = signal<CardMetadata[]>([]);
  private readonly webSocketMessageDecoder = inject(MessageDecoderService);

  constructor() {
    effect(() => {
      this.webSocketMessageDecoder.subscribeToCardsUpdate(
        { owner: this.name(), location: CardLocation.HAND },
        (cardsContent: { cards: CardMetadata[] }) => {
          this.hand.set(cardsContent.cards);
        },
      );
    });
  }
}
