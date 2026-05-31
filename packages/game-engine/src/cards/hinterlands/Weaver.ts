import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectCondition } from '../../effects/EffectCondition';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { costsUpTo, isTheSameCardAs } from '../../StandardCardEligibilityFunctions';
import { TurnPhase } from '../../turns/TurnPhase';

export class Weaver extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Weaver'));

    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.DISCARD, EffectSource.SELF)
        .whereCardIs(isTheSameCardAs(this))
        .addCondition(
          new EffectCondition(
            (ie: InstructionExecutor) => ie.getSharedGameState().getTurnPhase() !== TurnPhase.CLEANUP,
          ),
        )
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
            .allowNoneOption()
            .choose();
          if (cardToGain instanceof Card) {
            await ie.gainCardFromPile(cardToGain);
          }
        }),
      )
      .choose();
  }

  private async reaction(ie: InstructionExecutor, _target: Card): Promise<void> {
    await ie
      .chooseOneOption('You may play Weaver')
      .from(
        new ActionChoice('Play Weaver', async () => {
          await ie.playCardFromLocation(this, this.getLocation());
        }),
      )
      .from(new ActionChoice('Do not play'))
      .choose();
  }
}
