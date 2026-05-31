import { CardInfoLookup } from '@dominion/card-info';
import { CardSelectionPurpose } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Sorceress extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Sorceress'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);

    const named = await ie
      .chooseCard('Name a card')
      .from(CardSelectionLocation.ALL_CARDS)
      .to(CardSelectionPurpose.OTHER)
      .choose();

    const top = await ie.putTopCardOfDeckIntoHand();
    if (top === undefined) {
      return;
    }
    await ie.revealCard(top);

    const namedCard = named instanceof Card ? named : undefined;
    if (namedCard !== undefined && namedCard.getName() === top.getName()) {
      await ie.eachOtherPlayer(async (otherIe: InstructionExecutor) => {
        await otherIe.gainFromPile('Curse');
      });
    }
  }
}
