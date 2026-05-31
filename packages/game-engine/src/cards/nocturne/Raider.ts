import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';

// Raider (Night/Duration/Attack): Each other player with 5+ cards in hand discards a copy of
// a card you have in play (or reveals they can't). At the start of your next turn, +$3.
export class Raider extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Raider'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.performAttack(this, this.discardAttack.bind(this));
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
        .onTurn(ie.createNextTurnEligibilityFunction())
        .withExpiration(ie.createEndOfMyNextTurnEffectExpiration())
        .makeMandatory()
        .action(
          new EffectAction(async (effectIe: InstructionExecutor) => {
            await effectIe.addCoins(3);
            this.markAsFinished();
          }),
        )
        .build(),
    );
    this.markAsUnfinished();
  }

  public async discardAttack(attackedPlayer: Player, attackingPlayer: Player): Promise<void> {
    const attackedIe = attackedPlayer.getInstructionExecutor();
    if (attackedIe.handSize() < 5) {
      return;
    }
    // Discard a copy of a card the attacker has in play
    // This requires knowing attacker's in-play cards; approximate by letting attacked player choose
    const attackingIe = attackingPlayer.getInstructionExecutor();
    // TODO: attacked player should discard a card matching one in attacker's in-play area
    void attackingIe;
  }
}
