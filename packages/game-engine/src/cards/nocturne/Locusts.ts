import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { Hex } from '../../card/Hex';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { cardNameIs, costsUpTo, either } from '../../StandardCardEligibilityFunctions';
import { Cost } from '../../card/Cost';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

// Locusts: Trash the top card of your deck. If it's Copper or Estate, gain a Curse.
// Otherwise, gain a cheaper card that shares a type with it.
export class Locusts extends Hex {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Locusts'));
  }

  public async receive(ie: InstructionExecutor): Promise<void> {
    const trashedCard: Card | undefined = await ie.trashTopCardOfDeck();
    if (trashedCard === undefined) {
      return;
    }
    if (either(cardNameIs('Copper'), cardNameIs('Estate')).matches(trashedCard)) {
      await ie.gainCardFromPile('Curse');
    } else {
      // TODO: gain a cheaper card that shares a type with trashedCard (type-matching eligibility not yet supported)
      const cheaperCard: Card | Choice = await ie
        .chooseCard('Gain a cheaper card that shares a type with ' + trashedCard.getName())
        .from(CardSelectionLocation.SUPPLY)
        .to(CardSelectionPurpose.GAIN)
        .whereCardIs(costsUpTo(Cost.Simple(Math.max(0, trashedCard.getCost().coins - 1))))
        .allowNoneOption()
        .choose();
      if (cheaperCard instanceof Card) {
        await ie.gainCardFromPile(cheaperCard);
      }
    }
  }
}
