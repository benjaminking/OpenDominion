import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, CardType, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { CardEligibilityFunction } from '../../CardEligibilityFunction';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { costsUpTo, isActionCard } from '../../StandardCardEligibilityFunctions';

const isNonDurationNonCommandAction = new CardEligibilityFunction(
  (c: Card) => isActionCard.matches(c) && !c.hasType(CardType.DURATION) && !c.hasType(CardType.COMMAND),
);

// Prince (Action/Duration/Command): You may set aside (on this) a non-Duration, non-Command
// Action card costing up to $4 from your hand.
// At the start of each of your turns, play that card, leaving it set aside.
export class Prince extends KingdomCard {
  private setAsideCard: Card | undefined;

  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Prince'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const chosen: Card | Choice = await ie
      .chooseCard('Set aside a non-Duration, non-Command Action costing up to $4')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.OTHER)
      .whereCardIs(costsUpTo(Cost.Simple(4)))
      .whereCardIs(isNonDurationNonCommandAction)
      .allowNoneOption()
      .choose();
    if (!(chosen instanceof Card)) {
      return;
    }
    await ie.setCardAsideFromLocation(chosen, CardLocation.HAND);
    this.setAsideCard = chosen;
    this.addPrinceEffect(ie);
    this.markAsUnfinished();
  }

  private addPrinceEffect(ie: InstructionExecutor): void {
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
        .onTurn(ie.createNextTurnEligibilityFunction())
        .withExpiration(ie.createEndOfMyNextTurnEffectExpiration())
        .makeMandatory()
        .action(
          new EffectAction(async (effectIe: InstructionExecutor) => {
            if (this.setAsideCard !== undefined) {
              await effectIe.playCardFromLocation(this.setAsideCard, CardLocation.SET_ASIDE);
              // Re-register to trigger every turn
              this.addPrinceEffect(effectIe);
            }
          }),
        )
        .build(),
    );
  }
}
