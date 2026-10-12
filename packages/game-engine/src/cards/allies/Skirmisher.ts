import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { isAttackCard } from '../../StandardCardEligibilityFunctions';

export class Skirmisher extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Skirmisher'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);
    ie.addCoins(1);

    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
        .onTurn(ie.createThisTurnEligibilityFunction())
        .whereCardIs(isAttackCard)
        .withExpiration(ie.createRestOfTurnEffectExpiration())
        .makeMandatory()
        .action(
          new EffectAction(async (effectIe: InstructionExecutor) => {
            await effectIe.eachOtherPlayer(async (otherIe: InstructionExecutor) => {
              await otherIe.discardDownTo(3);
            });
          }),
        )
        .build(),
    );
  }
}
