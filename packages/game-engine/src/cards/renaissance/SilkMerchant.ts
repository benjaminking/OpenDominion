import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isACopyOf } from '../../StandardCardEligibilityFunctions';

export class SilkMerchant extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Silk Merchant'));

    // When you gain or trash this, +1 Coffers and +1 Villager.
    const gainOrTrashBonus = new EffectAction((ie: InstructionExecutor) => {
      ie.addCoffers(1);
      ie.addVillagers(1);
    });

    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
        .whereCardIs(isACopyOf(this))
        .action(gainOrTrashBonus)
        .build(),
    );

    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TRASH, EffectSource.SELF)
        .whereCardIs(isACopyOf(this))
        .action(gainOrTrashBonus)
        .build(),
    );
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(2);
    ie.addBuys(1);
  }
}
