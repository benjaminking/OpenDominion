import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, MoneyAmount } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { isActionCard, isTheSameCardAs } from '../../StandardCardEligibilityFunctions';

export class Herald extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Herald'));
    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.BUY, EffectSource.SELF)
        .whereCardIs(isTheSameCardAs(this))
        .action(
          new EffectAction(async (ie: InstructionExecutor) => {
            const overpayAmount: MoneyAmount | undefined = await ie.chooseOverpayAmount();
            if (overpayAmount === undefined) {
              return;
            }
            for (let i = 0; i < overpayAmount.coins; ++i) {
              const cardToTopDeck = ie
                .chooseCard('Choose a card to put on your deck')
                .from(CardLocation.DISCARD)
                .to(CardSelectionPurpose.TOPDECK)
                .choose();

              if (cardToTopDeck instanceof Card) {
                await ie.topDeckCardFromLocation(cardToTopDeck, CardLocation.DISCARD);
              }
            }
          }),
        )
        .build(),
    );
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);

    const topCard: Card | undefined = await ie.lookAtTopCardOfDeck();
    if (topCard === undefined) {
      return;
    }
    await ie.revealCard(topCard);

    if (isActionCard.matches(topCard)) {
      await ie.playCardFromLocation(topCard, CardLocation.DECK);
    }
  }
}
