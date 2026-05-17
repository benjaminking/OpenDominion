import { CardInfoLookup } from '@dominion/card-info';
import { CardSelectionPurpose } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';
import { costsTheSameAs } from '../../StandardCardEligibilityFunctions';

export class Swindler extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Swindler'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(2);
    await ie.performAttack(this, this.attack.bind(this));
  }

  private async attack(attackedPlayer: Player, attackingPlayer: Player): Promise<void> {
    const trashedCard = await attackedPlayer.getInstructionExecutor().trashTopCardOfDeck();
    if (trashedCard === undefined) {
      return;
    }
    const cardToGain = attackingPlayer
      .getInstructionExecutor()
      .chooseCard('Choose a card costing exactly ' + trashedCard.getCost().toString() + ' to have your opponent gain')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(costsTheSameAs(trashedCard))
      .choose();

    if (!(cardToGain instanceof Card)) {
      return;
    }

    await attackedPlayer.getInstructionExecutor().gainCardFromPile(cardToGain);
  }
}
