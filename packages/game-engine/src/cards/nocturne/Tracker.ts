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
import { anyCard } from '../../StandardCardEligibilityFunctions';

// Tracker (Action/Fate): +$1. This turn, when you gain a card, you may put it onto your deck.
// Receive a Boon.
export class Tracker extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Tracker'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(1);
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
        .onTurn(ie.createThisTurnEligibilityFunction())
        .withExpiration(ie.createOnceThisTurnEffectExpiration())
        .action(
          new EffectAction(async (effectIe: InstructionExecutor, effectContext: EffectContext) => {
            const gainedCard = effectContext.getTargetCard()!;
            const choice: Card | Choice = await effectIe
              .chooseCard('Put gained card onto your deck?')
              .from(CardLocation.DISCARD)
              .to(CardSelectionPurpose.OTHER)
              .whereCardIs(anyCard)
              .allowNoneOption()
              .choose();
            if (choice instanceof Card) {
              await effectIe.topDeckCardFromLocation(gainedCard, effectContext.getGainLocation()!);
            }
          }),
        )
        .build(),
    );
    await ie.receiveBoon();
  }
}
