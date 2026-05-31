import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, CardType } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardEligibilityFunction } from '../../CardEligibilityFunction';
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

class IsNotDurationCard extends CardEligibilityFunction {
  constructor() {
    super((card: Card) => !card.hasType(CardType.DURATION));
  }
}

const isNotDurationCard = new IsNotDurationCard();

export class RoyalGalley extends KingdomCard {
  private replayCard?: Card;

  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Royal Galley'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);

    const choice = await ie
      .chooseCards('You may play a non-Duration Action card from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.PLAY)
      .whereCardIs(isActionCard)
      .whereCardIs(isNotDurationCard)
      .whereNumCardsIs(upToNChecked(1))
      .choose();

    if (!choice.isEmpty()) {
      const card = choice.getArbitraryCard();
      await ie.playCardFromHand(card);
      card.markAsUnfinished();
      this.replayCard = card;
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
            if (this.replayCard !== undefined && this.replayCard.getLocation() === CardLocation.IN_PLAY) {
              await ie2.replayCardInPlay(this.replayCard);
              this.replayCard.markAsFinished();
            }
            this.markAsFinished();
          }),
        )
        .build(),
    );
    this.markAsUnfinished();
  }
}
