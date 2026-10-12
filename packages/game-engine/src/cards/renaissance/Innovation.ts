import { CardInfoLookup } from '@dominion/card-info';

import { Project } from '../../card/Project';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectContext } from '../../effects/EffectContext';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { isActionCard } from '../../StandardCardEligibilityFunctions';

export class Innovation extends Project {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Innovation'));

    // Once during each of your turns, when you gain an Action card, you may play it.
    // "Once per turn" is not yet enforced; the effect fires for every gained Action.
    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
        .whereCardIs(isActionCard)
        .action(
          new EffectAction(async (ie: InstructionExecutor, effectContext: EffectContext) => {
            const gainedCard = effectContext.getTargetCard()!;
            if (!effectContext.getLocationExpectation()!.isMet(gainedCard)) {
              ie.sendLostTrackMessage(gainedCard);
              return;
            }
            await ie.playCardFromLocation(gainedCard, effectContext.getGainLocation()!);
          }),
        )
        .build(),
    );
  }
}
