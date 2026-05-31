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

export class Piazza extends Project {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Piazza'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    // At the start of your turn, reveal the top card of your deck. If it's an Action, play it.
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
        .makeMandatory()
        .action(
          new EffectAction(async (ie: InstructionExecutor) => {
            const topCard: Card | undefined = await ie.lookAtTopCardOfDeck();
            if (topCard === undefined) {
              return;
            }
            await ie.revealCard(topCard);
            if (isActionCard.matches(topCard)) {
              await ie.playCardFromLocation(topCard, topCard.getLocation());
            }
          }),
        )
        .build(),
    );
  }
}
