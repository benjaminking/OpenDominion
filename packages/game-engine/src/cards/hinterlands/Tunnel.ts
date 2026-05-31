import { CardInfoLookup } from '@dominion/card-info';
import { TurnPhase } from '../../turns/TurnPhase';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
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

export class Tunnel extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Tunnel'));

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

  public score(_allCardGroups: CardCollection[]): number {
    return 2;
  }

  private async reaction(ie: InstructionExecutor, _targetCard: Card): Promise<void> {
    await ie
      .chooseOneOption('You may reveal Tunnel to gain a Gold')
      .from(
        new ActionChoice('Reveal and gain Gold', async () => {
          await ie.revealCard(this);
          await ie.gainCardFromPile('Gold');
        }),
      )
      .from(new ActionChoice('Do not reveal'))
      .choose();
  }
}
