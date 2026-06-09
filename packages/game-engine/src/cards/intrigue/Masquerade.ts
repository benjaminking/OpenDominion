import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Masquerade extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Masquerade'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(2);
    await ie.eachPlayerPassesACardToTheLeft();
    const cardToTrash: Card | Choice = await ie
      .chooseCard('You may trash a card from your hand.')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .allowNoneOption()
      .choose();

    if (cardToTrash instanceof Card) {
      await ie.trashCardFromLocation(cardToTrash, CardLocation.HAND);
    }
  }
}
