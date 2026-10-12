import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { LocationExpectation } from '../../game-state/LocationExpectation';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { isActionCard } from '../../StandardCardEligibilityFunctions';

export class Vassal extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Vassal'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(2);
    const card: Card | undefined = await ie.takeCardOffDeck();
    if (card === undefined) {
      return;
    }
    // Created after taking the card (taking it can shuffle the discard pile) and before discarding it, so a
    // "when discarded" ability moving it away from the discard pile (e.g. Weaver or Trail playing itself) breaks it
    const locationExpectation = ie.createLocationExpectation(CardLocation.DISCARD);
    await ie.discardCardFromLocation(card, CardLocation.REVEAL_LIMBO);

    if (isActionCard.matches(card)) {
      await ie
        .chooseOneOption('Do you want to play ' + card.getName() + '?')
        .from(new ActionChoice('Yes', () => this.playDiscardedCard(ie, card, locationExpectation)))
        .from(new ActionChoice('No'))
        .choose();
    }
  }

  private async playDiscardedCard(
    ie: InstructionExecutor,
    card: Card,
    locationExpectation: LocationExpectation,
  ): Promise<void> {
    if (!locationExpectation.isMet(card)) {
      ie.sendLostTrackMessage(card);
      return;
    }
    await ie.playCardFromLocation(card, CardLocation.DISCARD);
  }
}
