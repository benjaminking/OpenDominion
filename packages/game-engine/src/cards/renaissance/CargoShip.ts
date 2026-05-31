import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

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
          new EffectAction(async (ie: InstructionExecutor, card: Card) => {
            setAsideCard = card;
            await ie.setCardAsideFromLocation(card, card.getLocation());
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
