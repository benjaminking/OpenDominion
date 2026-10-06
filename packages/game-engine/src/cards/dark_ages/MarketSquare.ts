import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectCondition } from '../../effects/EffectCondition';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class MarketSquare extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Market Square'));
    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TRASH, EffectSource.SELF)
        .addCondition(new EffectCondition(() => this.getLocation() === CardLocation.HAND))
        .action(
          new EffectAction(async (ie: InstructionExecutor) => {
            const discardedCard = await ie.discardCardFromLocation(this, CardLocation.HAND);
            if (discardedCard !== undefined) {
              await ie.gainFromPile('gold');
            }
          }),
        )
        .build(),
    );
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);
    ie.addBuys(1);
  }
}
