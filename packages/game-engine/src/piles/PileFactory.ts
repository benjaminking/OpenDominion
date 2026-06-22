import { CardInfo, CardLocation, CardType, PileCategory } from '@dominion/common';

import { Card } from '../card/Card';
import { CardCollection } from '../card/CardCollection';
import { CardFactory } from '../card/CardFactory';
import { SharedGameState } from '../game-state/SharedGameState';
import { GameMessageBroadcaster } from '../messaging/GameMessageBroadcaster';
import { convertToClassName } from '../NameUtils';
import { Pile } from './Pile';
import { SpecialPileSpecification } from './SpecialPiles';

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

  createSpecialPile(specialPileSpecification: SpecialPileSpecification): Pile {
    const cards: CardCollection = new CardCollection();
    let cardCountsByName: Map<string, number> = new Map();
    for (const cardInfo of specialPileSpecification.cardInfos) {
      if (!cardCountsByName.has(cardInfo.name)) {
        cardCountsByName.set(cardInfo.name, 0);
      }
      cardCountsByName.set(cardInfo.name, cardCountsByName.get(cardInfo.name)! + 1);

      const className = convertToClassName(cardInfo.name);
      const card: Card = this.cardFactory.createCard(className, className + '-pile-' + cardCountsByName.get(cardInfo.name)!.toFixed(), CardLocation.PILE);
      card.setId(cardInfo.name + '_pile_' + cardCountsByName.get(cardInfo.name)!.toFixed());
      card.markAsSupplyCard();
      cards.addCard(card);
    }
    return new Pile(specialPileSpecification.pileName, cards, new Set(specialPileSpecification.randomizerCardInfo.types), specialPileSpecification.pileCategories, this.gameMessageBroadcaster);
  }
}
