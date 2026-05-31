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

export class GuardDog extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Guard Dog'));
    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.ATTACK, EffectSource.OTHER_PLAYER)
        .addCondition(new EffectCondition(() => this.getLocation() === CardLocation.HAND))
        .action(new EffectAction(this.reaction.bind(this)))
        .build(),
    );
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(2);
    if (ie.handSize() <= 5) {
      await ie.drawCards(2);
    }
  }

  private async reaction(ie: InstructionExecutor, _attackCard: Card): Promise<void> {
    await ie
      .chooseOneOption('You may play Guard Dog from your hand first')
      .from(
        new ActionChoice('Play Guard Dog', async () => {
          await ie.playCardFromLocation(this, CardLocation.HAND);
        }),
      )
      .from(new ActionChoice('Do not play it'))
      .choose();
  }
}
