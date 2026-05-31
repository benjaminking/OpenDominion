import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { Cost } from '../../card/Cost';
import { Event } from '../../card/Event';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isActionCard, costsUpTo } from '../../StandardCardEligibilityFunctions';

// Summon (Event): Gain an Action card costing up to $4. Set it aside.
// If you did, at the start of your next turn, play it.
export class Summon extends Event {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Summon'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    const cardToGain: Card | Choice = await ie
      .chooseCard('Gain an Action card costing up to $4')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(isActionCard)
      .whereCardIs(costsUpTo(Cost.Simple(4)))
      .choose();
    if (!(cardToGain instanceof Card)) {
      return;
    }
    const gained = await ie.gainCardFromPile(cardToGain);
    if (gained === undefined) {
      return;
    }
    await ie.setCardAsideFromLocation(gained, gained.getLocation());
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
        .onTurn(ie.createNextTurnEligibilityFunction())
        .withExpiration(ie.createEndOfMyNextTurnEffectExpiration())
        .makeMandatory()
        .action(
          new EffectAction(async (effectIe: InstructionExecutor) => {
            await effectIe.playCardFromLocation(gained, CardLocation.SET_ASIDE);
          }),
        )
        .build(),
    );
  }
}
