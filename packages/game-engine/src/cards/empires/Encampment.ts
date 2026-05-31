import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { cardNameIs, either } from '../../StandardCardEligibilityFunctions';

export class Encampment extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Encampment'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(2);
    ie.addActions(2);
    const cardToReveal: Card | Choice = await ie
      .chooseCard('You may reveal a Gold or Plunder from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.OTHER)
      .whereCardIs(either(cardNameIs('Gold'), cardNameIs('Plunder')))
      .allowNoneOption()
      .choose();
    if (cardToReveal instanceof Card) {
      await ie.revealCard(cardToReveal);
    } else {
      // If you don't reveal, set this card aside and return it to its pile at start of cleanup
      // TODO: return to pile mechanic not implemented; card is set aside instead
      await ie.setCardAsideFromLocation(this, CardLocation.IN_PLAY);
    }
  }
}
