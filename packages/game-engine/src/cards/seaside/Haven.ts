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

export class Haven extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Haven'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const cardToSetAside: Card | Choice = await ie
      .chooseCard('Choose a card to set aside')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.OTHER)
      .choose();
    if (!(cardToSetAside instanceof Card)) {
      return;
    }
    await ie.setCardAsideFromLocation(cardToSetAside, CardLocation.HAND);

    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
        .onTurn(ie.createNextTurnEligibilityFunction())
        .withExpiration(ie.createEndOfMyNextTurnEffectExpiration())
        .makeMandatory()
        .action(
          new EffectAction((ie: InstructionExecutor, _targetCard: Card) => {
            ie.putCardIntoHandFromLocation(cardToSetAside, CardLocation.SET_ASIDE);
            this.markAsFinished();
          }),
        )
        .build(),
    );
    this.markAsUnfinished();
  }
}
