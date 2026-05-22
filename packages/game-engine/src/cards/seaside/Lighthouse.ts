import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Lighthouse extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Lighthouse'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);
    await ie.addCoins(1);
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
            this.markAsFinished();
          }),
        )
        .build(),
    );
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.ATTACK, EffectSource.OTHER_PLAYER)
        .withExpiration(ie.createStartOfMyNextTurnEffectExpiration())
        .makeMandatory()
        .action(
          new EffectAction((ie: InstructionExecutor, attackCard: Card) => {
            ie.blockAttack(attackCard);
          }),
        )
        .build(),
    );
    this.markAsUnfinished();
  }
}
