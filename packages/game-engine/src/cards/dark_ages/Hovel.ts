import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { Card } from '../../card/Card';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectCondition } from '../../effects/EffectCondition';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isVictoryCard } from '../../StandardCardEligibilityFunctions';

export class Hovel extends Card {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Hovel'));
    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
        .whereCardIs(isVictoryCard)
        .addCondition(new EffectCondition(() => this.getLocation() === CardLocation.HAND))
        .action(
          new EffectAction(async (ie: InstructionExecutor) => {
            await ie.trashCardFromLocation(this, CardLocation.HAND);
          }),
        )
        .build(),
    );
  }
}
