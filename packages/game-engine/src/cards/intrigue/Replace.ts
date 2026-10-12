import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
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

    // Gain triggers (e.g. Watchtower, Trader, Trail) may move the gained card before it can be put onto the deck
    const locationExpectation = ie.createLocationExpectation(CardLocation.DISCARD);
    const gainedCard: Card | undefined = await ie.gainCardFromPile(cardToGain);
    if (gainedCard !== undefined && (isActionCard.matches(gainedCard) || isTreasureCard.matches(gainedCard))) {
      if (!locationExpectation.isMet(gainedCard)) {
        ie.sendLostTrackMessage(gainedCard);
      } else {
        await ie.topDeckCardFromLocation(gainedCard, CardLocation.DISCARD);
      }
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
