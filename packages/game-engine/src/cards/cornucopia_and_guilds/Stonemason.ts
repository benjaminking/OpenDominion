import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice, MoneyAmount } from '@dominion/common';

import { Card } from '../../card/Card';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { addOverpayEffects } from '../../effects/OverpayEffects';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { both, costsExactly, costsLessThanCard, isActionCard } from '../../StandardCardEligibilityFunctions';

export class Stonemason extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Stonemason'));

    addOverpayEffects(this, async (ie: InstructionExecutor, overpayAmount: MoneyAmount) => {
      await this.gainActionFromOverpay(ie, overpayAmount);
      await this.gainActionFromOverpay(ie, overpayAmount);
    });
  }

  private async gainActionFromOverpay(ie: InstructionExecutor, overpayAmount: MoneyAmount): Promise<void> {
    const cardToGain: Card | Choice = await ie
      .chooseCard('Choose an action card to gain')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(both(isActionCard, costsExactly(Cost.fromMoneyAmount(overpayAmount))))
      .choose();

    if (!(cardToGain instanceof Card)) {
      return;
    }

    await ie.gainCardFromPile(cardToGain);
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const cardToTrash: Card | Choice = await ie
      .chooseCard('Trash a card from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .choose();
    if (!(cardToTrash instanceof Card)) {
      return;
    }

    const trashedCard = await ie.trashCardFromLocation(cardToTrash, CardLocation.HAND);
    if (!(trashedCard instanceof Card)) {
      return;
    }

    await this.gainCheaperCard(ie, trashedCard);
    await this.gainCheaperCard(ie, trashedCard);
  }

  private async gainCheaperCard(ie: InstructionExecutor, trashedCard: Card): Promise<void> {
    const card: Card | Choice = await ie
      .chooseCard('Gain a card costing less than ' + trashedCard.getCost().toString())
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(costsLessThanCard(trashedCard))
      .choose();
    if (card instanceof Card) {
      await ie.gainCardFromPile(card);
    }
  }
}
