import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';
import { isVictoryCard } from '../../StandardCardEligibilityFunctions';

// Jester: +$2; each other player discards the top card of their deck.
// If it's a Victory card, they gain a Curse; otherwise you choose one:
// you gain a copy of that card, or they gain a copy of that card.
export class Jester extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Jester'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(2);
    await ie.performAttack(this, this.attack.bind(this));
  }

  private async attack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    const attackingIe: InstructionExecutor = _attackingPlayer.getInstructionExecutor();
    const attackedIe: InstructionExecutor = attackedPlayer.getInstructionExecutor();

    const topCard: Card | undefined = await attackedIe.takeCardOffDeck();
    if (topCard === undefined) {
      return;
    }
    await attackedIe.discardCard(topCard);

    if (isVictoryCard.matches(topCard)) {
      await attackedIe.gainFromPile('curse');
    } else {
      await attackingIe
        .chooseOneOption(
          'Jester: gain a copy of ' + topCard.getName() + ' or have ' + attackedPlayer.getName() + ' gain a copy?',
        )
        .from(
          new ActionChoice('You gain a copy', async () => {
            await attackingIe.gainFromPile(topCard.getName());
          }),
        )
        .from(
          new ActionChoice(attackedPlayer.getName() + ' gains a copy', async () => {
            await attackedIe.gainFromPile(topCard.getName());
          }),
        )
        .choose();
    }
  }
}
