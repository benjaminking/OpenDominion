import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectCondition } from '../../effects/EffectCondition';
import { EffectContext } from '../../effects/EffectContext';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { both, costsUpTo, isVictoryCard, not } from '../../StandardCardEligibilityFunctions';

// Talisman (Treasure): $1. While this is in play, when you buy a non-Victory card costing up to $4, gain a copy of it.
export class Talisman extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Talisman'));
    this.setCoins(1);
    this.markAsSimpleTreasure();
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(1);
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .onTurn(ie.createThisTurnEligibilityFunction())
        .triggerOn(EffectTriggerType.BUY, EffectSource.SELF)
        .whereCardIs(both(not(isVictoryCard), costsUpTo(Cost.Simple(4))))
        .addCondition(new EffectCondition(() => this.getLocation() === CardLocation.IN_PLAY))
        .withExpiration(ie.createRestOfTurnEffectExpiration())
        .makeMandatory()
        .action(
          new EffectAction(async (effectIe: InstructionExecutor, effectContext: EffectContext) => {
            await effectIe.gainCardFromPile(effectContext.getTargetCard()!.getPileName());
          }),
        )
        .build(),
    );
  }
}
