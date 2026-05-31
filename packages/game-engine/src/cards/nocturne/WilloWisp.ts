import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// Will-o'-Wisp (Action/Spirit): +1 Card, +1 Action.
// Reveal the top card of your deck. If it costs $2 or less, put it into your hand.
export class WilloWisp extends Card {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo("Will-o'-Wisp"));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);
    const topCard = await ie.lookAtTopCardOfDeck();
    if (topCard !== undefined && topCard.getCost().coins <= 2) {
      await ie.putTopCardOfDeckIntoHand();
    }
  }
}
