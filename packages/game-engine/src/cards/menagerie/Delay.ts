import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { Event } from '../../card/Event';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isActionCard } from '../../StandardCardEligibilityFunctions';
import { upToNChecked } from '../../StandardNumberEligibilityFunctions';

export class Delay extends Event {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Delay'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    const cards = await ie
      .chooseCards('You may set aside an Action card from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.OTHER)
      .whereCardIs(isActionCard)
      .whereNumCardsIs(upToNChecked(1))
      .choose();

    if (cards.isEmpty()) {
      return;
    }

    const delayed = cards.getArbitraryCard();
    await ie.setCardAsideFromLocation(delayed, CardLocation.HAND);

    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
        .onTurn(ie.createNextTurnEligibilityFunction())
        .withExpiration(ie.createEndOfMyNextTurnEffectExpiration())
        .makeMandatory()
        .action(
          new EffectAction(async (ie2: InstructionExecutor) => {
            if (delayed.getLocation() === CardLocation.SET_ASIDE) {
              await ie2.playCardFromLocation(delayed, CardLocation.SET_ASIDE);
            }
          }),
        )
        .build(),
    );
  }
}
