import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectCondition } from '../../effects/EffectCondition';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Capital extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Capital'));
    this.markAsSimpleTreasure();
    this.setCoins(6);

    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.CLEANUP_START, EffectSource.SELF)
        .makeMandatory()
        .addCondition(new EffectCondition(() => this.getLocation() === CardLocation.IN_PLAY))
        .action(
          new EffectAction((ie: InstructionExecutor) => {
            ie.addDebt(6);
          }),
        )
        .build(),
    );
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(6);
    ie.addBuys(1);
  }
}
