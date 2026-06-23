import { CardInfoLookup } from '@dominion/card-info';
import { CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardEligibilityFunction } from '../../CardEligibilityFunction';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

const canGainCopy = (ie: InstructionExecutor) =>
  new CardEligibilityFunction((card) => ie.getSharedGameState().isCopyOfCardOnTopOfPile(card, card.getPileName()));

export class Tools extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Tools'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const gainableCardsInPlay = ie.getAllCardsInPlay().getMatchingCards(canGainCopy(ie));
    const cardToCopy: Card | Choice = await ie
      .chooseCard('Choose a card anyone has in play to gain a copy of')
      .from(gainableCardsInPlay)
      .to(CardSelectionPurpose.GAIN)
      .allowNoneOption()
      .choose();

    if (cardToCopy instanceof Card) {
      await ie.gainCardFromPile(cardToCopy);
    }
  }
}
