import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectContext } from '../../effects/EffectContext';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { either, isActionCard, isTreasureCard } from '../../StandardCardEligibilityFunctions';

export class Gatekeeper extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Gatekeeper'));
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
          new EffectAction(async (ie2: InstructionExecutor) => {
            ie2.addCoins(3);
            this.markAsFinished();
          }),
        )
        .build(),
    );

    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.OTHER_GAIN, EffectSource.OTHER_PLAYER)
        .onTurn(ie.createThisTurnEligibilityFunction())
        .whereCardIs(either(isActionCard, isTreasureCard))
        .action(
          new EffectAction(async (ie2: InstructionExecutor, effectContext: EffectContext) => {
            const gained = effectContext.getTargetCard()!;
            if (ie2.hasExiledCopy(gained.getName())) {
              return;
            }
            if (!effectContext.getLocationExpectation()!.isMet(gained)) {
              ie2.sendLostTrackMessage(gained);
              return;
            }
            await ie2.exileCardFromLocation(gained, gained.getLocation());
          }),
        )
        .build(),
    );

    this.markAsUnfinished();
  }
}
