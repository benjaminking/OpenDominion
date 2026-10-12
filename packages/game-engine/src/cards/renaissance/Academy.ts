import { CardInfoLookup } from '@dominion/card-info';

import { Project } from '../../card/Project';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { isActionCard } from '../../StandardCardEligibilityFunctions';

export class Academy extends Project {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Academy'));

    // When you gain an Action card, +1 Villager.
    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
        .whereCardIs(isActionCard)
        .makeMandatory()
        .action(
          new EffectAction((ie: InstructionExecutor) => {
            ie.addVillagers(1);
          }),
        )
        .build(),
    );
  }
}
