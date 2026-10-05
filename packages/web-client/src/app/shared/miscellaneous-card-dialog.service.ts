import { Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { CardMetadata } from '@dominion/common';

@Injectable({ providedIn: 'root' })
export class MiscellaneousCardDialogService {
  private cards: WritableSignal<CardMetadata[]> = signal([]);

  setCards(cards: CardMetadata[]): void {
    this.cards.set(cards);
  }

  getCards(): Signal<CardMetadata[]> {
    return this.cards;
  }
}
