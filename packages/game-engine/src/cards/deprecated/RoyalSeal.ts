import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectCondition } from '../../effects/EffectCondition';
import { EffectContext } from '../../effects/EffectContext';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

// Royal Seal (Treasure): $2. While this is in play, when you gain a card, you may put it onto your deck.
export class RoyalSeal extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Royal Seal'));
    this.setCoins(2);
    this.markAsSimpleTreasure();
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(2);
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .onTurn(ie.createThisTurnEligibilityFunction())
        .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
        // Only while this is in play, for a card gained to the discard pile or hand, while it's still there
        .addCondition(
          new EffectCondition((_ie: InstructionExecutor, effectContext: EffectContext) => {
            const gainLocation = effectContext.getGainLocation();
            return (
              this.getLocation() === CardLocation.IN_PLAY &&
              (gainLocation === CardLocation.DISCARD || gainLocation === CardLocation.HAND)
            );
          }),
        )
        .withExpiration(ie.createRestOfTurnEffectExpiration())
        .action(
          new EffectAction(async (effectIe: InstructionExecutor, effectContext: EffectContext) => {
            const gainedCard = effectContext.getTargetCard()!;
            if (!effectContext.getLocationExpectation()!.isMet(gainedCard)) {
              effectIe.sendLostTrackMessage(gainedCard);
              return;
            }
            await effectIe.topDeckCardFromLocation(gainedCard, effectContext.getGainLocation()!);
          }),
        )
        .build(),
    );
  }
}
