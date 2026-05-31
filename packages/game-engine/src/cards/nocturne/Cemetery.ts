import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { upToNChecked } from '../../StandardNumberEligibilityFunctions';

// Cemetery: Victory worth 2 VP.
// When you gain this, trash up to 4 cards from your hand. (On-gain effect — requires engine gain-trigger support.)
export class Cemetery extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Cemetery'));
  }

  public score(_allCardGroups: import('../../card/CardCollection').CardCollection[]): number {
    return 2;
  }
}
