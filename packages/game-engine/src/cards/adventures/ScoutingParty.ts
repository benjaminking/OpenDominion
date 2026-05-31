import { CardInfoLookup } from '@dominion/card-info';
import { CardSelectionPurpose } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { Event } from '../../card/Event';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { upToNChecked, exactlyNChecked } from '../../StandardNumberEligibilityFunctions';

export class ScoutingParty extends Event {
  public constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Scouting Party'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    ie.addBuys(1);
    const topCards: CardCollection = await ie.takeCardsOffDeck(5);
    const cardsToDiscard: CardCollection = await ie
      .chooseCards('Discard 3 cards')
      .from(topCards)
      .to(CardSelectionPurpose.DISCARD)
      .whereNumCardsIs(exactlyNChecked(Math.min(3, topCards.size())))
      .choose();
    await ie.discardCardsFromRevealedSet(cardsToDiscard, topCards);
    await ie.topDeckCardsFromRevealedSet(topCards);
  }
}
