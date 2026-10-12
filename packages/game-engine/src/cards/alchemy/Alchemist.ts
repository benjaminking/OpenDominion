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
import { cardNameIs } from '../../StandardCardEligibilityFunctions';

export class Alchemist extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Alchemist'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    // Once it has left play (e.g. trashed by Procession, or put onto the deck by its own ability from an earlier
    // play), its ability is still offered, but it has lost track of itself
    const locationExpectation = ie.createLocationExpectation(CardLocation.IN_PLAY);
    await ie.drawCards(2);
    ie.addActions(1);

    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.CLEANUP_START, EffectSource.SELF)
        .onTurn(ie.createThisTurnEligibilityFunction())
        .withExpiration(ie.createOnceThisTurnEffectExpiration())
        .addCondition(
          new EffectCondition((effectIe: InstructionExecutor) => effectIe.hasMatchingCardInPlay(cardNameIs('Potion'))),
        )
        .action(
          new EffectAction(async (effectIe: InstructionExecutor) => {
            if (!locationExpectation.isMet(this)) {
              effectIe.sendLostTrackMessage(this);
              return;
            }
            await effectIe.topDeckCardFromLocation(this, CardLocation.IN_PLAY);
          }),
        )
        .build(),
    );
  }
}
