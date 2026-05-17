import { Component, computed, effect, inject, input, OnInit, Signal, signal, WritableSignal } from '@angular/core';
import { CardLocation, CardMetadata, NumberType } from '@dominion/common';
import { MessageDecoderService } from '../message-decoder.service';
import { CardDisplayComponent } from '../cards/card-display.component';

@Component({
  selector: 'play-area',
  templateUrl: './play-area.component.html',
  styleUrls: ['./play-area.component.css'],
  imports: [CardDisplayComponent],
})
export class PlayAreaComponent {
  playerNames = input<string[]>([]);
  playerInPlays: Signal<Map<string, WritableSignal<CardMetadata[]>>> = computed(() => {
    const inPlayByName: Map<string, WritableSignal<CardMetadata[]>> = new Map();
    this.playerNames().forEach((name) => {
      inPlayByName.set(name, signal<CardMetadata[]>([]));
    });
    return inPlayByName;
  });
  currentPlayerName = input<string>('');

  private readonly webSocketMessageDecoder = inject(MessageDecoderService);

  constructor() {
    effect(() => {
      for (const name of this.playerNames()) {
        this.webSocketMessageDecoder.subscribeToCardsUpdate(
          { owner: name, location: CardLocation.IN_PLAY },
          (cardsUpdateContent: { cards: CardMetadata[] }) => {
            const inPlaySignal = this.playerInPlays().get(name);
            if (inPlaySignal) {
              inPlaySignal.set(cardsUpdateContent.cards);
            }
          },
        );
      }
    });
  }
}
