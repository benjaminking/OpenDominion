import { CardLocation } from '@dominion/common';

import { Card } from '../card/Card';
import { CardCollection } from '../card/CardCollection';
import { GameMessageBroadcaster } from './GameMessageBroadcaster';

export abstract class CardCollectionSignal extends CardCollection {
  public constructor(
    protected readonly location: CardLocation,
    protected readonly gameMessageBroadcaster: GameMessageBroadcaster,
    cardCollection?: Card | CardCollection,
  ) {
    super(cardCollection);
  }

  public addCard(additionalCard: Card): void {
    super.addCard(additionalCard);
    this.broadcastValue();
  }

  public addCards(additionalCards: Card[] | CardCollection): void {
    super.addCards(additionalCards);
    this.broadcastValue();
  }

  public removeCard(card: Card): Card | undefined {
    const previousSize = this.size();
    const removedCard = super.removeCard(card);
    const newSize = this.size();
    if (previousSize !== newSize) {
      this.broadcastValue();
    }
    return removedCard;
  }

  public removeCards(toRemove: CardCollection): CardCollection {
    const previousSize = this.size();
    const removedCards = super.removeCards(toRemove);
    const newSize = this.size();
    if (previousSize !== newSize) {
      this.broadcastValue();
    }
    return removedCards;
  }

  public clear(): void {
    super.clear();
    this.broadcastValue();
  }

  protected abstract broadcastValue(): void;

  public forceBroadcast(): void {
    this.broadcastValue();
  }
}
