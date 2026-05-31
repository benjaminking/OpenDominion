import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { costsExactly } from '../../StandardCardEligibilityFunctions';

export class Develop extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Develop'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const cardToTrash: Card | Choice = await ie
      .chooseCard('Choose a card to trash')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .choose();

    if (!(cardToTrash instanceof Card)) {
      return;
    }

    const trashedCard = await ie.trashCardFromLocation(cardToTrash, CardLocation.HAND);
    if (trashedCard === undefined) {
      return;
    }

    const lowerCost = trashedCard.getCost().plus(-1);
    const higherCost = trashedCard.getCost().plus(1);

    if (lowerCost.coins === trashedCard.getCost().coins) {
      await this.gainOntoDeckAtExactCost(
        ie,
        higherCost,
        'Choose a card costing exactly ' + higherCost.toString() + ' to gain',
      );
      return;
    }

    await ie
      .chooseOneOption('Choose which card to gain first:')
      .from(
        new ActionChoice('Gain the higher-cost card first', async () => {
          await this.gainOntoDeckAtExactCost(
            ie,
            higherCost,
            'Choose a card costing exactly ' + higherCost.toString() + ' to gain',
          );
          await this.gainOntoDeckAtExactCost(
            ie,
            lowerCost,
            'Choose a card costing exactly ' + lowerCost.toString() + ' to gain',
          );
        }),
      )
      .from(
        new ActionChoice('Gain the lower-cost card first', async () => {
          await this.gainOntoDeckAtExactCost(
            ie,
            lowerCost,
            'Choose a card costing exactly ' + lowerCost.toString() + ' to gain',
          );
          await this.gainOntoDeckAtExactCost(
            ie,
            higherCost,
            'Choose a card costing exactly ' + higherCost.toString() + ' to gain',
          );
        }),
      )
      .choose();
  }

  private async gainOntoDeckAtExactCost(ie: InstructionExecutor, exactCost: Cost, prompt: string): Promise<void> {
    const cardToGain: Card | Choice = await ie
      .chooseCard(prompt)
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(costsExactly(exactCost))
      .allowNoneOption()
      .choose();

    if (cardToGain instanceof Card) {
      await ie.gainCardFromPile(cardToGain);
      await ie.topDeckCardFromLocation(cardToGain, CardLocation.DISCARD);
    }
  }
}
