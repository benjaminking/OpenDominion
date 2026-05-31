import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';
import { isVictoryCard, cardNameIs } from '../../StandardCardEligibilityFunctions';

// Tournament (Action): +1 Action. Each player may reveal a Province from their hand.
// If you do, gain a Prize (or Duchy) onto your deck.
// If no other player does, +1 Card and +$1.
// Prize pile is not implemented in the engine; this is a stub.
export class Tournament extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Tournament'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);
    let youRevealed = false;
    let otherRevealed = false;
    // Each player may reveal a Province
    await ie.eachPlayer(async (playerIe: InstructionExecutor) => {
      const isCurrentPlayer = playerIe === ie;
      const revealed = await playerIe
        .chooseCard('You may reveal a Province from your hand')
        .from(CardLocation.HAND)
        .to(CardSelectionPurpose.OTHER)
        .whereCardIs(cardNameIs('Province'))
        .allowNoneOption()
        .choose();
      if (revealed instanceof Card) {
        await playerIe.revealCards(new CardCollection(revealed));
        if (isCurrentPlayer) {
          youRevealed = true;
        } else {
          otherRevealed = true;
        }
      }
    });
    if (youRevealed) {
      // TODO: Gain a Prize from Prize pile onto deck (Prize pile not implemented)
      // Fallback: gain a Duchy instead
      const duchy: Card | Choice = await ie
        .chooseCard('Gain a Prize or Duchy onto your deck (Prize pile not implemented; choose Duchy)')
        .from(CardSelectionLocation.SUPPLY)
        .to(CardSelectionPurpose.GAIN)
        .whereCardIs(cardNameIs('Duchy'))
        .allowNoneOption()
        .choose();
      if (duchy instanceof Card) {
        await ie.gainCardFromPile(duchy, CardLocation.DECK);
      }
    }
    if (!otherRevealed) {
      await ie.drawCards(1);
      await ie.addCoins(1);
    }
  }
}
