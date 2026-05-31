import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';

export class SwampHag extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Swamp Hag'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    // Attack: until start of your next turn, when any other player gains a card they bought, they gain a Curse
    await ie.performAttack(this, async (attackedPlayer: Player, attackingPlayer: Player) => {
      const attackedIe = attackedPlayer.getInstructionExecutor();
      attackedIe.addEffect(
        new Effect.Builder()
          .from(this)
          .triggerOn(EffectTriggerType.BUY_END, EffectSource.SELF)
          .withExpiration(attackedIe.createStartOfPlayersNextTurnEffectExpiration(attackingPlayer))
          .makeMandatory()
          .action(
            new EffectAction(async (ie: InstructionExecutor) => {
              await ie.gainCardFromPile('Curse');
            }),
          )
          .build(),
      );
    });

    // At the start of your next turn: +$3
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
        .onTurn(ie.createNextTurnEligibilityFunction())
        .withExpiration(ie.createEndOfMyNextTurnEffectExpiration())
        .makeMandatory()
        .action(
          new EffectAction(async (ie: InstructionExecutor) => {
            await ie.addCoins(3);
            this.markAsFinished();
          }),
        )
        .build(),
    );
    this.markAsUnfinished();
  }
}
