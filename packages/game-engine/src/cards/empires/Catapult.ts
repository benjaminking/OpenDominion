import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';
import { isTreasureCard, isVictoryCard } from '../../StandardCardEligibilityFunctions';

export class Catapult extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Catapult'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(1);
    const cardToTrash: Card | Choice = await ie
      .chooseCard('Choose a card from your hand to trash')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .allowNoneOption()
      .choose();
    if (!(cardToTrash instanceof Card)) {
      return;
    }

    const trashedCard = await ie.trashCardFromLocation(cardToTrash, CardLocation.HAND);
    if (trashedCard === undefined) {
      return;
    }

    const isCostAtLeast3 = trashedCard.getCost().coins >= 3;
    const isTreasure = isTreasureCard.matches(trashedCard);

    if (isCostAtLeast3) {
      await ie.performAttack(this, async (attackedPlayer: Player) => {
        const attackedIe = attackedPlayer.getInstructionExecutor();
        await attackedIe.gainCardFromPile('Curse');
      });
    }

    if (isTreasure) {
      await ie.performAttack(this, async (attackedPlayer: Player) => {
        const attackedIe = attackedPlayer.getInstructionExecutor();
        await attackedIe.discardDownTo(3);
      });
    }
  }
}
