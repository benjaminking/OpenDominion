import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { Event } from '../../card/Event';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { upToNChecked } from '../../StandardNumberEligibilityFunctions';

export class Pilgrimage extends Event {
  public constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Pilgrimage'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    // Once per turn: Turn Journey token; if face up, choose up to 3 differently named cards in play and gain a copy of each.
    if (ie.oncePerTurn('Pilgrimage')) {
      return;
    }
    ie.flipJourneyToken();
    if (ie.isJourneyTokenFaceUp()) {
      const cardsInPlay: CardCollection = await ie
        .chooseCards('Choose up to 3 differently named cards you have in play')
        .from(CardLocation.IN_PLAY)
        .to(CardSelectionPurpose.OTHER)
        .whereNumCardsIs(upToNChecked(3))
        .choose();
      for (const card of cardsInPlay.asCardArray()) {
        await ie.gainCardFromPile(card.getPileName());
      }
    }
  }
}
