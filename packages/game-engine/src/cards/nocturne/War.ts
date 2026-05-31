import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { Hex } from '../../card/Hex';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// War: Reveal cards from your deck until revealing one costing $3 or $4. Trash it and discard the rest.
export class War extends Hex {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('War'));
  }

  public async receive(ie: InstructionExecutor): Promise<void> {
    // Reveal cards one at a time until finding one costing $3 or $4
    const revealed: Card[] = [];
    let targetCard: Card | undefined;
    let topCard = await ie.takeCardOffDeck();
    while (topCard !== undefined) {
      const cost = topCard.getCost().coins;
      if (cost === 3 || cost === 4) {
        targetCard = topCard;
        break;
      }
      revealed.push(topCard);
      topCard = await ie.takeCardOffDeck();
    }
    if (targetCard !== undefined) {
      await ie.trashCard(targetCard);
    }
    // Discard revealed non-target cards
    for (const card of revealed) {
      await ie.discardCard(card);
    }
  }
}
