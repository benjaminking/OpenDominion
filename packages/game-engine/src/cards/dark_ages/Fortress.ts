import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectContext } from '../../effects/EffectContext';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { isTheSameCardAs } from '../../StandardCardEligibilityFunctions';

export class Fortress extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Fortress'));
    // When you trash this, put it into your hand
    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TRASH)
        .self()
        .whereCardIs(isTheSameCardAs(this))
        .makeMandatory()
        .action(
          new EffectAction((ie: InstructionExecutor, effectContext: EffectContext) => {
            // Once something else has moved it out of the trash, it has lost track of itself
            if (!effectContext.getLocationExpectation()!.isMet(this)) {
              ie.sendLostTrackMessage(this);
              return;
            }
            ie.putCardIntoHandFromLocation(this, CardLocation.TRASH);
          }),
        )
        .build(),
    );
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(2);
  }
}
