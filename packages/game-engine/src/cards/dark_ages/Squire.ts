import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isAttackCard, isTheSameCardAs } from '../../StandardCardEligibilityFunctions';

export class Squire extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Squire'));
    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TRASH)
        .self()
        .whereCardIs(isTheSameCardAs(this))
        .action(
          new EffectAction(async (ie: InstructionExecutor) => {
            const attackCard: Card | Choice = await ie
              .chooseCard('Gain an Attack card from the Supply')
              .from(CardSelectionLocation.SUPPLY)
              .to(CardSelectionPurpose.GAIN)
              .whereCardIs(isAttackCard)
              .allowNoneOption()
              .choose();
            if (attackCard instanceof Card) {
              await ie.gainCardFromPile(attackCard);
            }
          }),
        )
        .build(),
    );
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(1);
    await ie
      .chooseOneOption('Choose one:')
      .from(
        new ActionChoice('+2 Actions', () => {
          ie.addActions(2);
        }),
      )
      .from(
        new ActionChoice('+2 Buys', () => {
          ie.addBuys(2);
        }),
      )
      .from(new ActionChoice('Gain a Silver', async () => await ie.gainFromPile('silver')))
      .choose();
  }
}
