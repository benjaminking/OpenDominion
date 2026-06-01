import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { Event } from '../../card/Event';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Reap extends Event {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Reap'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    const gold = await ie.gainCardFromPile('Gold', CardLocation.SET_ASIDE);
    if (gold === undefined) {
      return;
    }

    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
        .onTurn(ie.createNextTurnEligibilityFunction())
        .withExpiration(ie.createEndOfMyNextTurnEffectExpiration())
        .makeMandatory()
        .action(
          new EffectAction(async (ie2: InstructionExecutor) => {
            if (gold.getLocation() === CardLocation.SET_ASIDE) {
              await ie2.playCardFromLocation(gold, CardLocation.SET_ASIDE);
            }
          }),
        )
        .build(),
    );
  }
}
