import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, CardType, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { CardEligibilityFunction } from '../../CardEligibilityFunction';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

const isFaceUpNonDurationAction = new CardEligibilityFunction(
  (c: Card) => c.hasType(CardType.ACTION) && !c.hasType(CardType.DURATION),
);

// Necromancer: Choose a face-up, non-Duration Action card in the Trash.
// Turn it face down for the turn, and play it, leaving it there.
export class Necromancer extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Necromancer'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const cardToPlay: Card | Choice = await ie
      .chooseCard('Choose a face-up, non-Duration Action from the trash to play')
      .from(CardLocation.TRASH)
      .to(CardSelectionPurpose.OTHER)
      .whereCardIs(isFaceUpNonDurationAction)
      .allowNoneOption()
      .choose();
    if (cardToPlay instanceof Card) {
      await ie.playCardFromTrash(cardToPlay);
    }
  }
}
