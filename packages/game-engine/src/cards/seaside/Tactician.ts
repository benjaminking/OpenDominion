import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Tactician extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Tactician'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const discardedCards = await ie.discardHand();
    if (discardedCards.size() >= 1) {
      ie.addEffect(
        new Effect.Builder()
          .from(this)
          .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
          .onTurn(ie.createNextTurnEligibilityFunction())
          .withExpiration(ie.createEndOfMyNextTurnEffectExpiration())
          .makeMandatory()
          .action(
            new EffectAction(async (ie: InstructionExecutor) => {
              await ie.drawCards(5);
              ie.addActions(1);
              ie.addBuys(1);
              this.markAsFinished();
            }),
          )
          .build(),
      );
      this.markAsUnfinished();
    }
  }
}
