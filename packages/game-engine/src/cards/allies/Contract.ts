import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isActionCard } from '../../StandardCardEligibilityFunctions';
import { upToNChecked } from '../../StandardNumberEligibilityFunctions';

export class Contract extends KingdomCard {
  private setAsideAction?: Card;

  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Contract'));
    this.setCoins(2);
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addCoins(2);
    ie.addFavors(1);

    this.setAsideAction = undefined;
    await ie
      .chooseOneOption('You may set aside an Action from your hand to play it at start of your next turn')
      .from(
        new ActionChoice('Set aside an Action', async () => {
          const cards = await ie
            .chooseCards('Choose an Action card to set aside')
            .from(CardLocation.HAND)
            .to(CardSelectionPurpose.OTHER)
            .whereCardIs(isActionCard)
            .whereNumCardsIs(upToNChecked(1))
            .choose();
          if (!cards.isEmpty()) {
            const action = cards.getArbitraryCard();
            await ie.setCardAsideFromLocation(action, CardLocation.HAND);
            this.setAsideAction = action;
          }
        }),
      )
      .from(new ActionChoice('Skip', async () => Promise.resolve()))
      .choose();

    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
        .onTurn(ie.createNextTurnEligibilityFunction())
        .withExpiration(ie.createEndOfMyNextTurnEffectExpiration())
        .makeMandatory()
        .action(
          new EffectAction(async (ie2: InstructionExecutor) => {
            if (this.setAsideAction !== undefined && this.setAsideAction.getLocation() === CardLocation.SET_ASIDE) {
              await ie2.playCardFromLocation(this.setAsideAction, CardLocation.SET_ASIDE);
            }
            this.markAsFinished();
          }),
        )
        .build(),
    );
    this.markAsUnfinished();
  }
}
