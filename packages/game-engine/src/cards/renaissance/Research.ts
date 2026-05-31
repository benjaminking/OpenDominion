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

export class Research extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Research'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);

    const cardToTrash: Card | Choice = await ie
      .chooseCard('Choose a card from your hand to trash')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .allowNoneOption()
      .choose();
    if (!(cardToTrash instanceof Card)) {
      return;
    }
    const trashed = await ie.trashCardFromLocation(cardToTrash, CardLocation.HAND);
    if (trashed === undefined) {
      return;
    }

    // Set aside one card from deck per $1 the trashed card costs (face down).
    const cost = trashed.getCost().coins;
    const setAsideCards: Card[] = [];
    for (let i = 0; i < cost; i++) {
      const topCard = await ie.takeCardOffDeck();
      if (topCard !== undefined) {
        ie.setCardAside(topCard, /* hidden= */ true);
        setAsideCards.push(topCard);
      }
    }

    // At the start of your next turn, put those cards into hand.
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
        .onTurn(ie.createNextTurnEligibilityFunction())
        .withExpiration(ie.createEndOfMyNextTurnEffectExpiration())
        .makeMandatory()
        .action(
          new EffectAction((ie: InstructionExecutor) => {
            ie.putCardsIntoHand(CardCollection.fromCards(setAsideCards));
            this.markAsFinished();
          }),
        )
        .build(),
    );

    this.markAsUnfinished();
  }
}
