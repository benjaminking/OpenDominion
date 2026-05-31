import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Raze extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Raze'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);

    let trashedCard: Card | undefined;

    await ie
      .chooseOneOption('Trash this or a card from your hand')
      .from(
        new ActionChoice('Trash this Raze', async () => {
          trashedCard = await ie.trashCardFromLocation(this, CardLocation.IN_PLAY);
        }),
      )
      .from(
        new ActionChoice('Trash a card from your hand', async () => {
          const card: Card | Choice = await ie
            .chooseCard('Choose a card to trash')
            .from(CardLocation.HAND)
            .to(CardSelectionPurpose.TRASH)
            .allowNoneOption()
            .choose();
          if (card instanceof Card) {
            trashedCard = await ie.trashCardFromLocation(card, CardLocation.HAND);
          }
        }),
      )
      .choose();

    if (trashedCard !== undefined) {
      const numCards = trashedCard.getCost().coins;
      if (numCards > 0) {
        const topCards: CardCollection = await ie.takeCardsOffDeck(numCards);
        if (topCards.size() > 0) {
          const cardToKeep: Card | Choice = await ie
            .chooseCard('Put a card into your hand')
            .from(topCards)
            .to(CardSelectionPurpose.OTHER)
            .allowNoneOption()
            .choose();
          if (cardToKeep instanceof Card) {
            ie.putCardIntoHandFromLocation(cardToKeep, CardLocation.REVEAL_LIMBO);
            await ie.discardCardsFromRevealedSet(
              topCards.removeCard(cardToKeep) !== undefined ? topCards : topCards,
              topCards,
            );
          } else {
            await ie.discardCardsFromRevealedSet(topCards, topCards);
          }
        }
      }
    }
  }
}
