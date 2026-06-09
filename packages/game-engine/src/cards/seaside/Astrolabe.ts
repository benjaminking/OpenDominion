import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Astrolabe extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Astrolabe'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(1);
    ie.addBuys(1);
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
        .onTurn(ie.createNextTurnEligibilityFunction())
        .withExpiration(ie.createEndOfMyNextTurnEffectExpiration())
        .makeMandatory()
        .action(
          new EffectAction(async (ie: InstructionExecutor, _targetCard: Card) => {
            await ie.addCoins(1);
            ie.addBuys(1);
            this.markAsFinished();
          }),
        )
        .build(),
    );
    this.markAsUnfinished();
  }
}
