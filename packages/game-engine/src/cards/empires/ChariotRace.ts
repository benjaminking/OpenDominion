import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class ChariotRace extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Chariot Race'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);
    // +1 Card, revealing it
    const drawnCards = await ie.drawCards(1);
    const yourCard: Card | undefined = drawnCards.getArbitraryCard();
    if (yourCard === undefined) {
      return;
    }
    await ie.revealCard(yourCard);

    // Left player reveals top card of their deck
    const leftPlayer = ie.getSharedGameState().getPlayerLeftOfCurrent();
    const leftIe = leftPlayer.getInstructionExecutor();
    const leftTopCard = await leftIe.lookAtTopCardOfDeck();
    if (leftTopCard !== undefined) {
      await leftIe.revealCard(leftTopCard);
    }

    // If your card costs more, +$1 and +1 VP
    const yourCost = yourCard.getCost().coins;
    const leftCost = leftTopCard !== undefined ? leftTopCard.getCost().coins : 0;
    if (yourCost > leftCost) {
      await ie.addCoins(1);
      ie.addVP(1);
    }
  }
}
