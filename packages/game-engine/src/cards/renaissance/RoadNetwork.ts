import { CardInfoLookup } from '@dominion/card-info';

import { Project } from '../../card/Project';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { isVictoryCard } from '../../StandardCardEligibilityFunctions';

export class RoadNetwork extends Project {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Road Network'));

    // When another player gains a Victory card, +1 Card.
    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.OTHER_GAIN, EffectSource.OTHER_PLAYER)
        .whereCardIs(isVictoryCard)
        .makeMandatory()
        .action(
          new EffectAction(async (ie: InstructionExecutor) => {
            await ie.drawCards(1);
          }),
        )
        .build(),
    );
  }
}
