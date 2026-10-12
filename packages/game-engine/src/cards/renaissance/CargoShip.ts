import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectContext } from '../../effects/EffectContext';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class CargoShip extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Cargo Ship'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(2);

    let setAsideCard: Card | undefined;

    // Once this turn, when you gain a card, you may set it aside (on this).
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
        .onTurn(ie.createThisTurnEligibilityFunction())
        .withExpiration(ie.createOnceThisTurnEffectExpiration())
        .action(
          new EffectAction(async (ie: InstructionExecutor, effectContext: EffectContext) => {
            const gainedCard = effectContext.getTargetCard()!;
            if (!effectContext.getLocationExpectation()!.isMet(gainedCard)) {
              ie.sendLostTrackMessage(gainedCard);
              return;
            }
            setAsideCard = await ie.setCardAsideFromLocation(gainedCard, effectContext.getGainLocation()!);
          }),
        )
        .build(),
    );

    // At the start of your next turn, put the set-aside card into hand.
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
        .onTurn(ie.createNextTurnEligibilityFunction())
        .withExpiration(ie.createEndOfMyNextTurnEffectExpiration())
        .makeMandatory()
        .action(
          new EffectAction((ie: InstructionExecutor) => {
            if (setAsideCard !== undefined) {
              ie.putCardIntoHandFromLocation(setAsideCard, CardLocation.SET_ASIDE);
            }
            this.markAsFinished();
          }),
        )
        .build(),
    );

    this.markAsUnfinished();
  }
}
