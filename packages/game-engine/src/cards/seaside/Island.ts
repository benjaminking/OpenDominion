import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Island extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Island'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    // When played again (e.g. by Throne Room), Island has already left play, so only the card from hand goes onto the
    // mat
    const locationExpectation = ie.createLocationExpectation(CardLocation.IN_PLAY);
    if (locationExpectation.isMet(this) && ie.getSharedGameState().isCardAbleToMove(this)) {
      this.putSelfOnIslandMatFromPlay(ie);
    } else {
      ie.sendLostTrackMessage(this);
    }
    const cardToSetAside: Card | Choice = await ie
      .chooseCard('Choose a card to put on your Island mat')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.OTHER)
      .choose();
    if (!(cardToSetAside instanceof Card)) {
      return;
    }
    ie.putCardOnIslandMatFromHand(cardToSetAside);
  }

  private putSelfOnIslandMatFromPlay(ie: InstructionExecutor): void {
    const ownedCards = ie.getSharedGameState().getCurrentPlayer().getOwnedCards();
    ownedCards.removeCardFromLocation(this, CardLocation.IN_PLAY);
    ownedCards.addCardToIslandMat(this);
  }

  public score(_allCardGroups: CardCollection[]): number {
    return 2;
  }
}
