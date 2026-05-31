import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isActionCard, isTheSameCardAs } from '../../StandardCardEligibilityFunctions';

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
            // TODO: gainFromRuinsPile stub - gain from the shuffled Ruins pile
            await ie.gainFromRuinsPile();
            await ie.gainFromRuinsPile();
          }),
        )
        .build(),
    );
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie
      .chooseOneOption('Choose one:')
      .from(
        new ActionChoice('Trash this Death Cart for +$5', async () => {
          const trashed = await ie.trashCardFromLocation(this, CardLocation.IN_PLAY);
          if (trashed !== undefined) {
            await ie.addCoins(5);
          }
        }),
      )
      .from(
        new ActionChoice('Trash an Action card from your hand for +$5', async () => {
          const cardToTrash: Card | Choice = await ie
            .chooseCard('Choose an Action card to trash for +$5')
            .from(CardLocation.HAND)
            .to(CardSelectionPurpose.TRASH)
            .whereCardIs(isActionCard)
            .allowNoneOption()
            .choose();
          if (cardToTrash instanceof Card) {
            const trashed = await ie.trashCardFromLocation(cardToTrash, CardLocation.HAND);
            if (trashed !== undefined) {
              await ie.addCoins(5);
            }
          }
        }),
      )
      .from(new ActionChoice('No', () => {}))
      .choose();
  }
}
