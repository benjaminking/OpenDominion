import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';

export class Warrior extends Card {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Warrior'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(2);
    // For each Traveller you have in play (including this), each other player discards top card and trashes if it costs $3 or $4
    const numTravellers = ie.getNumTravellersInPlay();
    if (numTravellers > 0) {
      await ie.performAttack(this, async (attackedPlayer: Player) => {
        const attackedIe = attackedPlayer.getInstructionExecutor();
        for (let i = 0; i < numTravellers; i++) {
          const topCard = await attackedIe.takeCardOffDeck();
          if (topCard !== undefined) {
            const topCards = CardCollection.fromCards([topCard]);
            await attackedIe.revealCard(topCard);
            const cost = topCard.getCost().coins;
            if (cost === 3 || cost === 4) {
              await attackedIe.trashCardsFromSet(topCards, topCards);
            } else {
              await attackedIe.discardCardsFromRevealedSet(topCards, topCards);
            }
          }
        }
      });
    }
  }
}
