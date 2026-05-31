import { CardInfoLookup } from '@dominion/card-info';
import { CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { cardNameIs, isTheSameCardAs } from '../../StandardCardEligibilityFunctions';

export class HuntingGrounds extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Hunting Grounds'));
    // When you trash this, gain a Duchy or 3 Estates
    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TRASH)
        .self()
        .whereCardIs(isTheSameCardAs(this))
        .makeMandatory()
        .action(
          new EffectAction(async (ie: InstructionExecutor) => {
            await ie
              .chooseOneOption('Choose one:')
              .from(
                new ActionChoice('Gain a Duchy', async () => {
                  await ie.gainFromPile('duchy');
                }),
              )
              .from(
                new ActionChoice('Gain 3 Estates', async () => {
                  await ie.gainFromPile('estate');
                  await ie.gainFromPile('estate');
                  await ie.gainFromPile('estate');
                }),
              )
              .choose();
          }),
        )
        .build(),
    );
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(4);
  }
}
