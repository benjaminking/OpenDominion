import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { costsUpTo, not, isTreasureCard } from '../../StandardCardEligibilityFunctions';

export class Hermit extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Hermit'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const discardCards = await ie
      .chooseCard('You may trash a non-Treasure card from your discard pile')
      .from(CardLocation.DISCARD)
      .to(CardSelectionPurpose.TRASH)
      .whereCardIs(not(isTreasureCard))
      .allowNoneOption()
      .choose();
    if (discardCards instanceof Card) {
      await ie.trashCardFromLocation(discardCards, CardLocation.DISCARD);
    } else {
      const handCard: Card | Choice = await ie
        .chooseCard('You may trash a non-Treasure card from your hand')
        .from(CardLocation.HAND)
        .to(CardSelectionPurpose.TRASH)
        .whereCardIs(not(isTreasureCard))
        .allowNoneOption()
        .choose();
      if (handCard instanceof Card) {
        await ie.trashCardFromLocation(handCard, CardLocation.HAND);
      }
    }

    const cardToGain: Card | Choice = await ie
      .chooseCard('Gain a card costing up to $3')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(costsUpTo(Cost.Simple(3)))
      .allowNoneOption()
      .choose();
    if (cardToGain instanceof Card) {
      await ie.gainCardFromPile(cardToGain);
    }

    // At end of buy phase this turn, if no cards gained during buy phase, exchange for Madman
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.BUY_END, EffectSource.SELF)
        .onTurn(ie.createThisTurnEligibilityFunction())
        .withExpiration(ie.createOnceThisTurnEffectExpiration())
        .makeMandatory()
        .action(
          new EffectAction(async (ie: InstructionExecutor) => {
            // TODO: exchangeCardForMadman checks whether any cards were gained in the buy phase
            await ie.exchangeCardForMadman(this);
          }),
        )
        .build(),
    );
  }
}
