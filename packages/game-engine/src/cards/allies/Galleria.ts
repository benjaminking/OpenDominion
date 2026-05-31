import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { costsBetween } from '../../StandardCardEligibilityFunctions';

export class Galleria extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Galleria'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addCoins(3);
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
        .onTurn(ie.createThisTurnEligibilityFunction())
        .where(costsBetween(Cost.Simple(3), Cost.Simple(4)))
        .action(
          new EffectAction((ie2: InstructionExecutor, _gainedCard: Card) => {
            ie2.addBuys(1);
          }),
        )
        .build(),
    );
  }
}
