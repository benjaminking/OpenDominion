import { CardInfoLookup } from '@dominion/card-info';

import { CardCollection } from '../../card/CardCollection';
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

export class Tunnel extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Tunnel'));

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

  public score(_allCardGroups: CardCollection[]): number {
    return 2;
  }

  // Once it has moved since it was discarded (e.g. shuffled into the deck by a discarded Trail's +1 Card), it has lost
  // track of itself, so it can't be revealed to gain a Gold
  private async reaction(ie: InstructionExecutor, effectContext: EffectContext): Promise<void> {
    if (!effectContext.getLocationExpectation()!.isMet(this)) {
      ie.sendLostTrackMessage(this);
      return;
    }
    await ie.revealCard(this);
    await ie.gainCardFromPile('Gold');
  }
}
