import { CardInfo, CardLocation, CardType, PileCategory } from '@dominion/common';

import { Card } from '../card/Card';
import { CardCollection } from '../card/CardCollection';
import { CardFactory } from '../card/CardFactory';
import { SharedGameState } from '../game-state/SharedGameState';
import { GameMessageBroadcaster } from '../messaging/GameMessageBroadcaster';
import { convertToClassName } from '../NameUtils';
import { Pile } from './Pile';

export class PileFactory {
  private cardFactory: CardFactory;

  constructor(
    sharedGameState: SharedGameState,
    private readonly gameMessageBroadcaster: GameMessageBroadcaster,
  ) {
    this.cardFactory = new CardFactory(sharedGameState);
  }

  public createPile(cardInfo: CardInfo, size: number, categories: Set<PileCategory>): Pile {
    const cards: CardCollection = new CardCollection();
    const className = convertToClassName(cardInfo.name);
    for (let i = 0; i < size; i++) {
      const card: Card = this.cardFactory.createCard(className, className + '-pile-' + i.toFixed(), CardLocation.PILE);
      card.setId(cardInfo.name + '_pile_' + i.toFixed());
      card.markAsSupplyCard();
      cards.addCard(card);
    }
    return new Pile(cardInfo.name, cards, new Set(cardInfo.types), categories, this.gameMessageBroadcaster);
  }
}
