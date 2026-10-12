import { CardInfoLookup } from '@dominion/card-info';

import { Project } from '../../card/Project';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { isTreasureCard } from '../../StandardCardEligibilityFunctions';

export class Guildhall extends Project {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Guildhall'));

    // When you gain a Treasure, +1 Coffers.
    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
        .whereCardIs(isTreasureCard)
        .makeMandatory()
        .action(
          new EffectAction((ie: InstructionExecutor) => {
            ie.addCoffers(1);
          }),
        )
        .build(),
    );
  }
}
