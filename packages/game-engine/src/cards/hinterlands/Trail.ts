import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectContext } from '../../effects/EffectContext';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { isNotCleanup } from '../../effects/StandardEffectConditions';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { isTheSameCardAs } from '../../StandardCardEligibilityFunctions';

export class Trail extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Trail'));

    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
        .whereCardIs(isTheSameCardAs(this))
        .addCondition(isNotCleanup)
        .action(new EffectAction(this.reaction.bind(this)))
        .build(),
    );
    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TRASH, EffectSource.SELF)
        .whereCardIs(isTheSameCardAs(this))
        .addCondition(isNotCleanup)
        .action(new EffectAction(this.reaction.bind(this)))
        .build(),
    );
    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.DISCARD, EffectSource.SELF)
        .whereCardIs(isTheSameCardAs(this))
        .addCondition(isNotCleanup)
        .action(new EffectAction(this.reaction.bind(this)))
        .build(),
    );
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);
  }

  // Once something else has moved it since it was gained, trashed or discarded (e.g. Watchtower trashing it, or
  // another discarded Trail's +1 Card shuffling it into the deck), it has lost track of itself
  private async reaction(ie: InstructionExecutor, effectContext: EffectContext): Promise<void> {
    if (!effectContext.getLocationExpectation()!.isMet(this)) {
      ie.sendLostTrackMessage(this);
      return;
    }
    await ie.playCardFromLocation(this, this.getLocation());
  }
}
