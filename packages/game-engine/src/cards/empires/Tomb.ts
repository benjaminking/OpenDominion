import { CardInfoLookup } from '@dominion/card-info';

import { CardCollection } from '../../card/CardCollection';
import { Landmark } from '../../card/Landmark';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Tomb extends Landmark {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Tomb'));

    // When you trash a card: +1 VP
    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TRASH, EffectSource.SELF)
        .makeMandatory()
        .makeMultiple()
        .action(
          new EffectAction((ie: InstructionExecutor) => {
            ie.addVP(1);
          }),
        )
        .build(),
    );
  }

  score(_allCardGroups: CardCollection[]): number {
    return 0;
  }
}
