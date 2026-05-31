import { CardInfoLookup } from '@dominion/card-info';
import { CardSelectionPurpose, CardType } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardEligibilityFunction } from '../../CardEligibilityFunction';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';
import { both, costsUpTo } from '../../StandardCardEligibilityFunctions';

class SharesATypeWith extends CardEligibilityFunction {
  constructor(card: Card) {
    super((c: Card) => {
      for (const t of c.getTypes()) {
        if (card.hasType(t as CardType)) {
          return true;
        }
      }
      return false;
    });
  }
}

export class Barbarian extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Barbarian'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addCoins(2);
    await ie.performAttack(this, this.attack.bind(this));
  }

  public async attack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    const ie = attackedPlayer.getInstructionExecutor();
    const trashed = await ie.trashTopCardOfDeck();
    if (trashed === undefined) {
      return;
    }

    if (!trashed.getCost().isLessThan(Cost.Simple(3))) {
      const gainCost = Cost.Simple(Math.max(0, trashed.getCost().coins - 1));
      const choice = await ie
        .chooseCard('Gain a cheaper card sharing a type with the trashed card')
        .from(CardSelectionLocation.SUPPLY)
        .whereCardIs(both(costsUpTo(gainCost), new SharesATypeWith(trashed)))
        .to(CardSelectionPurpose.GAIN)
        .choose();
      if (choice instanceof Card) {
        await ie.gainCardFromPile(choice);
      }
    } else {
      await ie.gainFromPile('Curse');
    }
  }
}
