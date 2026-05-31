import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isInLocation } from '../../StandardCardEligibilityFunctions';

// Faithful Hound (Action/Reaction): +2 Cards.
// Reaction: When you discard this during Clean-up, you may set it aside.
// If you do, put it into your hand at the start of your next turn.
export class FaithfulHound extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Faithful Hound'));
    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.DISCARD, EffectSource.SELF)
        .whereCardIs(isInLocation(CardLocation.IN_PLAY))
        .action(new EffectAction(this.reaction.bind(this)))
        .build(),
    );
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(2);
  }

  private async reaction(ie: InstructionExecutor, _discardedCard: Card): Promise<void> {
    ie.setCardAside(this);
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
        .onTurn(ie.createNextTurnEligibilityFunction())
        .withExpiration(ie.createEndOfMyNextTurnEffectExpiration())
        .makeMandatory()
        .action(
          new EffectAction((effectIe: InstructionExecutor) => {
            effectIe.putCardIntoHandFromLocation(this, CardLocation.SET_ASIDE);
          }),
        )
        .build(),
    );
  }
}
