import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { SharedGameState } from '../../game-state/SharedGameState';
import { Pile } from '../../piles/Pile';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { AddedPilePostAction } from '../../setup/AddedPilePostAction';
import { PileAddingSetupRule } from '../../setup/PileAddingSetupRule';
import { PileSpecification } from '../../setup/PileSpecification';
import { both, costsExactly, either, isKingdomCard, isTheSameCardAs } from '../../StandardCardEligibilityFunctions';

export class Ferryman extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Ferryman'));
    this.addSetupRule(new PileAddingSetupRule(new PileSpecification(both(isKingdomCard, either(costsExactly(Cost.Simple(3)), costsExactly(Cost.Simple(4))))),
      new AddedPilePostAction((pile: Pile) => {
        this.addEffect(
          new Effect.Builder()
            .from(this)
            .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
            .whereCardIs(isTheSameCardAs(this))
            .makeMandatory()
            .action(new EffectAction(async (ie: InstructionExecutor) => ie.gainCardFromPile(pile.name)))
            .build()
      )
    })))
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(2);
    ie.addActions(1);

    const toDiscard: Card | Choice = await ie
      .chooseCard('Discard a card')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.DISCARD)
      .choose();
    if (toDiscard instanceof Card) {
      await ie.discardCardFromLocation(toDiscard, CardLocation.HAND);
    }
  }
}
