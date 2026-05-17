import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';
import { isTreasureCard } from '../../StandardCardEligibilityFunctions';

export class Bandit extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Bandit'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.gainFromPile('Gold');
    await ie.performAttack(this, this.attack.bind(this));
  }

  public async attack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    const ie = attackedPlayer.getInstructionExecutor();
    const thiefEligibleCards = new CardCollection();
    const thiefNonTreasureCards = new CardCollection();
    const cards = await ie.takeCardsOffDeck(2);
    await ie.revealCards(cards);

    for (const card of cards) {
      if (isTreasureCard.matches(card) && card.getName() !== 'Copper') {
        thiefEligibleCards.addCard(card);
      } else thiefNonTreasureCards.addCard(card);
    }

    if (thiefEligibleCards.size() === 1) {
      await ie.trashCard(thiefEligibleCards.getArbitraryCard());
      await ie.discardCards(thiefNonTreasureCards, CardLocation.REVEAL_LIMBO);
    } else if (thiefEligibleCards.size() === 2) {
      const cardChoice: Card | Choice = await ie
        .chooseCard('Choose a card to trash')
        .from(thiefEligibleCards)
        .to(CardSelectionPurpose.TRASH)
        .choose();
      if (cardChoice instanceof Card) {
        await ie.trashCardFromSet(cardChoice, thiefEligibleCards);
      }
      await ie.discardCards(thiefEligibleCards, CardLocation.REVEAL_LIMBO);
    } else {
      await ie.discardCards(thiefNonTreasureCards, CardLocation.REVEAL_LIMBO);
    }
  }
}
