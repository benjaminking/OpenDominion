import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class FishingVillage extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Fishing Village'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(2);
    await ie.addCoins(1);
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
        .makeMandatory()
        .action(
          new EffectAction(async (ie: InstructionExecutor) => {
            ie.addActions(1);
            await ie.addCoins(1);
            this.markAsFinished();
          }),
        )
        .build(),
    );
    this.markAsUnfinished();
  }
}
