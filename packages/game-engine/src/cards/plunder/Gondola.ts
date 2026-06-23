import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Gondola extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Gondola'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie
      .chooseOneOption('Choose when to get +$2')
      .from(
        new ActionChoice('Now', async () => {
          await ie.addCoins(2);
        }),
      )
      .from(
        new ActionChoice('At the start of your next turn', async () => {
          ie.addEffect(
            new Effect.Builder()
              .from(this)
              .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
              .onTurn(ie.createNextTurnEligibilityFunction())
              .withExpiration(ie.createEndOfMyNextTurnEffectExpiration())
              .makeMandatory()
              .action(
                new EffectAction(async (effectIe: InstructionExecutor) => {
                  await effectIe.addCoins(2);
                  this.markAsFinished();
                }),
              )
              .build(),
          );
          this.markAsUnfinished();
        }),
      )
      .choose();
  }
}
