import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { cardNameIs } from '../../StandardCardEligibilityFunctions';

export class Gladiator extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Gladiator'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(2);
    const cardToReveal: Card | Choice = await ie
      .chooseCard('Reveal a card from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.OTHER)
      .choose();
    if (!(cardToReveal instanceof Card)) {
      return;
    }
    await ie.revealCard(cardToReveal);

    // The player to your left may reveal a copy from their hand
    const leftPlayer = ie.getSharedGameState().getPlayerLeftOfCurrent();
    const leftIe = leftPlayer.getInstructionExecutor();
    const copyChoice: Card | Choice = await leftIe
      .chooseCard(
        'You may reveal a copy of ' + cardToReveal.getName() + ' from your hand',
      )
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.OTHER)
      .whereCardIs(cardNameIs(cardToReveal.getName()))
      .allowNoneOption()
      .choose();

    if (copyChoice instanceof Card) {
      // Left player revealed a copy; no bonus
      await leftIe.revealCard(copyChoice);
    } else {
      // Left player didn't reveal a copy; +$1 and trash a Gladiator from its pile
      await ie.addCoins(1);
      const gladiatorInPile = ie.getSharedGameState().piles.getTopCardOfPile('Gladiator');
      if (gladiatorInPile !== undefined) {
        ie.getSharedGameState().piles.removeTopCardFromPile('Gladiator');
        await ie.trashCard(gladiatorInPile);
      }
    }
  }
}
