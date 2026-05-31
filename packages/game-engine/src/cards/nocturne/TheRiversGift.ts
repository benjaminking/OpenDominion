import { CardInfoLookup } from '@dominion/card-info';

import { Boon } from '../../card/Boon';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// The River's Gift: +1 Card at the end of this turn (keep until Clean-up).
// Implemented as a TURN_END trigger for this turn only.
export class TheRiversGift extends Boon {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo("The River's Gift"));
  }

  public async receive(ie: InstructionExecutor): Promise<void> {
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.BUY_END, EffectSource.SELF)
        .onTurn(ie.createThisTurnEligibilityFunction())
        .withExpiration(ie.createOnceThisTurnEffectExpiration())
        .makeMandatory()
        .action(
          new EffectAction(async (effectIe: InstructionExecutor) => {
            await effectIe.drawCards(1);
          }),
        )
        .build(),
    );
  }
}
