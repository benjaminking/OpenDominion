import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';
import { costsUpTo, isActionCard, isTreasureCard, isVictoryCard } from '../../StandardCardEligibilityFunctions';

export class Replace extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Replace'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const cardToTrash: Card | Choice = await ie
      .chooseCard('Choose a card to trash')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .choose();

    if (!(cardToTrash instanceof Card)) {
      return;
    }

    const trashedCard: Card | undefined = await ie.trashCardFromLocation(cardToTrash, CardLocation.HAND);
    if (trashedCard === undefined) {
      return;
    }

    const cardToGain: Card | Choice = await ie
      .chooseCard('Choose a card costing up to $' + trashedCard.getCost().plus(2).coins.toFixed() + ' to gain')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(costsUpTo(trashedCard.getCost().plus(2)))
      .choose();

    if (!(cardToGain instanceof Card)) {
      return;
    }

    await ie.gainCardFromPile(cardToGain);
    if (isActionCard.matches(cardToGain) || isTreasureCard.matches(cardToGain)) {
      await ie.topDeckCardFromLocation(cardToGain, CardLocation.DISCARD);
    }
    if (isVictoryCard.matches(cardToGain)) {
      await ie.performAttack(this, this.victoryAttack.bind(this));
    }
  }

  public async victoryAttack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    const ie = attackedPlayer.getInstructionExecutor();
    await ie.gainCardFromPile('Curse');
  }
}
