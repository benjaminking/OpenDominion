import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import {
  both,
  cardNameIs,
  isDurationCard,
  isTheSameCardAs,
  isTreasureCard,
  not,
} from '../../StandardCardEligibilityFunctions';

export class Mint extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Mint'));
    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
        // Wherever this Mint is now, e.g. back in the Supply after Trader exchanged it, it was still gained
        .whereCardIs(isTheSameCardAs(this))
        .makeMandatory()
        .action(
          new EffectAction(async (ie: InstructionExecutor) => {
            const treasuresInPlay = ie.getMatchingCardsInPlay(both(isTreasureCard, not(isDurationCard)));
            await ie.trashCardsFromLocation(treasuresInPlay, CardLocation.IN_PLAY);
          }),
        )
        .build(),
    );
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const revealedTreasure: Card | Choice = await ie
      .chooseCard('You may reveal a Treasure card from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.OTHER)
      .whereCardIs(isTreasureCard)
      .allowNoneOption()
      .choose();

    if (revealedTreasure instanceof Card) {
      await ie.revealCard(revealedTreasure);
      // The copy comes from the Supply, so e.g. revealing a Spoils gains nothing
      const supplyTopCards = ie.getSharedGameState().piles.getTopCardsOfSupplyPiles();
      if (supplyTopCards.hasMatchingCard(cardNameIs(revealedTreasure.getName()))) {
        await ie.gainCardFromPile(revealedTreasure);
      }
    }
  }
}
