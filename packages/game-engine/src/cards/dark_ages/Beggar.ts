import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectCondition } from '../../effects/EffectCondition';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Beggar extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Beggar'));
    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.ATTACK, EffectSource.OTHER_PLAYER)
        .addCondition(new EffectCondition(() => this.getLocation() === CardLocation.HAND))
        .action(
          new EffectAction(async (ie: InstructionExecutor) => {
            const discarded = await ie.discardCardFromLocation(this, CardLocation.HAND);
            if (discarded !== undefined) {
              await ie.gainFromPile('silver', CardLocation.DECK);
              await ie.gainFromPile('silver');
            }
          }),
        )
        .build(),
    );
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.gainFromPile('copper', CardLocation.HAND);
    await ie.gainFromPile('copper', CardLocation.HAND);
    await ie.gainFromPile('copper', CardLocation.HAND);
  }
}
