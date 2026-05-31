import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Stronghold extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Stronghold'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie
      .chooseOneOption('Choose one:')
      .from(
        new ActionChoice('+$3', async () => {
          ie.addCoins(3);
        }),
      )
      .from(
        new ActionChoice('At the start of your next turn, +3 Cards', async () => {
          ie.addEffect(
            new Effect.Builder()
              .from(this)
              .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
              .onTurn(ie.createNextTurnEligibilityFunction())
              .withExpiration(ie.createEndOfMyNextTurnEffectExpiration())
              .makeMandatory()
              .action(
                new EffectAction(async (ie2: InstructionExecutor) => {
                  await ie2.drawCards(3);
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
