import { CardInfoLookup } from '@dominion/card-info';
import { MoneyAmount } from '@dominion/common';

import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { addOverpayEffects } from '../../effects/OverpayEffects';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Farrier extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Farrier'));
    addOverpayEffects(this, async (ie: InstructionExecutor, overpayAmount: MoneyAmount) => {
      ie.addEffect(
        new Effect.Builder()
          .from(this)
          .triggerOn(EffectTriggerType.TURN_END, EffectSource.SELF)
          .onTurn(ie.createThisTurnEligibilityFunction())
          .withExpiration(ie.createOnceThisTurnEffectExpiration())
          .makeMandatory()
          .action(
            new EffectAction(async (nestedIe: InstructionExecutor) => {
              await nestedIe.drawCards(overpayAmount.coins);
            }),
          )
          .build(),
      );
      return Promise.resolve();
    });
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);
    ie.addBuys(1);
  }
}
