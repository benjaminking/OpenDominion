import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { isTreasureCard } from '../../StandardCardEligibilityFunctions';

export class FortuneHunter extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Fortune Hunter'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(2);

    const revealedCards: CardCollection = await ie.takeCardsOffDeck(3);
    await ie.revealCards(revealedCards);

    const treasureToPlay: Card | Choice = await ie
      .chooseCard('You may play a Treasure from the revealed cards')
      .from(revealedCards)
      .to(CardSelectionPurpose.PLAY_ALT)
      .whereCardIs(isTreasureCard)
      .allowNoneOption()
      .choose();
    if (treasureToPlay instanceof Card) {
      revealedCards.removeCard(treasureToPlay);
      await ie.playCardFromLocation(treasureToPlay, CardLocation.REVEAL_LIMBO);
    }

    if (revealedCards.size() > 0) {
      await ie.topDeckCardsFromRevealedSet(revealedCards);
    }
  }
}
