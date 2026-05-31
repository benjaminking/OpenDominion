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
          new EffectAction(async (effectIe: InstructionExecutor, gainedCard: Card) => {
            const choice: Card | Choice = await effectIe
              .chooseCard('Put gained card onto your deck?')
              .from(CardLocation.DISCARD)
              .to(CardSelectionPurpose.OTHER)
              .whereCardIs(anyCard)
              .allowNoneOption()
              .choose();
            if (choice instanceof Card) {
              await effectIe.topDeckCardFromLocation(gainedCard, CardLocation.DISCARD);
            }
          }),
        )
        .build(),
    );
    await ie.receiveBoon();
  }
}
