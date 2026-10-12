import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { cardNameIs } from '../../StandardCardEligibilityFunctions';

export class TreasureMap extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Treasure Map'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    // E.g. on Throne Room's second play, this is already in the trash
    const locationExpectation = ie.createLocationExpectation(CardLocation.IN_PLAY);
    let trashedThis: Card | undefined;
    if (locationExpectation.isMet(this)) {
      trashedThis = await ie.trashCardFromLocation(this, CardLocation.IN_PLAY);
    } else {
      ie.sendLostTrackMessage(this);
    }

    const secondMap: Card | Choice = await ie
      .chooseCard('You may trash another Treasure Map')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .whereCardIs(cardNameIs('Treasure Map'))
      .choose();

    if (!(secondMap instanceof Card)) {
      return;
    }
    const trashedSecondMap: Card | undefined = await ie.trashCardFromLocation(secondMap, CardLocation.HAND);
    // The Golds come only from trashing two Treasure Maps, e.g. not on Throne Room's second play
    if (trashedThis !== undefined && trashedSecondMap !== undefined) {
      for (let i = 0; i < 4; i++) {
        await ie.gainFromPile('Gold', CardLocation.DECK);
      }
    }
  }
}
