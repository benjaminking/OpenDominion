import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { OneTimeEffectExpirtation } from '../../effects/StandardEffectExpirations';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { isTreasureCard } from '../../StandardCardEligibilityFunctions';
import { upToNChecked } from '../../StandardNumberEligibilityFunctions';

export class SecludedShrine extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Secluded Shrine'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(1);

    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
        .whereCardIs(isTreasureCard)
        .withExpiration(new OneTimeEffectExpirtation())
        .makeMandatory()
        .action(
          new EffectAction(async (effectIe: InstructionExecutor) => {
            const cardsToTrash = await effectIe
              .chooseCards('You may trash up to 2 cards from your hand')
              .from(CardLocation.HAND)
              .to(CardSelectionPurpose.TRASH)
              .whereNumCardsIs(upToNChecked(2))
              .choose();
            await effectIe.trashCardsFromLocation(cardsToTrash, CardLocation.HAND);
            this.markAsFinished();
          }),
        )
        .build(),
    );
    this.markAsUnfinished();
  }
}
