import { CardLocation, Expansion } from '@dominion/common';

import { Card } from '../card/Card';
import { CardCollection } from '../card/CardCollection';
import { CardFactory } from '../card/CardFactory';
import * as cards from '../cards/index';
import { SharedGameState } from '../game-state/SharedGameState';
import { PileSpecification } from './PileSpecification';
import { anyKingdomPileSpecification } from './StandardPileSpecifications';

export class KingdomChooser {
  private allCardNames: string[] = [];
  private requiredCardRandomizers: Card[] = [];
  private kingdomCardsGenerated: CardCollection = new CardCollection();
  private allCardsGenerated: CardCollection = new CardCollection();
  private usedCardNames: Set<string> = new Set<string>();
  private MAX_NUM_CARD_FINDING_ATTEMPTS = 200;

  public constructor(private readonly cardFactory: CardFactory, requiredCardNames: string[]) {
    for (const cardName of Object.keys(cards)) {
      this.allCardNames.push(cardName.replace(/\W+/g, ''));
    }
    for (const requiredCardName of requiredCardNames) {
      this.requiredCardRandomizers.push(this.createRandomizer(requiredCardName))
    }
  }

  public hasMoreKingdomCards(): boolean {
    return this.kingdomCardsGenerated.size() < 10;
  }

  public getNextKingdomRandomizer(): Card | undefined {
    if (this.requiredCardRandomizers.length) {
      return this.requiredCardRandomizers.pop();
    }
    const randomizer = this.selectMatchingRandomizer(anyKingdomPileSpecification);
    if (randomizer !== undefined) {
      this.kingdomCardsGenerated.addCard(randomizer);
    }
    return randomizer;
  }

  public selectMatchingRandomizer(pileSpecification: PileSpecification): Card | undefined {
    let numAttempts = 0;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      const randomCard = this.chooseRandomCard()
      numAttempts++;
      if (pileSpecification.doesRandomizerMatch(randomCard)) {
        this.allCardsGenerated.addCard(randomCard);
        return randomCard;
      }
      if (numAttempts >= this.MAX_NUM_CARD_FINDING_ATTEMPTS) {
        return undefined;
      }
    }
    return undefined;
  }

  private chooseRandomCard(): Card {
    const randomCardName = this.chooseRandomCardName();
    return this.createRandomizer(randomCardName);
  }

  private createRandomizer(cardName: string): Card {
    return this.cardFactory.createCard(cardName, cardName + '_randomizer', CardLocation.PILE);
  }

  private chooseRandomCardName(): string {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      const cardName = this.allCardNames[(this.allCardNames.length * Math.random()) << 0];
      if (cardName !== 'default' && !this.usedCardNames.has(cardName)) {
        return cardName;
      }
    }
    return '';
  }

  public getProportionFromExpansion(expansion: Expansion): number {
    return this.kingdomCardsGenerated.getProportionFromExpansion(expansion);
  }

  public applyGameStateSetupRules(sharedGameState: SharedGameState): void {
    for (const randomizer of this.allCardsGenerated) {
      if (!randomizer.getSetupRules().hasAnyGameStateSetupRules()) {
        return;
      }
      
      while (randomizer.getSetupRules().hasAnyGameStateSetupRules()) {
        const setupRule = randomizer.getSetupRules().getNextGameStateSetupRule();
        setupRule.applySetupRule(sharedGameState);
      }
    }
  }
}
