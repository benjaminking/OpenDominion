import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// Royal Seal (Treasure): $2. While this is in play, when you gain a card, you may put it onto your deck.
export class RoyalSeal extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Royal Seal'));
    this.setCoins(2);
    this.markAsSimpleTreasure();
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(2);
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.GAIN, EffectSource.ANYONE)
        .onTurn(ie.createThisTurnEligibilityFunction())
        .withExpiration(ie.createStartOfMyNextTurnEffectExpiration())
        .action(
          new EffectAction(async (effectIe: InstructionExecutor, gainedCards: CardCollection) => {
            for (const gained of gainedCards) {
              if (gained.getLocation() === CardLocation.DISCARD) {
                await effectIe
                  .chooseOneOption(`Royal Seal: Put ${gained.getName()} onto your deck?`)
                  .from(
                    new ActionChoice('Put onto deck', async () => {
                      await effectIe.topDeckCardFromLocation(gained, CardLocation.DISCARD);
                    }),
                  )
                  .from(new ActionChoice('Leave in discard'))
                  .choose();
              }
            }
          }),
        )
        .build(),
    );
  }
}
