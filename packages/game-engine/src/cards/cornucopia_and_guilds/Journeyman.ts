import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { CardSelectionPurpose, Choice } from '@dominion/common';
import { anyCard } from '../../StandardCardEligibilityFunctions';

// Journeyman: Name a card. Reveal cards from your deck until you have revealed
// 3 cards that are not the named card. Put those cards into your hand and
// discard the rest.
export class Journeyman extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Journeyman'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    // Name a card from the supply
    const namedCard: Card | Choice = await ie
      .chooseCard('Name a card')
      .from(CardSelectionLocation.ALL_CARDS)
      .to(CardSelectionPurpose.OTHER)
      .whereCardIs(anyCard)
      .choose();
    const namedCardName = namedCard instanceof Card ? namedCard.getName() : '';

    const kept: CardCollection = new CardCollection();
    const discarded: CardCollection = new CardCollection();

    while (kept.size() < 3) {
      const topCard: Card | undefined = await ie.takeCardOffDeck();
      if (topCard === undefined) {
        break;
      }
      if (topCard.getName() !== namedCardName) {
        kept.addCard(topCard);
      } else {
        discarded.addCard(topCard);
      }
    }

    ie.putCardsIntoHand(kept);

    for (const c of discarded.asCardArray()) {
      await ie.discardCard(c);
    }
  }
}
