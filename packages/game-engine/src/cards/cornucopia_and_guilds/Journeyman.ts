import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { CardEligibilityFunction } from '../../CardEligibilityFunction';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { anyCard, isACopyOf, not } from '../../StandardCardEligibilityFunctions';

export class Journeyman extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Journeyman'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const namedCard: Card | Choice = await ie
      .chooseCard('Name a card')
      .from(CardSelectionLocation.ALL_CARDS)
      .to(CardSelectionPurpose.OTHER)
      .whereCardIs(anyCard)
      .choose();
    let cardEligiblityFunction: CardEligibilityFunction = anyCard;
    if (namedCard instanceof Card) {
      cardEligiblityFunction = not(isACopyOf(namedCard));
    }

    const revealedCards = await ie.revealUntil(cardEligiblityFunction, 3);
    ie.putCardsIntoHandFromLocation(revealedCards, CardLocation.REVEAL_LIMBO);
  }
}
