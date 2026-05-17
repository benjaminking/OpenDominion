import { CardLocation } from '@dominion/common';

import { Card } from '../card/Card';
import { CardCollection } from '../card/CardCollection';
import { Player } from '../players/Player';
import { GameMessageBroadcaster } from './GameMessageBroadcaster';

export abstract class CardCollectionSignal extends CardCollection {
  public constructor(
    private readonly owner: Player,
    private readonly location: CardLocation,
    private readonly gameMessageBroadcaster: GameMessageBroadcaster,
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

  abstract broadcastValue(): void;
}
