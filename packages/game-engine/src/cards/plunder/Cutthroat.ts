import { CardInfoLookup } from '@dominion/card-info';
import { CardType } from '@dominion/common';

import { CardEligibilityFunction } from '../../CardEligibilityFunction';
import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { OneTimeEffectExpirtation } from '../../effects/StandardEffectExpirations';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';

const expensiveTreasure = new CardEligibilityFunction(
  (card) => card.hasType(CardType.TREASURE) && card.getCost().coins >= 5,
);

export class Cutthroat extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Cutthroat'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.performAttack(this, this.attack.bind(this));

    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.GAIN, EffectSource.ANYONE)
        .whereCardIs(expensiveTreasure)
        .withExpiration(new OneTimeEffectExpirtation())
        .makeMandatory()
        .action(
          new EffectAction(async (effectIe: InstructionExecutor) => {
            await effectIe.gainLoot();
            this.markAsFinished();
          }),
        )
        .build(),
    );
    this.markAsUnfinished();
  }

  public async attack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    await attackedPlayer.getInstructionExecutor().discardDownTo(3);
  }
}
