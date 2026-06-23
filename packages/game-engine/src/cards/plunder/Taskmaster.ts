import { CardInfoLookup } from '@dominion/card-info';
import { Cost } from '../../card/Cost';

import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { costsExactly } from '../../StandardCardEligibilityFunctions';

export class Taskmaster extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Taskmaster'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await this.doTaskmasterAbility(ie);
  }

  private async doTaskmasterAbility(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);
    await ie.addCoins(1);

    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .onTurn(ie.createThisTurnEligibilityFunction())
        .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
        .whereCardIs(costsExactly(Cost.Simple(5)))
        .withExpiration(ie.createOnceThisTurnEffectExpiration())
        .makeMandatory()
        .action(
          new EffectAction((effectIe: InstructionExecutor) => {
            effectIe.addEffect(
              new Effect.Builder()
                .from(this)
                .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
                .onTurn(effectIe.createNextTurnEligibilityFunction())
                .withExpiration(effectIe.createEndOfMyNextTurnEffectExpiration())
                .makeMandatory()
                .action(
                  new EffectAction(async (nextTurnIe: InstructionExecutor) => {
                    this.markAsFinished();
                    await this.doTaskmasterAbility(nextTurnIe);
                  }),
                )
                .build(),
            );
            this.markAsUnfinished();
          }),
        )
        .build(),
    );
  }
}
