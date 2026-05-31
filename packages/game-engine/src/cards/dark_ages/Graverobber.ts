import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { both, costsAtLeast, costsUpTo, isActionCard } from '../../StandardCardEligibilityFunctions';

export class Graverobber extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Graverobber'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie
      .chooseOneOption('Choose one:')
      .from(
        new ActionChoice('Gain a card from the trash costing $3-$6 onto your deck', async () => {
          const trashCards = ie
            .getSharedGameState()
            .trash.getMatchingCards(both(costsAtLeast(Cost.Simple(3)), costsUpTo(Cost.Simple(6))));
          const card: Card | Choice = await ie
            .chooseCard('Choose a card from the trash costing $3-$6')
            .from(trashCards)
            .to(CardSelectionPurpose.GAIN)
            .allowNoneOption()
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
            .allowNoneOption()
            .choose();
          if (cardToTrash instanceof Card) {
            const trashCost = cardToTrash.getCost();
            await ie.trashCardFromLocation(cardToTrash, CardLocation.HAND);
            const cardToGain: Card | Choice = await ie
              .chooseCard('Gain a card costing up to $' + trashCost.plus(3).coins.toFixed())
              .from(CardSelectionLocation.SUPPLY)
              .to(CardSelectionPurpose.GAIN)
              .whereCardIs(costsUpTo(trashCost.plus(3)))
              .allowNoneOption()
              .choose();
            if (cardToGain instanceof Card) {
              await ie.gainCardFromPile(cardToGain);
            }
          }
        }),
      )
      .choose();
  }
}
