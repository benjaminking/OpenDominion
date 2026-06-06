import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { NoThirdConsecutiveTurnPrecondition } from '../../turns/ExtraTurnPreconditions';

export class Outpost extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Outpost'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addExtraTurn(this, [new NoThirdConsecutiveTurnPrecondition()]);
    ie.setNumCardsToDrawInCleanup(3);
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
        .onTurn(ie.createNextTurnEligibilityFunction())
        .withExpiration(ie.createEndOfMyNextTurnEffectExpiration())
        .makeMandatory()
        .action(
          new EffectAction((_ie: InstructionExecutor, _targetCard: Card) => {
            this.markAsFinished();
          }),
        )
        .build(),
    );
    this.markAsUnfinished();

    return Promise.resolve();
  }
}
