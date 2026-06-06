import { CardInfoLookup } from '@dominion/card-info';
import { CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { CardEligibilityFunction } from '../../CardEligibilityFunction';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class WarChest extends KingdomCard {
  private static readonly namedCardsByTurnNumber = new Map<number, Set<string>>();

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
      WarChest.addNamedCardForCurrentTurn(namedCard.getName(), ie.getSharedGameState());
    }

    const cardToGain: Card | Choice = await ie
      .chooseCard('Choose a card costing up to $5 that has not been named for War Chest this turn')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(WarChest.getNotNamedForWarChestEligibilityFunction(ie.getSharedGameState()))
      .choose();

    if (cardToGain instanceof Card) {
      await ie.gainCardFromPile(cardToGain);
    }
  }

  private static addNamedCardForCurrentTurn(cardName: string, sharedGameState: SharedGameState): void {
    const unofficialTurnNumber = sharedGameState.getCurrentTurn().getUnofficialNumber();
    if (!WarChest.namedCardsByTurnNumber.has(unofficialTurnNumber)) {
      WarChest.namedCardsByTurnNumber.set(unofficialTurnNumber, new Set<string>());
    }
    WarChest.namedCardsByTurnNumber.get(unofficialTurnNumber)!.add(cardName);
  }

  public static getNotNamedForWarChestEligibilityFunction(sharedGameState: SharedGameState): CardEligibilityFunction {
    return new CardEligibilityFunction(
      (card: Card) =>
        card.getCost().isLessThanOrEqualTo(Cost.Simple(5)) &&
        !WarChest.namedCardsByTurnNumber
          .get(sharedGameState.getCurrentTurn().getUnofficialNumber())!
          .has(card.getName()),
    );
  }
}
