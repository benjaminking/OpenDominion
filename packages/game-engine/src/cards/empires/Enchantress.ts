import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';

export class Enchantress extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Enchantress'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    // Attack: until your next turn, first time each other player plays an Action,
    // they get +1 Card +1 Action instead of following its instructions.
    // TODO: interrupt-based Action replacement is not yet supported; effect is stubbed.
    await ie.performAttack(this, async (attackedPlayer: Player, attackingPlayer: Player) => {
      const attackedIe = attackedPlayer.getInstructionExecutor();
      attackedIe.addEffect(
        new Effect.Builder()
          .from(this)
          .triggerOn(EffectTriggerType.ABOUT_TO_PLAY_CARD, EffectSource.OTHER_PLAYER)
          .withExpiration(attackedIe.createStartOfPlayersNextTurnEffectExpiration(attackingPlayer))
          .action(
            new EffectAction(async (ie: InstructionExecutor) => {
              // TODO: replace card's instructions with +1 Card, +1 Action
              await ie.drawCards(1);
              ie.addActions(1);
            }),
          )
          .build(),
      );
    });

    // Duration: at the start of your next turn, +2 Cards
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
        .onTurn(ie.createNextTurnEligibilityFunction())
        .withExpiration(ie.createEndOfMyNextTurnEffectExpiration())
        .makeMandatory()
        .action(
          new EffectAction(async (ie: InstructionExecutor) => {
            await ie.drawCards(2);
            this.markAsFinished();
          }),
        )
        .build(),
    );
    this.markAsUnfinished();
  }
}
