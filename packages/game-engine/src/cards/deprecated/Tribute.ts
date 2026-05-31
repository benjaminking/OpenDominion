import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { CardEligibilityFunction } from '../../CardEligibilityFunction';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';
import { isActionCard, isTreasureCard, isVictoryCard } from '../../StandardCardEligibilityFunctions';

// Tribute (Action): The player to your left reveals then discards the top 2 cards of their deck.
// For each differently-named card revealed: +2 Actions (Action card), +$2 (Treasure card), +2 Cards (Victory card).
export class Tribute extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Tribute'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.performWithLeftPlayer(async (leftIe: InstructionExecutor) => {
      const revealed = await leftIe.takeCardsOffDeck(2);
      await leftIe.revealCards(revealed);
      await leftIe.discardCards(revealed, CardLocation.REVEAL_LIMBO);
      const seen = new Set<string>();
      for (const card of revealed) {
        if (seen.has(card.getName())) {
          continue;
        }
        seen.add(card.getName());
        if (isActionCard.matches(card)) {
          ie.addActions(2);
        }
        if (isTreasureCard.matches(card)) {
          await ie.addCoins(2);
        }
        if (isVictoryCard.matches(card)) {
          await ie.drawCards(2);
        }
      }
    });
  }
}
