import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { upToNChecked } from '../../StandardNumberEligibilityFunctions';

// Church (Action/Duration): +1 Action. Set aside up to 3 cards from your hand face down.
// At the start of your next turn, put them into your hand, then you may trash a card from your hand.
export class Church extends KingdomCard {
  private setAsideCards: CardCollection = new CardCollection();

  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Church'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);
    const cardsToSetAside: CardCollection = await ie
      .chooseCards('Set aside up to 3 cards from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.OTHER)
      .whereNumCardsIs(upToNChecked(3))
      .choose();
    this.setAsideCards = new CardCollection();
    for (const card of cardsToSetAside) {
      await ie.setCardAsideFromLocation(card, CardLocation.HAND);
      this.setAsideCards.addCard(card);
    }
    if (this.setAsideCards.size() > 0) {
      ie.addEffect(
        new Effect.Builder()
          .from(this)
          .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
          .onTurn(ie.createNextTurnEligibilityFunction())
          .withExpiration(ie.createEndOfMyNextTurnEffectExpiration())
          .makeMandatory()
          .action(
            new EffectAction(async (effectIe: InstructionExecutor) => {
              for (const card of this.setAsideCards) {
                effectIe.putCardIntoHandFromLocation(card, CardLocation.SET_ASIDE);
              }
              const cardToTrash: Card | Choice = await effectIe
                .chooseCard('You may trash a card from your hand')
                .from(CardLocation.HAND)
                .to(CardSelectionPurpose.TRASH)
                .allowNoneOption()
                .choose();
              if (cardToTrash instanceof Card) {
                await effectIe.trashCardFromLocation(cardToTrash, CardLocation.HAND);
              }
              this.markAsFinished();
            }),
          )
          .build(),
      );
      this.markAsUnfinished();
    }
  }
}
