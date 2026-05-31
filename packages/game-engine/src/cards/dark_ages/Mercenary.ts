import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';
import { either, exactlyNChecked } from '../../StandardNumberEligibilityFunctions';

export class Mercenary extends Card {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Mercenary'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const cardsToTrash: CardCollection = await ie
      .chooseCards('You may trash 2 cards from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .whereNumCardsIs(either(exactlyNChecked(0), exactlyNChecked(2)))
      .choose();

    if (cardsToTrash.size() === 2) {
      await ie.trashCardsFromLocation(cardsToTrash, CardLocation.HAND);
      await ie.drawCards(2);
      await ie.addCoins(2);
      await ie.performAttack(this, this.attack.bind(this));
    }
  }

  private async attack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    await attackedPlayer.getInstructionExecutor().discardDownTo(3);
  }
}
