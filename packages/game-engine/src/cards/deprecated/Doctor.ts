import { CardInfoLookup } from '@dominion/card-info';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// Doctor (Action): Name a card. Reveal the top 3 cards of your deck.
// Trash the matches. Put the rest back in any order.
// The "name a card" mechanic requires engine support; approximated with chooseCardByName stub.
export class Doctor extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Doctor'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const namedCard = await ie.chooseCardByName('Name a card');
    const topCards = await ie.takeCardsOffDeck(3);
    await ie.revealCards(topCards);
    const toTrash = new CardCollection();
    const toReturn = new CardCollection();
    for (const card of topCards) {
      if (namedCard !== '' && card.getName().toLowerCase() === namedCard.toLowerCase()) {
        toTrash.addCard(card);
      } else {
        toReturn.addCard(card);
      }
    }
    await ie.trashCardsFromSet(toTrash, topCards);
    await ie.topDeckCardsFromRevealedSet(toReturn);
  }
}
