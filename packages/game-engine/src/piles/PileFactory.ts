import { CardInfo, CardLocation, PileCategory } from '@dominion/common';

import { Card } from '../card/Card';
import { CardCollection } from '../card/CardCollection';
import { CardFactory } from '../card/CardFactory';
import { SharedGameState } from '../game-state/SharedGameState';
import { GameMessageBroadcaster } from '../messaging/GameMessageBroadcaster';
import { convertToClassName } from '../NameUtils';
import { Pile } from './Pile';
import { PileSizeLogic } from './PileSizeLogic';
import { SpecialPileSpecification } from './SpecialPiles';

export class PileFactory {
  private readonly cardFactory: CardFactory;
  private readonly pileSizeLogic: PileSizeLogic;

  constructor(
    sharedGameState: SharedGameState,
    private readonly gameMessageBroadcaster: GameMessageBroadcaster,
  ) {
    this.cardFactory = new CardFactory(sharedGameState);
    this.pileSizeLogic = new PileSizeLogic(sharedGameState.getNumPlayers());
  }

  public createPile(cardInfo: CardInfo, categories: Set<PileCategory>): Pile {
    const cards: CardCollection = new CardCollection();
    const className = convertToClassName(cardInfo.name);
    const pileSize = this.pileSizeLogic.getPileSize(cardInfo);
    for (let i = 0; i < pileSize; i++) {
      const card: Card = this.cardFactory.createCard(className, className + '-pile-' + i.toFixed(), CardLocation.PILE);
      card.setId(cardInfo.name + '_pile_' + i.toFixed());
      card.markAsSupplyCard();
      cards.addCard(card);
    }
    return new Pile(cardInfo.name, cards, new Set(cardInfo.types), categories, this.gameMessageBroadcaster);
  }

  createSpecialPile(specialPileSpecification: SpecialPileSpecification): Pile {
    let cards: Card[] = [];
    const cardCountsByName = new Map<string, number>();
    for (const cardInfo of specialPileSpecification.cardInfos) {
      if (!cardCountsByName.has(cardInfo.name)) {
        cardCountsByName.set(cardInfo.name, 0);
      }
      cardCountsByName.set(cardInfo.name, cardCountsByName.get(cardInfo.name)! + 1);

      const className = convertToClassName(cardInfo.name);
      const card: Card = this.cardFactory.createCard(
        className,
        className + '-pile-' + cardCountsByName.get(cardInfo.name)!.toFixed(),
        CardLocation.PILE,
      );
      card.setId(cardInfo.name + '_pile_' + cardCountsByName.get(cardInfo.name)!.toFixed());
      card.markAsSupplyCard();
      cards.push(card);
    }

    if (specialPileSpecification.isShuffled) {
      cards = this.shuffleCards(cards);
    }

    const pileSize = this.pileSizeLogic.getPileSize(specialPileSpecification.randomizerCardInfo);
    cards = cards.slice(0, pileSize);

    return new Pile(
      specialPileSpecification.pileName,
      CardCollection.fromCards(cards),
      new Set(specialPileSpecification.randomizerCardInfo.types),
      specialPileSpecification.pileCategories,
      this.gameMessageBroadcaster,
    );
  }

  private shuffleCards(cards: Card[]): Card[] {
    const shuffled: Card[] = [...cards];

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  }
}
