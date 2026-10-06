import { CardInfoLookup } from '@dominion/card-info';
import { CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { both, costsUpToNMoreThanCard, isACopyOf, isVictoryCard, not } from '../../StandardCardEligibilityFunctions';

export class Rebuild extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Rebuild'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);

    const namedCard: Card | Choice = await ie.nameCard();
    if (!(namedCard instanceof Card)) {
      return;
    }

    const revealedCard = await ie.revealUntil(both(isVictoryCard, not(isACopyOf(namedCard))), 1);
    if (revealedCard.size() === 0) {
      return;
    }
    const victoryCard = revealedCard.getArbitraryCard();
    await ie.trashCardFromLocation(victoryCard, victoryCard.getLocation());

    const cardToGain: Card | Choice = await ie
      .chooseCard('Gain a Victory card costing up to $' + victoryCard.getCost().toString())
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(both(isVictoryCard, costsUpToNMoreThanCard(victoryCard, 3)))
      .choose();
    if (cardToGain instanceof Card) {
      await ie.gainCardFromPile(cardToGain);
    }
  }
}
