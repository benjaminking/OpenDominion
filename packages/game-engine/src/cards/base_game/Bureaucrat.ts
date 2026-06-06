import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { isVictoryCard } from '../../StandardCardEligibilityFunctions';

export class Bureaucrat extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Bureaucrat'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.gainFromPile('silver', CardLocation.DECK);
    await ie.performAttack(this, this.attack.bind(this));
  }

  public async attack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    const ie = attackedPlayer.getInstructionExecutor();
    if (ie.hasMatchingCardInHand(isVictoryCard)) {
      const cardChoice: Card | Choice = await ie
        .chooseCard('Choose a card to put on top of your deck')
        .from(CardLocation.HAND)
        .to(CardSelectionPurpose.TOPDECK)
        .whereCardIs(isVictoryCard)
        .choose();
      if (cardChoice instanceof Card) {
        await ie.revealCard(cardChoice);
        await ie.topDeckCardFromLocation(cardChoice, CardLocation.HAND);
      }
    } else {
      await ie.revealHand();
    }
  }
}
