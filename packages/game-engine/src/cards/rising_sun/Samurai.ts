import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectCondition } from '../../effects/EffectCondition';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Samurai extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Samurai'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const playedTurnNumber = ie.getSharedGameState().getCurrentTurn().getUnofficialNumber();

    await ie.eachOtherPlayer(async (otherIe: InstructionExecutor) => {
      await otherIe.discardDownTo(3);
    });

    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
        .makeMandatory()
        .addCondition(new EffectCondition(() => this.getLocation() === CardLocation.IN_PLAY))
        .addCondition(
          new EffectCondition(
            (effectIe: InstructionExecutor) =>
              effectIe.getSharedGameState().getCurrentTurn().getUnofficialNumber() > playedTurnNumber,
          ),
        )
        .action(
          new EffectAction(async (effectIe: InstructionExecutor) => {
            await effectIe.addCoins(1);
          }),
        )
        .build(),
    );
    this.markAsUnfinished();
  }
}
