import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { exactlyNChecked } from '../../StandardNumberEligibilityFunctions';

export class Scrap extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Scrap'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const cards = await ie
      .chooseCards('Trash a card from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .whereNumCardsIs(exactlyNChecked(1))
      .choose();

    if (cards.isEmpty()) {
      return;
    }

    const trashed = cards.getArbitraryCard();
    await ie.trashCardFromLocation(trashed, CardLocation.HAND);

    await ie
      .chooseMultipleOptions('Choose different things:')
      .from(new ActionChoice('+1 Card', async () => await ie.drawCards(1)))
      .from(new ActionChoice('+1 Action', async () => ie.addActions(1)))
      .from(new ActionChoice('+1 Buy', async () => ie.addBuys(1)))
      .from(new ActionChoice('+$1', async () => ie.addCoins(1)))
      .from(new ActionChoice('Gain a Silver', async () => await ie.gainFromPile('Silver')))
      .from(new ActionChoice('Gain a Horse', async () => await ie.gainHorse(1)))
      .choose(Math.min(trashed.getCost().coins, 6));
  }
}
