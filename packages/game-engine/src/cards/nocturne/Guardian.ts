import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// Guardian (Night/Duration): At the start of your next turn, +$1.
// Until then, when another player plays an Attack, it doesn't affect you.
export class Guardian extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Guardian'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
        .onTurn(ie.createNextTurnEligibilityFunction())
        .withExpiration(ie.createEndOfMyNextTurnEffectExpiration())
        .makeMandatory()
        .action(
          new EffectAction(async (effectIe: InstructionExecutor) => {
            await effectIe.addCoins(1);
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
          new EffectAction((_effectIe: InstructionExecutor, attackCard: Card) => {
            _effectIe.blockAttack(attackCard);
          }),
        )
        .build(),
    );
    this.markAsUnfinished();
  }
}
