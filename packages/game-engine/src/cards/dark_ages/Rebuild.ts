import { CardInfoLookup } from '@dominion/card-info';
import { CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { anyCard, both, costsUpTo, isVictoryCard, not } from '../../StandardCardEligibilityFunctions';

export class Rebuild extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Rebuild'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);

    // Name a card
    const namedCard: Card | Choice = await ie
      .chooseCard('Name a card')
      .from(CardSelectionLocation.ALL_CARDS)
      .to(CardSelectionPurpose.OTHER)
      .whereCardIs(anyCard)
      .choose();

    const namedCardName = namedCard instanceof Card ? namedCard.getName() : '';

    // Reveal cards from deck until a Victory card whose name isn't the named card
    let foundVictory: Card | undefined;
    const discarded: Card[] = [];

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const topCard = await ie.takeCardOffDeck();
      if (topCard === undefined) {
        break;
      }
      await ie.revealCard(topCard);

      if (isVictoryCard.matches(topCard) && topCard.getName() !== namedCardName) {
        foundVictory = topCard;
        break;
      } else {
        discarded.push(topCard);
      }
    }

    // Discard the non-Victory cards we set aside
    for (const card of discarded) {
      await ie.discardCard(card);
    }

    if (foundVictory !== undefined) {
      const victoryCardCost = foundVictory.getCost();
      await ie.trashCardFromLocation(foundVictory, foundVictory.getLocation());

      const cardToGain: Card | Choice = await ie
        .chooseCard('Gain a Victory card costing up to $' + victoryCardCost.plus(3).coins.toFixed())
        .from(CardSelectionLocation.SUPPLY)
        .to(CardSelectionPurpose.GAIN)
        .whereCardIs(both(isVictoryCard, costsUpTo(victoryCardCost.plus(3))))
        .allowNoneOption()
        .choose();
      if (cardToGain instanceof Card) {
        await ie.gainCardFromPile(cardToGain);
      }
    }
  }
}
