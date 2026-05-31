import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { upToNChecked } from '../../StandardNumberEligibilityFunctions';

// Secret Chamber (Action/Reaction): Discard any number of cards. +$1 per card discarded.
// (Reaction: Reveal when attacked; look at top 2 of attacker's deck and put any number back — not implemented)
export class SecretChamber extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Secret Chamber'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const handSize = ie.handSize();
    const toDiscard = await ie
      .chooseCards('Discard any number of cards')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.DISCARD)
      .whereNumCardsIs(upToNChecked(handSize))
      .choose();
    await ie.discardCards(toDiscard, CardLocation.HAND);
    await ie.addCoins(toDiscard.size());
    // TODO: Reaction mechanic not implemented
  }
}
