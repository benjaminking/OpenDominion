import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isCastleCard } from '../../StandardCardEligibilityFunctions';

export class SmallCastle extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Small Castle'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    // Trash this or a Castle from hand
    const cardToTrash: Card | Choice = await ie
      .chooseCard('Trash this or a Castle from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .whereCardIs(isCastleCard)
      .choose();

    let trashed = false;
    if (cardToTrash instanceof Card) {
      // Trash the card from hand
      const result = await ie.trashCardFromLocation(cardToTrash, CardLocation.HAND);
      if (result !== undefined) trashed = true;
    } else {
      // May trash self from play
      const selfResult = await ie.trashCardFromLocation(this, CardLocation.IN_PLAY);
      if (selfResult !== undefined) trashed = true;
    }

    if (trashed) {
      // Gain a Castle
      const castleToGain: Card | Choice = await ie
        .chooseCard('Gain a Castle')
        .from(CardSelectionLocation.SUPPLY)
        .to(CardSelectionPurpose.GAIN)
        .whereCardIs(isCastleCard)
        .choose();
      if (castleToGain instanceof Card) {
        await ie.gainCardFromPile(castleToGain);
      }
    }
  }

  public score(_allCardGroups: CardCollection[]): number {
    return 1;
  }
}
