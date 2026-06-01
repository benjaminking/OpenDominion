import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class VillageGreen extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Village Green'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie
      .chooseOneOption('Choose one:')
      .from(
        new ActionChoice('Now: +1 Card and +2 Actions', async () => {
          await ie.drawCards(1);
          ie.addActions(2);
        }),
      )
      .from(
        new ActionChoice('At the start of your next turn: +1 Card and +2 Actions', async () => {
          ie.addEffect(
            new Effect.Builder()
              .from(this)
              .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
              .onTurn(ie.createNextTurnEligibilityFunction())
              .withExpiration(ie.createEndOfMyNextTurnEffectExpiration())
              .makeMandatory()
              .action(
                new EffectAction(async (ie2: InstructionExecutor) => {
                  await ie2.drawCards(1);
                  ie2.addActions(2);
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
