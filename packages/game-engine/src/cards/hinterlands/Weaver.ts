import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectContext } from '../../effects/EffectContext';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { isNotCleanup } from '../../effects/StandardEffectConditions';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { costsUpTo, isTheSameCardAs } from '../../StandardCardEligibilityFunctions';

export class Weaver extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Weaver'));

    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.DISCARD, EffectSource.SELF)
        .whereCardIs(isTheSameCardAs(this))
        .addCondition(isNotCleanup)
        .action(new EffectAction(this.reaction.bind(this)))
        .build(),
    );
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie
      .chooseOneOption('Choose one:')
      .from(
        new ActionChoice('Gain two Silvers', async () => {
          await ie.gainCardFromPile('Silver');
          await ie.gainCardFromPile('Silver');
        }),
      )
      .from(
        new ActionChoice('Gain a card costing up to $4', async () => {
          const cardToGain: Card | Choice = await ie
            .chooseCard('Choose a card costing up to $4 to gain')
            .from(CardSelectionLocation.SUPPLY)
            .to(CardSelectionPurpose.GAIN)
            .whereCardIs(costsUpTo(Cost.Simple(4)))
            .choose();
          if (cardToGain instanceof Card) {
            await ie.gainCardFromPile(cardToGain);
          }
        }),
      )
      .choose();
  }

  // Once something else has moved it since it was discarded (e.g. a discarded Trail's +1 Card shuffling it into the
  // deck and drawing it), it has lost track of itself
  private async reaction(ie: InstructionExecutor, effectContext: EffectContext): Promise<void> {
    if (!effectContext.getLocationExpectation()!.isMet(this)) {
      ie.sendLostTrackMessage(this);
      return;
    }
    await ie.playCardFromLocation(this, CardLocation.DISCARD);
  }
}
