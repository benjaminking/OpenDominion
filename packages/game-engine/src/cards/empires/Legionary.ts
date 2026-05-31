import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';
import { cardNameIs } from '../../StandardCardEligibilityFunctions';

export class Legionary extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Legionary'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(3);
    const goldChoice: Card | Choice = await ie
      .chooseCard('You may reveal a Gold from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.OTHER)
      .whereCardIs(cardNameIs('Gold'))
      .allowNoneOption()
      .choose();
    if (goldChoice instanceof Card) {
      await ie.revealCard(goldChoice);
      await ie.performAttack(this, async (attackedPlayer: Player) => {
        const attackedIe = attackedPlayer.getInstructionExecutor();
        await attackedIe.discardDownTo(2);
        await attackedIe.drawCards(1);
      });
    }
  }
}
