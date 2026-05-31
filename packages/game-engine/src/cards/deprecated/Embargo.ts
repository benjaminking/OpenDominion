import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// Embargo (Action): +$2. Trash this. Add an Embargo token to a Supply pile.
// (When anyone buys a card from that pile, they gain a Curse.)
// Embargo token mechanic is not yet implemented.
export class Embargo extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Embargo'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(2);
    await ie.trashCardFromLocation(this, CardLocation.IN_PLAY);
    const chosen: Card | Choice = await ie
      .chooseCard('Choose a Supply pile to add an Embargo token')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.OTHER)
      .choose();
    if (chosen instanceof Card) {
      ie.addEmbargoToken(chosen.getPileName());
      // TODO: addEmbargoToken is a stub — Embargo token effect not yet implemented
    }
  }
}
