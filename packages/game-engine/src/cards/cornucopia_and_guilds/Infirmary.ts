import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice, MoneyAmount } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { anyCard, isTheSameCardAs } from '../../StandardCardEligibilityFunctions';

export class Infirmary extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Infirmary'));

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
              // TODO: not sure whether this still gets played if you lose track of it
              await ie.playCardFromLocation(this, this.getLocation());
            }
          }),
        )
        .build(),
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
