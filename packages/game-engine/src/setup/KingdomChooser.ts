import { CardLocation } from '@dominion/common';

import { CardFactory } from '../card/CardFactory';
import { KingdomCard } from '../card/KingdomCard';
import * as cards from '../cards/index';
import { Randomizers } from './Randomizers';

export class KingdomChooser {
  private cardFactory: CardFactory;
  private allCardNames: string[] = [];
  private usedCardNames: Set<string> = new Set<string>();

  public constructor(cardFactory: CardFactory) {
    this.cardFactory = cardFactory;
    for (const cardName of Object.keys(cards)) {
      this.allCardNames.push(cardName.replace(/\W+/g, ''));
    }
  }

  public selectRandomizers(requiredCardNames: string[]): Randomizers {
    this.usedCardNames.clear();

    const chosenRandomizers: KingdomCard[] = [];

    let kingdomCardCount = 0;
    for (let cardName of requiredCardNames) {
      cardName = cardName.replace(/\W+/g, '');
      if (!(this.cardFactory.createCard(cardName, '', CardLocation.PILE) instanceof KingdomCard)) {
        console.log('Warning: the following required card is not a kingdom card: ' + cardName);
        continue;
      }
      chosenRandomizers.push(
        this.cardFactory.createCard(cardName, cardName + '_randomizer', CardLocation.PILE) as KingdomCard,
      );
      this.usedCardNames.add(cardName);
      kingdomCardCount++;
    }

    while (kingdomCardCount < 10) {
      const cardName = this.getRandomUnusedKingdomCardName();
      chosenRandomizers.push(
        this.cardFactory.createCard(cardName, cardName + '_randomizer', CardLocation.PILE) as KingdomCard,
      );
      this.usedCardNames.add(cardName);
      kingdomCardCount++;
    }

    return new Randomizers(chosenRandomizers);
  }

  private getRandomUnusedKingdomCardName(): string {
    let cardName = this.allCardNames[(this.allCardNames.length * Math.random()) << 0];
    while (
      cardName === 'default' ||
      this.usedCardNames.has(cardName) ||
      !(this.cardFactory.createCard(cardName, '', CardLocation.PILE) instanceof KingdomCard)
    ) {
      cardName = this.allCardNames[(this.allCardNames.length * Math.random()) << 0];
    }
    return cardName;
  }
}
