import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardEligibilityFunction } from '../../CardEligibilityFunction';
import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { both, costsExactly, isTheSameCardAs } from '../../StandardCardEligibilityFunctions';

const isNotFarmland = new CardEligibilityFunction((card: Card) => card.getName() !== 'Farmland');

export class Farmland extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Farmland'));
    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
        .whereCardIs(isTheSameCardAs(this))
        .makeMandatory()
        .action(new EffectAction(this.onGain.bind(this)))
        .build(),
    );
  }

  public score(_allCardGroups: CardCollection[]): number {
    return 2;
  }

  private async onGain(ie: InstructionExecutor): Promise<void> {
    const cardToTrash: Card | Choice = await ie
      .chooseCard('Choose a card from your hand to trash')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .choose();
    if (!(cardToTrash instanceof Card)) {
      return;
    }

    const trashedCard = await ie.trashCardFromLocation(cardToTrash, CardLocation.HAND);
    if (trashedCard === undefined) {
      return;
    }

    const cardToGain: Card | Choice = await ie
      .chooseCard('Choose a non-Farmland card costing exactly ' + trashedCard.getCost().plus(2).toString() + ' to gain')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(both(isNotFarmland, costsExactly(trashedCard.getCost().plus(2))))
      .allowNoneOption()
      .choose();

    if (cardToGain instanceof Card) {
      await ie.gainCardFromPile(cardToGain);
    }
  }
}
