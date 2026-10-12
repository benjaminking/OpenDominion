import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { LocationExpectation } from '../../game-state/LocationExpectation';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { both, cardNameIs, isActionCard, not } from '../../StandardCardEligibilityFunctions';

export class Golem extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Golem'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    // Created before the Actions are revealed, so playing the first one can't take the second one from where it was
    // revealed without Golem losing track of it
    const locationExpectation = ie.createLocationExpectation(CardLocation.REVEAL_LIMBO);
    const actions = await ie.revealUntil(both(isActionCard, not(cardNameIs('Golem'))), 2);
    await this.playInChosenOrder(ie, actions, locationExpectation);
  }

  private async playInChosenOrder(
    ie: InstructionExecutor,
    actions: CardCollection,
    locationExpectation: LocationExpectation,
  ): Promise<void> {
    while (actions.size() > 0) {
      const nextToPlay: Card | Choice = await ie
        .chooseCard('Choose a card to play next')
        .from(actions)
        .to(CardSelectionPurpose.PLAY_ALT)
        .choose();
      if (!(nextToPlay instanceof Card)) {
        return;
      }
      actions.removeCard(nextToPlay);
      if (!locationExpectation.isMet(nextToPlay)) {
        ie.sendLostTrackMessage(nextToPlay);
      } else {
        await ie.playCardFromLocation(nextToPlay, CardLocation.REVEAL_LIMBO);
      }
    }
  }
}
