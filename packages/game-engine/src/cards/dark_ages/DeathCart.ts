import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { either, isActionCard, isTheSameCardAs } from '../../StandardCardEligibilityFunctions';

export class DeathCart extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Death Cart'));
    // When you gain this, gain 2 Ruins
    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
        .self()
        .whereCardIs(isTheSameCardAs(this))
        .makeMandatory()
        .action(
          new EffectAction(async (ie: InstructionExecutor) => {
            await ie.gainFromPile('Ruins');
            await ie.gainFromPile('Ruins');
          }),
        )
        .build(),
    );
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const cardToTrash: Card | Choice = await ie
      .chooseCard('Choose an Action card to trash for +$5')
      .from(CardLocation.HAND)
      .from(CardLocation.IN_PLAY)
      .to(CardSelectionPurpose.TRASH)
      .whereCardIs(either(isActionCard, isTheSameCardAs(this)))
      .allowNoneOption()
      .choose();
    if (cardToTrash instanceof Card) {
      const trashed = await ie.trashCardFromLocation(cardToTrash, CardLocation.HAND);
      if (trashed !== undefined) {
        await ie.addCoins(5);
      }
    }
  }
}
