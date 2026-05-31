import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';
import { isTreasureCard } from '../../StandardCardEligibilityFunctions';

// Pirate Ship (Action/Attack): Choose one: +$1 per token on your Pirate Ship mat; or
// each other player reveals the top 2 cards of their deck, trashes a revealed Treasure you choose,
// and if anyone trashed a Treasure, +1 token on your Pirate Ship mat.
// addCoinTokenToMat and getCoinTokensOnMat are stubs.
export class PirateShip extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Pirate Ship'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie
      .chooseOneOption('Pirate Ship: take coins or attack?')
      .from(
        new ActionChoice(`+$${ie.getCoinTokensOnMat('Pirate Ship')} (tokens on mat)`, async () => {
          await ie.addCoins(ie.getCoinTokensOnMat('Pirate Ship'));
        }),
      )
      .from(
        new ActionChoice('Attack: trash a Treasure from each other player', async () => {
          let anyTrashed = false;
          await ie.performAttack(this, async (attackedPlayer: Player) => {
            const attackedIe = attackedPlayer.getInstructionExecutor();
            const top2 = await attackedIe.takeCardsOffDeck(2);
            await attackedIe.revealCards(top2);
            const treasures = top2.getMatchingCards(isTreasureCard);
            if (treasures.size() > 0) {
              const toTrash = treasures.getArbitraryCard();
              await attackedIe.trashCardFromSet(toTrash, top2);
              anyTrashed = true;
            }
            await attackedIe.discardCards(top2, CardLocation.REVEAL_LIMBO);
          });
          if (anyTrashed) {
            ie.addCoinTokenToMat('Pirate Ship');
          }
        }),
      )
      .choose();
    // TODO: addCoinTokenToMat and getCoinTokensOnMat are stubs — Pirate Ship mat not yet implemented
  }
}
