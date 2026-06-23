import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Amphora extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Amphora'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie
      .chooseOneOption('Choose when to get +1 Buy and +$3')
      .from(
        new ActionChoice('Now', async () => {
          ie.addBuys(1);
          await ie.addCoins(3);
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
                  effectIe.addBuys(1);
                  await effectIe.addCoins(3);
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
