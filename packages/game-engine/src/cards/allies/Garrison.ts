import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Garrison extends KingdomCard {
  private tokens = 0;

  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Garrison'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addCoins(2);

    this.tokens = 0;
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
        .onTurn(ie.createThisTurnEligibilityFunction())
        .withExpiration(ie.createRestOfTurnEffectExpiration())
        .makeMandatory()
        .action(
          new EffectAction(() => {
            this.tokens++;
          }),
        )
        .build(),
    );

    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
        .onTurn(ie.createNextTurnEligibilityFunction())
        .withExpiration(ie.createEndOfMyNextTurnEffectExpiration())
        .makeMandatory()
        .action(
          new EffectAction(async (ie2: InstructionExecutor) => {
            if (this.tokens > 0) {
              await ie2.drawCards(this.tokens);
              this.tokens = 0;
            }
            this.markAsFinished();
          }),
        )
        .build(),
    );
    this.markAsUnfinished();
  }
}
