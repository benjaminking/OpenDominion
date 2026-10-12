import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Cartographer extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Cartographer'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);

    const topCards = await ie.takeCardsOffDeck(4);
    const locationExpectation = ie.createLocationExpectation(CardLocation.REVEAL_LIMBO);
    // Nothing to look at, so nothing to choose
    if (topCards.size() === 0) {
      return;
    }

    const toDiscard: CardCollection = await ie
      .chooseCards('Choose any number of cards to discard')
      .from(topCards)
      .to(CardSelectionPurpose.DISCARD)
      .choose();

    await ie.discardCardsFromRevealedSet(toDiscard, topCards);
    // Discarding fires triggers (e.g. a discarded Trail or Weaver playing itself), so the rest may have moved since
    for (const card of [...topCards.asCardArray()]) {
      if (!locationExpectation.isMet(card)) {
        ie.sendLostTrackMessage(card);
        topCards.removeCard(card);
      }
    }
    if (topCards.size() > 0) {
      await ie.topDeckCardsFromRevealedSet(topCards);
    }
  }
}
