import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { costsBetween, costsUpToNMoreThanCard, isActionCard } from '../../StandardCardEligibilityFunctions';

export class Graverobber extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Graverobber'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie
      .chooseOneOption('Choose one:')
      .from(
        new ActionChoice('Gain a card from the trash costing $3-$6 onto your deck', async () => {
          const card: Card | Choice = await ie
            .chooseCard('Choose a card from the trash costing $3-$6')
            .from(CardLocation.TRASH)
            .to(CardSelectionPurpose.GAIN)
            .whereCardIs(costsBetween(Cost.Simple(3), Cost.Simple(6)))
            .choose();
          if (card instanceof Card) {
            await ie.gainCardFromTrash(card, CardLocation.DECK);
          }
        }),
      )
      .from(
        new ActionChoice('Trash an Action card from your hand and gain a card costing up to $3 more', async () => {
          const cardToTrash: Card | Choice = await ie
            .chooseCard('Choose an Action card from your hand to trash')
            .from(CardLocation.HAND)
            .to(CardSelectionPurpose.TRASH)
            .whereCardIs(isActionCard)
            .choose();

          if (!(cardToTrash instanceof Card)) {
            return;
          }

          const trashedCard = await ie.trashCardFromLocation(cardToTrash, CardLocation.HAND);
          if (!(trashedCard instanceof Card)) {
            return;
          }

          const cardToGain: Card | Choice = await ie
            .chooseCard('Gain a card costing up to $' + trashedCard.getCost().plus(3).toString())
            .from(CardSelectionLocation.SUPPLY)
            .to(CardSelectionPurpose.GAIN)
            .whereCardIs(costsUpToNMoreThanCard(trashedCard, 3))
            .choose();
          if (cardToGain instanceof Card) {
            await ie.gainCardFromPile(cardToGain);
          }
        }),
      )
      .choose();
  }
}
