import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { cardNameIs } from '../../StandardCardEligibilityFunctions';

// Avanto: +3 Cards. You may play a Sauna from your hand.
export class Avanto extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Avanto'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(3);
    const sauna: Card | Choice = await ie
      .chooseCard('You may play a Sauna from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.PLAY_ALT)
      .whereCardIs(cardNameIs('Sauna'))
      .allowNoneOption()
      .choose();
    if (sauna instanceof Card) {
      await ie.playCardFromLocation(sauna, CardLocation.HAND);
    }
  }
}
