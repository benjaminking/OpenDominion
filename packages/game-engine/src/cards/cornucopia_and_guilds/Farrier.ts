import { CardInfoLookup } from '@dominion/card-info';
import { MoneyAmount } from '@dominion/common';

import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { isTheSameCardAs } from '../../StandardCardEligibilityFunctions';

export class Farrier extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Farrier'));
    this.addEffect(new Effect.Builder()
      .from(this)
      .triggerOn(EffectTriggerType.BUY, EffectSource.SELF)
      .whereCardIs(isTheSameCardAs(this))
      .action(new EffectAction(async (ie: InstructionExecutor) => {
        const overpayAmount: MoneyAmount = await ie.chooseOverpayAmount();
        ie.addEffect(new Effect.Builder()
          .from(this)
          .triggerOn(EffectTriggerType.TURN_END, EffectSource.SELF)
          .action(new EffectAction(async (nestedIe: InstructionExecutor) => {
            await nestedIe.drawCards(overpayAmount.coins);
          }))
        .build())
      }))
      .build())
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);
    ie.addBuys(1);
  }
}
