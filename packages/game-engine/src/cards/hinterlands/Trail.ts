import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectCondition } from '../../effects/EffectCondition';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isTheSameCardAs } from '../../StandardCardEligibilityFunctions';
import { TurnPhase } from '../../turns/TurnPhase';

export class Trail extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Trail'));

    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
        .whereCardIs(isTheSameCardAs(this))
        .addCondition(
          new EffectCondition(
            (ie: InstructionExecutor) => ie.getSharedGameState().getTurnPhase() !== TurnPhase.CLEANUP,
          ),
        )
        .action(new EffectAction(this.reaction.bind(this)))
        .build(),
    );
    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TRASH, EffectSource.SELF)
        .whereCardIs(isTheSameCardAs(this))
        .addCondition(
          new EffectCondition(
            (ie: InstructionExecutor) => ie.getSharedGameState().getTurnPhase() !== TurnPhase.CLEANUP,
          ),
        )
        .action(new EffectAction(this.reaction.bind(this)))
        .build(),
    );
    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.DISCARD, EffectSource.SELF)
        .whereCardIs(isTheSameCardAs(this))
        .addCondition(
          new EffectCondition(
            (ie: InstructionExecutor) => ie.getSharedGameState().getTurnPhase() !== TurnPhase.CLEANUP,
          ),
        )
        .action(new EffectAction(this.reaction.bind(this)))
        .build(),
    );
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);
  }

  private async reaction(ie: InstructionExecutor, _target: Card): Promise<void> {
    await ie
      .chooseOneOption('You may play Trail')
      .from(
        new ActionChoice('Play Trail', async () => {
          await ie.playCardFromLocation(this, this.getLocation());
        }),
      )
      .from(new ActionChoice('Do not play'))
      .choose();
  }
}
