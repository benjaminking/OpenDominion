import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Courtier extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Courtier'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const cardChoice: Card | Choice = await ie
      .chooseCard('Choose a card to reveal from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.OTHER)
      .choose();
    if (!(cardChoice instanceof Card)) {
      return;
    }
    await ie.revealCard(cardChoice);
    const numTypes = Math.min(cardChoice.getTypes().size, 4);
    await ie
      .chooseMultipleOptions('Choose ' + numTypes.toFixed() + ':')
      .from(
        new ActionChoice('+1 Action', () => {
          ie.addActions(1);
        }),
      )
      .from(
        new ActionChoice('+1 Buy', () => {
          ie.addBuys(1);
        }),
      )
      .from(
        new ActionChoice('+$3', async () => {
          await ie.addCoins(3);
        }),
      )
      .from(new ActionChoice('Gain a Gold', async () => await ie.gainFromPile('gold')))
      .choose(numTypes);
  }
}
