import { CardInfoLookup } from '@dominion/card-info';
import { CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { CardEligibilityFunction } from '../../CardEligibilityFunction';

export class WarChest extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('War Chest'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const leftPlayerIe = ie.getSharedGameState().getPlayerLeftOfCurrent().getInstructionExecutor();
    const namedCard: Card | Choice = await leftPlayerIe
      .chooseCard('Choose a card to name for War Chest')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.OTHER)
      .choose();

    if (namedCard instanceof Card) {
      ie.getSharedGameState().markCardAsNamedForWarChestThisTurn(namedCard.getName());
    }

    const notNamedForWarChest = new CardEligibilityFunction(
      (card: Card) =>
        card.getCost().isLessThanOrEqualTo(Cost.Simple(5)) &&
        !ie.getSharedGameState().hasCardBeenNamedForWarChestThisTurn(card.getName()),
    );

    const cardToGain: Card | Choice = await ie
      .chooseCard('Choose a card costing up to $5 that has not been named for War Chest this turn')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(notNamedForWarChest)
      .choose();

    if (cardToGain instanceof Card) {
      ie.getSharedGameState().markCardAsNamedForWarChestThisTurn(cardToGain.getName());
      await ie.gainCardFromPile(cardToGain);
    }
  }
}
