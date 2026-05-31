import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { anyCard, cardNameIs } from '../../StandardCardEligibilityFunctions';

// Monastery (Night): For each card you've gained this turn, you may trash a card from
// your hand or a Copper you have in play.
export class Monastery extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Monastery'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const numGained = ie.getNumCardsGainedThisTurn();
    for (let i = 0; i < numGained; i++) {
      await ie
        .chooseOneOption('Trash a card from your hand, a Copper in play, or neither?')
        .from(
          new ActionChoice('Trash a card from your hand', async () => {
            const cardToTrash: Card | Choice = await ie
              .chooseCard('Choose a card to trash from your hand')
              .from(CardLocation.HAND)
              .to(CardSelectionPurpose.TRASH)
              .whereCardIs(anyCard)
              .choose();
            if (cardToTrash instanceof Card) {
              await ie.trashCardFromLocation(cardToTrash, CardLocation.HAND);
            }
          }),
        )
        .from(
          new ActionChoice('Trash a Copper in play', async () => {
            const copperToTrash: Card | Choice = await ie
              .chooseCard('Choose a Copper in play to trash')
              .from(CardLocation.IN_PLAY)
              .to(CardSelectionPurpose.TRASH)
              .whereCardIs(cardNameIs('Copper'))
              .allowNoneOption()
              .choose();
            if (copperToTrash instanceof Card) {
              await ie.trashCardFromLocation(copperToTrash, CardLocation.IN_PLAY);
            }
          }),
        )
        .from(new ActionChoice('Neither', () => {}))
        .choose();
    }
  }
}
