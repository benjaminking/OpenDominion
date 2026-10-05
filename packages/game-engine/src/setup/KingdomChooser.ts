import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, Expansion } from '@dominion/common';

import { Card } from '../card/Card';
import { CardCollection } from '../card/CardCollection';
import { CardFactory } from '../card/CardFactory';
import { SharedGameState } from '../game-state/SharedGameState';
import { convertToClassName } from '../NameUtils';
import { PileSpecification } from './PileSpecification';

export class KingdomChooser {
  private requiredCardRandomizers: Card[] = [];
  private kingdomCardsGenerated: CardCollection = new CardCollection();
  private allCardsGenerated: CardCollection = new CardCollection();
  private usedCardNames: Set<string> = new Set<string>();
  private MAX_NUM_CARD_FINDING_ATTEMPTS = 200;
  private readonly anyKingdomPileSpecification: PileSpecification = new PileSpecification(
    { requiredExpansions: [], requiredCoinCosts: [], requiredTypes: [] },
    true,
    true,
  );

  public constructor(
    private readonly cardFactory: CardFactory,
    requiredCardNames: string[],
  ) {
    for (const requiredCardName of requiredCardNames) {
      this.requiredCardRandomizers.push(this.createRandomizer(requiredCardName));
    }
  }

  public hasMoreKingdomCards(): boolean {
    return this.kingdomCardsGenerated.size() < 10;
  }

  public getNextKingdomRandomizer(): Card | undefined {
    if (this.requiredCardRandomizers.length > 0) {
      const requiredRandomizer = this.requiredCardRandomizers.pop()!;
      this.kingdomCardsGenerated.addCard(requiredRandomizer);
      return requiredRandomizer;
    }
    const randomizer = this.selectMatchingRandomizer(this.anyKingdomPileSpecification);
    if (randomizer !== undefined) {
      this.kingdomCardsGenerated.addCard(randomizer);
    }
    return randomizer;
  }

  public selectMatchingRandomizer(pileSpecification: PileSpecification): Card | undefined {
    const randomCardName = CardInfoLookup.findMatchingRandomizerName(
      pileSpecification.getRandomizerRequirements(),
      this.usedCardNames,
    );
    if (randomCardName === undefined) {
      return undefined;
    }
    return this.createRandomizer(randomCardName);
  }

  private createRandomizer(cardName: string): Card {
    const className = convertToClassName(cardName);
    return this.cardFactory.createCard(className, className + '-randomizer', CardLocation.PILE);
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
