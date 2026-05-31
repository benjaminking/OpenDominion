import { CardInfoLookup } from '@dominion/card-info';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';

export class Giant extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Giant'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.flipJourneyToken();

    if (!ie.isJourneyTokenFaceUp()) {
      // Token is now face down → +$1
      await ie.addCoins(1);
    } else {
      // Token is now face up → +$5 and attack
      await ie.addCoins(5);
      await ie.performAttack(this, async (attackedPlayer: Player) => {
        const attackedIe = attackedPlayer.getInstructionExecutor();
        const topCard = await attackedIe.takeCardOffDeck();
        if (topCard !== undefined) {
          const topCards = CardCollection.fromCards([topCard]);
          await attackedIe.revealCard(topCard);
          const cost = topCard.getCost().coins;
          if (cost >= 3 && cost <= 6) {
            await attackedIe.trashCardsFromSet(topCards, topCards);
          } else {
            await attackedIe.discardCardsFromRevealedSet(topCards, topCards);
            await attackedIe.gainCardFromPile('Curse');
          }
        }
      });
    }
  }
}
