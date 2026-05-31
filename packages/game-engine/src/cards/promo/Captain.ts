import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// Captain (Action/Duration/Command): Now and at the start of your next turn:
// Play a non-Duration, non-Command Action card from the Supply costing up to $4, leaving it there.
// Stub: Command cards that play directly from the supply are not yet supported.
export class Captain extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Captain'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    // TODO: Play a non-Duration, non-Command Action ≤$4 from Supply (leaving it there).
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
        .onTurn(ie.createNextTurnEligibilityFunction())
        .withExpiration(ie.createEndOfMyNextTurnEffectExpiration())
        .makeMandatory()
        .action(
          new EffectAction(async (_effectIe: InstructionExecutor) => {
            // TODO: Play a non-Duration, non-Command Action ≤$4 from Supply.
            this.markAsFinished();
          }),
        )
        .build(),
    );
    this.markAsUnfinished();
  }
}
