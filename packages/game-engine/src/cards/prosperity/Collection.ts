import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { RestOfTurnEffectExpiration } from '../../effects/StandardEffectExpirations';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { isActionCard } from '../../StandardCardEligibilityFunctions';

export class Collection extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Collection'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(2);
    ie.addBuys(1);

    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .onTurn(ie.createThisTurnEligibilityFunction())
        .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
        .whereCardIs(isActionCard)
        .withExpiration(new RestOfTurnEffectExpiration(ie.getSharedGameState().getCurrentTurn()))
        .makeMandatory()
        .action(
          new EffectAction((effectIe: InstructionExecutor) => {
            effectIe.addVP(1);
          }),
        )
        .build(),
    );
  }
}
