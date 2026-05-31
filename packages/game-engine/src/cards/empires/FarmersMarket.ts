import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

const PILE_NAME = "Farmers' Market";

export class FarmersMarket extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo("Farmers' Market"));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addBuys(1);
    const vpOnPile = ie.getPileVPTokens(PILE_NAME);
    if (vpOnPile >= 4) {
      // Take all VP tokens and trash this card
      const taken = ie.takePileVPTokens(PILE_NAME);
      ie.addVP(taken);
      await ie.trashCardFromLocation(this, CardLocation.IN_PLAY);
    } else {
      // Add 1 VP to pile, then +$1 per VP on pile
      ie.addPileVPTokens(PILE_NAME, 1);
      const newVP = ie.getPileVPTokens(PILE_NAME);
      await ie.addCoins(newVP);
    }
  }
}
