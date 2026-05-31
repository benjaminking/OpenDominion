import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { KingdomCard } from '../../card/KingdomCard';
import { CostModifier } from '../../effects/CostModifier';
import { CoinCostReduction } from '../../effects/StandardCostChangeFunctions';
import { ThisTurnEligibility } from '../../effects/StandardTurnEligibilityFunctions';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';

export class BridgeTroll extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Bridge Troll'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    // Attack: each other player takes their -$1 token
    await ie.performAttack(this, async (attackedPlayer: Player) => {
      const attackedIe = attackedPlayer.getInstructionExecutor();
      attackedIe.giveMinusDollarToken(attackedPlayer);
    });

    // Cards cost $1 less this turn and next turn
    this.sharedGameState.addCostModifier(
      new CostModifier.Builder()
        .setTurnEligibility(new ThisTurnEligibility(this.sharedGameState))
        .setCostChangeFunction(new CoinCostReduction(1))
        .build(),
    );

    // +1 Buy now and at the start of next turn
    ie.addBuys(1);

    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
        .onTurn(ie.createNextTurnEligibilityFunction())
        .withExpiration(ie.createEndOfMyNextTurnEffectExpiration())
        .makeMandatory()
        .action(
          new EffectAction(async (ie: InstructionExecutor) => {
            ie.addBuys(1);
            this.sharedGameState.addCostModifier(
              new CostModifier.Builder()
                .setTurnEligibility(new ThisTurnEligibility(this.sharedGameState))
                .setCostChangeFunction(new CoinCostReduction(1))
                .build(),
            );
            this.markAsFinished();
          }),
        )
        .build(),
    );
    this.markAsUnfinished();
  }
}
