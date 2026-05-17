import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class MerchantShip extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Merchant Ship'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(2);
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
        .makeMandatory()
        .action(
          new EffectAction(async (ie: InstructionExecutor) => {
            await ie.addCoins(2);
            this.markAsFinished();
          }),
        )
        .build(),
    );
    this.markAsUnfinished();
  }
}
