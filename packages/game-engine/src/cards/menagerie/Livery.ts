import { CardInfoLookup } from '@dominion/card-info';

import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { costsAtLeast } from '../../StandardCardEligibilityFunctions';

export class Livery extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Livery'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addCoins(3);

    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
        .onTurn(ie.createThisTurnEligibilityFunction())
        .whereCardIs(costsAtLeast(Cost.Simple(4)))
        .action(
          new EffectAction(async (ie2: InstructionExecutor) => {
            await ie2.gainHorse(1);
          }),
        )
        .build(),
    );
  }
}
