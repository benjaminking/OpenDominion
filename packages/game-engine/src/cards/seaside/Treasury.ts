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
import { isVictoryCard } from '../../StandardCardEligibilityFunctions';
import { TurnPhase } from '../../turns/TurnPhase';

export class Treasury extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Treasury'));
    this.addEffect(
      new Effect.Builder()
        .from(this)
        // Put onto the deck at the start of Clean-up, from play, instead of when discarded from play
        .triggerOn(EffectTriggerType.CLEANUP_START, EffectSource.SELF)
        .addCondition(
          new EffectCondition(() => this.getLocation() === CardLocation.IN_PLAY && this.canBeDiscardedInCleanup()),
        )
        // Only Victory cards gained in the Buy phase count, not e.g. ones gained with Workshop
        .addCondition(
          new EffectCondition((ie: InstructionExecutor) => {
            return (
              ie
                .getSharedGameState()
                .getCurrentPlayer()
                .getTurnTracker()
                .numMatchingCardsGainedThisTurnByPhase(isVictoryCard, TurnPhase.BUY) === 0
            );
          }),
        )
        .action(
          new EffectAction(async (ie: InstructionExecutor) => {
            await ie.topDeckCardFromLocation(this, CardLocation.IN_PLAY);
          }),
        )
        .build(),
    );
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);
    await ie.addCoins(1);
  }
}
