import { CardInfoLookup } from '@dominion/card-info';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { anyCard } from '../../StandardCardEligibilityFunctions';

export class Artist extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Artist'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);

    const cardsInPlay: CardCollection = ie.getMatchingCardsInPlay(anyCard);
    const countsByName = new Map<string, number>();
    for (const card of cardsInPlay) {
      countsByName.set(card.getName(), (countsByName.get(card.getName()) ?? 0) + 1);
    }

    let numSingleCopies = 0;
    for (const card of cardsInPlay) {
      if ((countsByName.get(card.getName()) ?? 0) === 1) {
        numSingleCopies++;
      }
    }

    await ie.drawCards(numSingleCopies);
  }
}
