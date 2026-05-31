import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { Project } from '../../card/Project';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isActionCard } from '../../StandardCardEligibilityFunctions';

export class Innovation extends Project {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Innovation'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    // Once during each of your turns, when you gain an Action card, you may play it.
    // "Once per turn" is not yet enforced; the effect fires for every gained Action.
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
        .whereCardIs(isActionCard)
        .action(
          new EffectAction(async (ie: InstructionExecutor, card: Card) => {
            await ie.playCardFromLocation(card, card.getLocation());
          }),
        )
        .build(),
    );
  }
}
