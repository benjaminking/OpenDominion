import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectCondition } from '../../effects/EffectCondition';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { isActionCard } from '../../StandardCardEligibilityFunctions';

export class HarborVillage extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Harbor Village'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(2);

    const coinsBeforeNextAction = ie.getCoins();
    const actionsPlayedSoFar = ie.numMatchingCardsPlayedThisTurn(isActionCard);

    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .onTurn(ie.createThisTurnEligibilityFunction())
        .triggerOn(EffectTriggerType.PLAYED_CARD, EffectSource.SELF)
        .whereCardIs(isActionCard)
        .withExpiration(ie.createOnceThisTurnEffectExpiration())
        .addCondition(
          new EffectCondition(
            (effectIe: InstructionExecutor) =>
              effectIe.numMatchingCardsPlayedThisTurn(isActionCard) === actionsPlayedSoFar + 1,
          ),
        )
        .makeMandatory()
        .action(
          new EffectAction(async (effectIe: InstructionExecutor) => {
            if (effectIe.getCoins() > coinsBeforeNextAction) {
              await effectIe.addCoins(1);
            }
          }),
        )
        .build(),
    );
  }
}
