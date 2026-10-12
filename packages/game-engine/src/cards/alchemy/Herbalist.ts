import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectCondition } from '../../effects/EffectCondition';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { both, canBeDiscardedInCleanup, isTreasureCard } from '../../StandardCardEligibilityFunctions';

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
        // Only offered when there's a Treasure in play that it could put onto the deck
        .addCondition(
          new EffectCondition((effectIe: InstructionExecutor) =>
            effectIe.hasMatchingCardInPlay(both(isTreasureCard, canBeDiscardedInCleanup)),
          ),
        )
        .action(
          new EffectAction(async (effectIe: InstructionExecutor) => {
            const treasureToTopDeck: Card | Choice = await effectIe
              .chooseCard('You may put a Treasure from play onto your deck')
              .from(CardLocation.IN_PLAY)
              .to(CardSelectionPurpose.TOPDECK)
              .whereCardIs(both(isTreasureCard, canBeDiscardedInCleanup))
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
