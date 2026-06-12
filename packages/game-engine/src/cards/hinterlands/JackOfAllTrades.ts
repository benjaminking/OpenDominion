import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { isTreasureCard, not } from '../../StandardCardEligibilityFunctions';

export class JackOfAllTrades extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Jack of All Trades'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.gainCardFromPile('Silver');

    const topCard = await ie.lookAtTopCardOfDeck();
    if (topCard !== undefined) {
      await ie.revealCard(topCard);
      await ie
        .chooseOneOption('What do you want to do with ' + topCard.getName() + '?')
        .from(
          new ActionChoice('Discard it', async () => {
            await ie.discardCardFromLocation(topCard, CardLocation.DECK);
          }),
        )
        .from(new ActionChoice('Leave it on top'))
        .choose();
    }

    await ie.drawUpTo(5);

    const cardToTrash: Card | Choice = await ie
      .chooseCard('You may trash a non-Treasure card from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .whereCardIs(not(isTreasureCard))
      .allowNoneOption()
      .choose();
    if (cardToTrash instanceof Card) {
      await ie.trashCardFromLocation(cardToTrash, CardLocation.HAND);
    }
  }
}
