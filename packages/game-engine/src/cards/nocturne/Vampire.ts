import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { CardEligibilityFunction } from '../../CardEligibilityFunction';
import { Cost } from '../../card/Cost';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';
import { costsUpTo } from '../../StandardCardEligibilityFunctions';

const isNotVampire = new CardEligibilityFunction((c: Card) => c.getName() !== 'Vampire');

// Vampire (Night/Attack/Doom): Each other player receives the next Hex.
// Then gain a non-Vampire costing up to $5. Exchange this for a Bat.
export class Vampire extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Vampire'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.performAttack(this, this.hexAttack.bind(this));
    const cardToGain: Card | Choice = await ie
      .chooseCard('Gain a non-Vampire card costing up to $5')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(costsUpTo(Cost.Simple(5)))
      .whereCardIs(isNotVampire)
      .choose();
    if (cardToGain instanceof Card) {
      await ie.gainCardFromPile(cardToGain.getPileName());
    }
    await ie.exchangeCard(this, 'Bat');
  }

  public async hexAttack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    const attackedIe = attackedPlayer.getInstructionExecutor();
    await attackedIe.receiveNextHex();
  }
}
