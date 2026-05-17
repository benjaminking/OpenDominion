import { CardLocation } from '@dominion/common';

import { CardCollectionSignal } from '../messaging/CardCollectionSignal';
import { Card } from './Card';

export abstract class OrderedStack extends CardCollectionSignal {
  public getTopCard(): Card | undefined {
    if (this.cards.length > 0) {
      const topCard: Card = this.cards[this.cards.length - 1];

      return topCard;
    }

    return undefined;
  }

  public removeTopCard(): Card {
    if (this.cards.length > 0) {
      const topCard: Card = this.cards.pop()!;
      this.broadcastValue();

      return topCard;
    }

    throw new Error('Error: trying to get top card of empty stack');
  }

  public updateLocationForAll(location: CardLocation): void {
    for (const card of this.cards) {
      card.setLocation(location);
    }
  }

  public insertCardAtPosition(card: Card, position: number): void {
    this.cards.splice(position, 0, card);
    this.broadcastValue();
  }

  public shuffle(): void {
    //for(var j, x, i = cards.length; i; j = parseInt(Math.random() * i), x = cards[--i], cards[i] = cards[j], cards[j] = x);

    for (let index: number = this.cards.length; index > 0; --index) {
      const randomIndex: number = Math.floor(Math.random() * index);
      const cardHolder: Card = this.cards[index - 1];
      this.cards[index - 1] = this.cards[randomIndex];
      this.cards[randomIndex] = cardHolder;
    }
    this.broadcastValue();
  }
}
