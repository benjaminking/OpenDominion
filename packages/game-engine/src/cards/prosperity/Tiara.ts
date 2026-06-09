import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { RestOfTurnEffectExpiration } from '../../effects/StandardEffectExpirations';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { isTreasureCard } from '../../StandardCardEligibilityFunctions';

export class Tiara extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Tiara'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addBuys(1);

    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .onTurn(ie.createThisTurnEligibilityFunction())
        .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
        .withExpiration(new RestOfTurnEffectExpiration(ie.getSharedGameState().getCurrentTurn()))
        .action(
          new EffectAction(async (effectIe: InstructionExecutor, gainedCard: Card) => {
            await effectIe.topDeckCardFromLocation(gainedCard, gainedCard.getLocation());
          }),
        )
        .build(),
    );

    const treasureChoice = await ie
      .chooseCard('You may play a Treasure from your hand twice')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.PLAY_ALT)
      .whereCardIs(isTreasureCard)
      .allowNoneOption()
      .choose();

    if (treasureChoice instanceof Card) {
      await ie.playCardFromHandNTimes(treasureChoice, 2);
    }
  }
}
