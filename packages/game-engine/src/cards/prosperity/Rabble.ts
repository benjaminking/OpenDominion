import { CardInfoLookup } from '@dominion/card-info';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { either, isActionCard, isTreasureCard } from '../../StandardCardEligibilityFunctions';

export class Rabble extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Rabble'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(3);
    await ie.performAttack(this, this.attack.bind(this));
  }

  public async attack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    const ie = attackedPlayer.getInstructionExecutor();
    const topCards = await ie.takeCardsOffDeck(3);
    await ie.revealCards(topCards);

    const cardsToDiscard: CardCollection = topCards.getMatchingCards(either(isActionCard, isTreasureCard));
    await ie.discardCardsFromRevealedSet(cardsToDiscard, topCards);
    if (topCards.size() > 0) {
      await ie.topDeckCardsFromRevealedSet(topCards);
    }
  }
}
