import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, MoneyAmount } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { addOverpayEffects } from '../../effects/OverpayEffects';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { isActionCard } from '../../StandardCardEligibilityFunctions';

export class Herald extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Herald'));
    addOverpayEffects(this, async (ie: InstructionExecutor, overpayAmount: MoneyAmount) => {
      for (let i = 0; i < overpayAmount.coins; ++i) {
        const cardToTopDeck = await ie
          .chooseCard('Choose a card to put on your deck')
          .from(CardLocation.DISCARD)
          .to(CardSelectionPurpose.TOPDECK)
          .choose();

        if (cardToTopDeck instanceof Card) {
          await ie.topDeckCardFromLocation(cardToTopDeck, CardLocation.DISCARD);
        }
      }
    });
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);

    const topCard: Card | undefined = await ie.lookAtTopCardOfDeck();
    if (topCard === undefined) {
      return;
    }
    const locationExpectation = ie.createLocationExpectation(CardLocation.DECK);
    await ie.revealCard(topCard);

    if (isActionCard.matches(topCard)) {
      if (!locationExpectation.isMet(topCard)) {
        ie.sendLostTrackMessage(topCard);
        return;
      }
      await ie.playCardFromLocation(topCard, CardLocation.DECK);
    }
  }
}
