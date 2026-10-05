import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { either, isCurseCard, isRuinsCard, isShelterCard, isVictoryCard } from '../../StandardCardEligibilityFunctions';

export class Vagrant extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Vagrant'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);
    const topCard = await ie.lookAtTopCardOfDeck();
    if (!(topCard instanceof Card)) {
      return;
    }

    await ie.revealCard(topCard);
    const isEligible = either(either(either(isCurseCard, isVictoryCard), isRuinsCard), isShelterCard);
    if (isEligible.matches(topCard)) {
      await ie.putTopCardOfDeckIntoHand();
    }
  }
}
