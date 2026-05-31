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

export class CityGate extends Project {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('City Gate'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    // At the start of your turn, +1 Card, then put a card from your hand onto your deck.
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
        .makeMandatory()
        .action(
          new EffectAction(async (ie: InstructionExecutor) => {
            await ie.drawCards(1);
            const cardToTopdeck: Card | Choice = await ie
              .chooseCard('City Gate: put a card from your hand onto your deck')
              .from(CardLocation.HAND)
              .to(CardSelectionPurpose.TOPDECK)
              .allowNoneOption()
              .choose();
            if (cardToTopdeck instanceof Card) {
              await ie.topDeckCardFromLocation(cardToTopdeck, CardLocation.HAND);
            }
          }),
        )
        .build(),
    );
  }
}
