import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isTreasureCard } from '../../StandardCardEligibilityFunctions';

export class Herbalist extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Herbalist'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addBuys(1);
    await ie.addCoins(1);

    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.CLEANUP_START, EffectSource.SELF)
        .onTurn(ie.createThisTurnEligibilityFunction())
        .withExpiration(ie.createOnceThisTurnEffectExpiration())
        .action(
          new EffectAction(async (effectIe: InstructionExecutor) => {
            const treasureToTopDeck: Card | Choice = await effectIe
              .chooseCard('You may put a Treasure from play onto your deck')
              .from(CardLocation.IN_PLAY)
              .to(CardSelectionPurpose.TOPDECK)
              .whereCardIs(isTreasureCard)
              .allowNoneOption()
              .choose();

            if (treasureToTopDeck instanceof Card) {
              await effectIe.topDeckCardFromLocation(treasureToTopDeck, CardLocation.IN_PLAY);
            }
          }),
        )
        .build(),
    );
  }
}
