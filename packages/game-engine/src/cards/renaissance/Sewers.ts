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

export class Sewers extends Project {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Sewers'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    // When you trash a card other than with Sewers, you may trash a card from your hand.
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TRASH, EffectSource.SELF)
        .action(
          new EffectAction(async (ie: InstructionExecutor) => {
            const cardToTrash: Card | Choice = await ie
              .chooseCard('Sewers: you may trash a card from your hand')
              .from(CardLocation.HAND)
              .to(CardSelectionPurpose.TRASH)
              .allowNoneOption()
              .choose();
            if (cardToTrash instanceof Card) {
              await ie.trashCardFromLocation(cardToTrash, CardLocation.HAND);
            }
          }),
        )
        .build(),
    );
  }
}
