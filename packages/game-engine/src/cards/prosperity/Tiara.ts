import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectCondition } from '../../effects/EffectCondition';
import { EffectContext } from '../../effects/EffectContext';
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
        // Only for a card gained to the discard pile or hand, while it's still there (not yet trashed, topdecked or
        // exchanged)
        .addCondition(
          new EffectCondition((_ie: InstructionExecutor, effectContext: EffectContext) => {
            const gainLocation = effectContext.getGainLocation();
            return gainLocation === CardLocation.DISCARD || gainLocation === CardLocation.HAND;
          }),
        )
        .withExpiration(new RestOfTurnEffectExpiration(ie.getSharedGameState().getCurrentTurn()))
        .action(
          new EffectAction(async (effectIe: InstructionExecutor, effectContext: EffectContext) => {
            const gainedCard = effectContext.getTargetCard()!;
            if (!effectContext.getLocationExpectation()!.isMet(gainedCard)) {
              effectIe.sendLostTrackMessage(gainedCard);
              return;
            }
            await effectIe.topDeckCardFromLocation(gainedCard, effectContext.getGainLocation()!);
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
      await ie.playCardFromHandNTimes(treasureChoice, 2, this);
    }
  }
}
