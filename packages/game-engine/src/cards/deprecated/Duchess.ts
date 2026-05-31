import { CardInfoLookup } from '@dominion/card-info';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';

// Duchess (Action): +$2. Each player (including you) looks at the top card of their deck.
// Each player may discard it.
export class Duchess extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Duchess'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(2);
    await ie.eachPlayer(async (playerIe: InstructionExecutor) => {
      const topCard = await playerIe.lookAtTopCardOfDeck();
      if (topCard === undefined) {
        return;
      }
      await playerIe
        .chooseOneOption(`Look at top card (${topCard.getName()}): discard or keep?`)
        .from(
          new ActionChoice('Discard', async () => {
            const card = await playerIe.takeCardOffDeck();
            if (card !== undefined) {
              await playerIe.discardCards(new CardCollection(card), card.getLocation());
            }
          }),
        )
        .from(new ActionChoice('Keep'))
        .choose();
    });
  }
}
