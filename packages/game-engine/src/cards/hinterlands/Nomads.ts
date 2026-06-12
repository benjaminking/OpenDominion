import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { isTheSameCardAs } from '../../StandardCardEligibilityFunctions';

export class Nomads extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Nomads'));

    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
        .whereCardIs(isTheSameCardAs(this))
        .makeMandatory()
        .action(new EffectAction((ie: InstructionExecutor) => ie.addCoins(2)))
        .build(),
    );
    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TRASH, EffectSource.SELF)
        .whereCardIs(isTheSameCardAs(this))
        .makeMandatory()
        .action(new EffectAction((ie: InstructionExecutor) => ie.addCoins(2)))
        .build(),
    );
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addBuys(1);
    await ie.addCoins(2);
  }
}
