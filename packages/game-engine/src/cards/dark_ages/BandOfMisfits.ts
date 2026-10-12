import { CardInfoLookup } from '@dominion/card-info';
import { CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { both, costsLessThanCard, isActionCard, isCommandCard, not } from '../../StandardCardEligibilityFunctions';

export class BandOfMisfits extends KingdomCard {
  private readonly cardsPlayedFromSupply: Card[] = [];

  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Band Of Misfits'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const choice: Card | Choice = await ie
      .chooseCard(
        'Choose a non-Command Action card from the Supply costing less than ' + this.getCost().toString() + ' to play',
      )
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.PLAY_ALT)
      .whereCardIs(both(both(isActionCard, not(isCommandCard)), costsLessThanCard(this)))
      .choose();

    if (choice instanceof Card) {
      await ie.playCardFromSupplyLeavingItThere(choice);
      this.cardsPlayedFromSupply.push(choice);
    }
  }

  public canBeDiscardedInCleanup(): boolean {
    return (
      super.canBeDiscardedInCleanup() &&
      this.cardsPlayedFromSupply.every((card: Card) => card.canBeDiscardedInCleanup())
    );
  }

  public stopTrackingDurations(): void {
    super.stopTrackingDurations();
    for (const card of this.cardsPlayedFromSupply) {
      card.stopTrackingDurations();
    }
    this.cardsPlayedFromSupply.length = 0;
  }
}
