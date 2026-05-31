import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { cardNameIs, isActionCard } from '../../StandardCardEligibilityFunctions';

export class Golem extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Golem'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const revealedActions = new CardCollection();

    while (revealedActions.size() < 2) {
      const topCard: Card | undefined = await ie.takeCardOffDeck();
      if (topCard === undefined) {
        break;
      }

      await ie.revealCard(topCard);
      if (isActionCard.matches(topCard) && !cardNameIs('Golem').matches(topCard)) {
        await ie.setCardAsideFromLocation(topCard, CardLocation.REVEAL_LIMBO);
        revealedActions.addCard(topCard);
      } else {
        await ie.discardCard(topCard);
      }
    }

    if (revealedActions.size() === 2) {
      const firstToPlay: Card | Choice = await ie
        .chooseCard('Choose an Action to play first')
        .from(revealedActions)
        .to(CardSelectionPurpose.PLAY_ALT)
        .choose();
      if (firstToPlay instanceof Card) {
        await ie.playCardFromLocation(firstToPlay, CardLocation.SET_ASIDE);
        revealedActions.removeCard(firstToPlay);
      }
    }

    if (revealedActions.size() === 1) {
      await ie.playCardFromLocation(revealedActions.getArbitraryCard(), CardLocation.SET_ASIDE);
    }
  }
}
