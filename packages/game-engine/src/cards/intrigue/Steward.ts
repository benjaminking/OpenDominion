import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Steward extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Steward'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie
      .chooseOneOption('Choose one:')
      .from(new ActionChoice('+2 Cards', async () => await ie.drawCards(2)))
      .from(
        new ActionChoice('+$2', async () => {
          await ie.addCoins(2);
        }),
      )
      .from(
        new ActionChoice('Trash 2 cards from your hand.', async () => {
          const cards: CardCollection = await ie
            .chooseCards('Choose two cards from your hand to trash:')
            .from(CardLocation.HAND)
            .to(CardSelectionPurpose.TRASH)
            .choose();
          await ie.trashCardsFromLocation(cards, CardLocation.HAND);
        }),
      )
      .choose();
  }
}
