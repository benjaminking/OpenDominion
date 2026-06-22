import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { OneTimeEffectExpirtation } from '../../effects/StandardEffectExpirations';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { cardNameIs } from '../../StandardCardEligibilityFunctions';

export class Joust extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Joust'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);
    await ie.addCoins(1);

    // You may set aside a Province from your hand
    const province: Card | Choice = await ie
      .chooseCard('You may set aside a Province from your hand to gain a Reward')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.OTHER)
      .whereCardIs(cardNameIs('Province'))
      .allowNoneOption()
      .choose();

    if (province instanceof Card) {
      await ie.setCardAsideFromLocation(province, CardLocation.HAND);
      await ie.chooseRewardToGain(CardLocation.HAND);
      this.addEffect(
        new Effect.Builder()
          .triggerOn(EffectTriggerType.CLEANUP_START, EffectSource.ANYONE)
          .withExpiration(new OneTimeEffectExpirtation())
          .makeMandatory()
          .action(
            new EffectAction(async (ie: InstructionExecutor) =>
              ie.discardCardFromLocation(province, CardLocation.SET_ASIDE),
            ),
          )
          .build(),
      );
    }
  }
}
