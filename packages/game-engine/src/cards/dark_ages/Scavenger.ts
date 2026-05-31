import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Scavenger extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Scavenger'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(2);

    await ie
      .chooseOneOption('Do you want to put your deck into your discard pile?')
      .from(
        new ActionChoice('Yes', async () => {
          // TODO: moveDeckToDiscardPile stub
          await ie.moveDeckToDiscardPile();
        }),
      )
      .from(new ActionChoice('No', () => {}))
      .choose();

    const cardToTopdeck: Card | Choice = await ie
      .chooseCard('Choose a card from your discard pile to put onto your deck')
      .from(CardLocation.DISCARD)
      .to(CardSelectionPurpose.TOPDECK)
      .allowNoneOption()
      .choose();
    if (cardToTopdeck instanceof Card) {
      await ie.topDeckCardFromLocation(cardToTopdeck, CardLocation.DISCARD);
    }
  }
}
