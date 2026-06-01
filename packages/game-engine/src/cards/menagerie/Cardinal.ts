import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';
import { costsBetween } from '../../StandardCardEligibilityFunctions';
import { upToNChecked } from '../../StandardNumberEligibilityFunctions';

export class Cardinal extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Cardinal'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addCoins(2);
    await ie.performAttack(this, this.attack.bind(this));
  }

  public async attack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    const ie = attackedPlayer.getInstructionExecutor();
    const revealed = await ie.takeCardsOffDeck(2);
    await ie.revealCards(revealed);

    const exileChoice = await ie
      .chooseCards('Exile one card costing from $3 to $6')
      .from(revealed)
      .to(CardSelectionPurpose.OTHER)
      .whereCardIs(costsBetween(Cost.Simple(3), Cost.Simple(6)))
      .whereNumCardsIs(upToNChecked(1))
      .choose();

    if (!exileChoice.isEmpty()) {
      const exiled = exileChoice.getArbitraryCard();
      revealed.removeCard(exiled);
      await ie.exileCardFromLocation(exiled, CardLocation.REVEAL_LIMBO);
    }

    await ie.discardCardsFromLocation(revealed, CardLocation.REVEAL_LIMBO);
  }
}
