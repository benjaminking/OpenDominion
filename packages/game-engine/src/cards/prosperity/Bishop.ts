import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Bishop extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Bishop'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(1);
    ie.addVP(1);

    const cardToTrash: Card | Choice = await ie
      .chooseCard('Choose a card to trash')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .choose();

    if (cardToTrash instanceof Card) {
      const trashedCard: Card | undefined = await ie.trashCardFromLocation(cardToTrash, CardLocation.HAND);
      if (trashedCard !== undefined) {
        ie.addVP(Math.floor(trashedCard.getCost().coins / 2));
      }
    }

    await ie.eachOtherPlayer(async (otherIe: InstructionExecutor) => {
      const otherCardToTrash: Card | Choice = await otherIe
        .chooseCard('You may trash a card from your hand')
        .from(CardLocation.HAND)
        .to(CardSelectionPurpose.TRASH)
        .allowNoneOption()
        .choose();

      if (otherCardToTrash instanceof Card) {
        await otherIe.trashCardFromLocation(otherCardToTrash, CardLocation.HAND);
      }
    });
  }
}
