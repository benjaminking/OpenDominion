import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { cardNameIs, isTheSameCardAs, not } from '../../StandardCardEligibilityFunctions';

export class Rats extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Rats'));
    // When you trash this, +1 Card
    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TRASH)
        .self()
        .whereCardIs(isTheSameCardAs(this))
        .makeMandatory()
        .action(
          new EffectAction(async (ie: InstructionExecutor) => {
            await ie.drawCards(1);
          }),
        )
        .build(),
    );
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);
    await ie.gainFromPile('rats');

    const hasNonRats = ie.hasMatchingCardInHand(not(cardNameIs('Rats')));
    if (hasNonRats) {
      const cardToTrash: Card | Choice = await ie
        .chooseCard('Trash a non-Rats card from your hand')
        .from(CardLocation.HAND)
        .to(CardSelectionPurpose.TRASH)
        .whereCardIs(not(cardNameIs('Rats')))
        .choose();
      if (cardToTrash instanceof Card) {
        await ie.trashCardFromLocation(cardToTrash, CardLocation.HAND);
      }
    } else {
      // All Rats hand - reveal it
      await ie.revealHand();
    }
  }
}
