import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { isActionCard } from '../../StandardCardEligibilityFunctions';

export class Vassal extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Vassal'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(2);
    const card: Card | undefined = await ie.takeCardOffDeck();
    if (card === undefined) {
      return;
    }
    await ie.discardCard(card);

    if (isActionCard.matches(card)) {
      await ie
        .chooseOneOption('Do you want to play ' + card.getName() + '?')
        .from(new ActionChoice('Yes', () => this.playDiscardedCard(ie, card)))
        .from(new ActionChoice('No'))
        .choose();
    }
  }

  private playDiscardedCard(ie: InstructionExecutor, card: Card): Promise<void> {
    if (card.getLocation() === CardLocation.DISCARD) {
      return ie.playCardFromLocation(card, CardLocation.DISCARD);
    } else {
      // lost track
      return Promise.resolve();
    }
  }
}
