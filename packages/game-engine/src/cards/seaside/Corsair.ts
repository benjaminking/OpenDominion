import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { cardNameIs, either } from '../../StandardCardEligibilityFunctions';

export class Corsair extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Corsair'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(2);
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
        .onTurn(ie.createNextTurnEligibilityFunction())
        .withExpiration(ie.createEndOfMyNextTurnEffectExpiration())
        .makeMandatory()
        .action(
          new EffectAction(async (ie: InstructionExecutor) => {
            await ie.drawCards(1);
            this.markAsFinished();
          }),
        )
        .build(),
    );
    await ie.performAttack(this, this.treasureTrashAttack.bind(this));
    this.markAsUnfinished();
  }

  public async treasureTrashAttack(attackedPlayer: Player, attackingPlayer: Player): Promise<void> {
    const ie = attackedPlayer.getInstructionExecutor();
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.PLAYED_CARD, EffectSource.SELF)
        .whereCardIs(
          ie.createFirstMatchingCardPlayedThisTurnEligibilityFunction(either(cardNameIs('silver'), cardNameIs('gold'))),
        )
        .withExpiration(ie.createStartOfPlayersNextTurnEffectExpiration(attackingPlayer))
        .makeMandatory()
        .action(
          new EffectAction(async (ie: InstructionExecutor, card: Card) => {
            await ie.trashCardFromLocation(card, CardLocation.IN_PLAY);
          }),
        )
        .build(),
    );
    return Promise.resolve();
  }
}
