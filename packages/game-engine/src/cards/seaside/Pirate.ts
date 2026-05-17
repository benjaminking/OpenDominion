import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectCondition } from '../../effects/EffectCondition';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { both, costsUpTo, isTreasureCard } from '../../StandardCardEligibilityFunctions';

export class Pirate extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Pirate'));
    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.GAIN, EffectSource.OTHER_PLAYER)
        .whereCardIs(isTreasureCard)
        .addCondition(
          new EffectCondition((_ie: InstructionExecutor) => {
            return this.getLocation() === CardLocation.HAND;
          }),
        )
        .action(
          new EffectAction(async (ie: InstructionExecutor) => {
            await ie.playCardFromLocation(this, CardLocation.HAND);
          }),
        )
        .build(),
    );
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
        .makeMandatory()
        .action(
          new EffectAction(async (ie: InstructionExecutor) => {
            const cardChoice: Card | Choice = await ie
              .chooseCard('Gain a Treasure costing up to $6 to your hand')
              .from(CardSelectionLocation.SUPPLY)
              .to(CardSelectionPurpose.GAIN)
              .whereCardIs(both(isTreasureCard, costsUpTo(Cost.Simple(6))))
              .choose();
            if (cardChoice instanceof Card) {
              await ie.gainCardFromPile(cardChoice, CardLocation.HAND);
            }
            this.markAsFinished();
          }),
        )
        .build(),
    );
    this.markAsUnfinished();
    return Promise.resolve();
  }
}
