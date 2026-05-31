import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isACopyOf } from '../../StandardCardEligibilityFunctions';

export class FlagBearer extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Flag Bearer'));

    // When you gain this, take the Flag.
    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
        .whereCardIs(isACopyOf(this))
        .action(
          new EffectAction((ie: InstructionExecutor) => {
            ie.takeArtifact('Flag');
          }),
        )
        .build(),
    );

    // When you lose this (i.e. trash it), return the Flag.
    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TRASH, EffectSource.SELF)
        .whereCardIs(isACopyOf(this))
        .action(
          new EffectAction((ie: InstructionExecutor) => {
            if (ie.hasArtifact('Flag')) {
              ie.returnArtifact('Flag');
            }
          }),
        )
        .build(),
    );
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(2);
  }
}
