import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { costsUpTo, isVictoryCard } from '../../StandardCardEligibilityFunctions';

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
        .triggerOn(EffectTriggerType.BUY, EffectSource.SELF)
        .onTurn(ie.createThisTurnEligibilityFunction())
        .withExpiration(ie.createStartOfMyNextTurnEffectExpiration())
        .action(
          new EffectAction(async (effectIe: InstructionExecutor, boughtCards: CardCollection) => {
            for (const bought of boughtCards) {
              if (!isVictoryCard.matches(bought) && costsUpTo(Cost.Simple(4)).matches(bought)) {
                await effectIe.gainCardFromPile(bought.getPileName());
              }
            }
          }),
        )
        .build(),
    );
  }
}
