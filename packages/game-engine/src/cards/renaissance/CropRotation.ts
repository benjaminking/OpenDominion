import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { Project } from '../../card/Project';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isVictoryCard } from '../../StandardCardEligibilityFunctions';

export class CropRotation extends Project {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Crop Rotation'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    // At the start of your turn, you may discard a Victory card for +2 Cards.
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
        .action(
          new EffectAction(async (ie: InstructionExecutor) => {
            const cardToDiscard: Card | Choice = await ie
              .chooseCard('Crop Rotation: you may discard a Victory card for +2 Cards')
              .from(CardLocation.HAND)
              .to(CardSelectionPurpose.DISCARD)
              .whereCardIs(isVictoryCard)
              .allowNoneOption()
              .choose();
            if (cardToDiscard instanceof Card) {
              await ie.discardCardFromLocation(cardToDiscard, CardLocation.HAND);
              await ie.drawCards(2);
            }
          }),
        )
        .build(),
    );
  }
}
