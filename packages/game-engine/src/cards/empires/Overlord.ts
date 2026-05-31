import { CardInfoLookup } from '@dominion/card-info';
import { CardSelectionPurpose, CardType, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { Cost } from '../../card/Cost';
import { CardEligibilityFunction } from '../../CardEligibilityFunction';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { costsUpTo, isActionCard, isDurationCard } from '../../StandardCardEligibilityFunctions';
import { KingdomCard } from '../../card/KingdomCard';

const isEligibleForOverlord = new CardEligibilityFunction(
  (c: Card) =>
    isActionCard.matches(c) &&
    !isDurationCard.matches(c) &&
    !c.getTypes().has(CardType.COMMAND) &&
    costsUpTo(Cost.Simple(5)).matches(c),
);

export class Overlord extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Overlord'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    // Play a non-Command, non-Duration Action from Supply up to $5, leaving it there
    const cardToPlay: Card | Choice = await ie
      .chooseCard('Choose a non-Command, non-Duration Action card from the Supply costing up to $5 to play')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.PLAY_ALT)
      .whereCardIs(isEligibleForOverlord)
      .allowNoneOption()
      .choose();
    if (cardToPlay instanceof Card) {
      // TODO: play from Supply without gaining it
      await ie.playCardFromSupplyWithoutGaining(cardToPlay);
    }
  }
}
