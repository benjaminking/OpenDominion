import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice, MoneyAmount } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { EffectContext } from '../../effects/EffectContext';
import { addOverpayEffects } from '../../effects/OverpayEffects';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { anyCard } from '../../StandardCardEligibilityFunctions';

export class Infirmary extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Infirmary'));

    addOverpayEffects(
      this,
      async (ie: InstructionExecutor, overpayAmount: MoneyAmount, effectContext: EffectContext) => {
        // Played from where it was gained, then again from play by each later $1. Once something else has moved it (e.g.
        // Watchtower trashing it), it has lost track of itself: it is still played, but stays where it is.
        let expectedLocation = effectContext.getGainLocation()!;
        let locationExpectation = effectContext.getLocationExpectation()!;
        for (let i = 0; i < overpayAmount.coins; ++i) {
          if (locationExpectation.isMet(this)) {
            const inPlayExpectation = ie.createLocationExpectation(CardLocation.IN_PLAY);
            await ie.playCardFromLocation(this, expectedLocation);
            expectedLocation = CardLocation.IN_PLAY;
            locationExpectation = inPlayExpectation;
          } else {
            ie.sendLostTrackMessage(this);
            await ie.playCardFromSupplyLeavingItThere(this);
          }
        }
      },
    );
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);

    const cardToTrash: Card | Choice = await ie
      .chooseCard('You may trash a card from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .whereCardIs(anyCard)
      .allowNoneOption()
      .choose();
    if (cardToTrash instanceof Card) {
      await ie.trashCardFromLocation(cardToTrash, CardLocation.HAND);
    }
  }
}
