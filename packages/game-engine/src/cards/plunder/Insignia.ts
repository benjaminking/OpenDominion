import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectCondition } from '../../effects/EffectCondition';
import { EffectContext } from '../../effects/EffectContext';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { RestOfTurnEffectExpiration } from '../../effects/StandardEffectExpirations';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Insignia extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Insignia'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(3);

    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .onTurn(ie.createThisTurnEligibilityFunction())
        .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
        // Only for a card gained to the discard pile or hand (a card gained onto the deck is already there)
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
            await effectIe
              .chooseOneOption('Do you want to put ' + gainedCard.getName() + ' onto your deck?')
              .from(
                new ActionChoice('Yes', async () => {
                  if (!effectContext.getLocationExpectation()!.isMet(gainedCard)) {
                    effectIe.sendLostTrackMessage(gainedCard);
                    return;
                  }
                  await effectIe.topDeckCardFromLocation(gainedCard, effectContext.getGainLocation()!);
                }),
              )
              .from(new ActionChoice('No', () => Promise.resolve()))
              .choose();
          }),
        )
        .build(),
    );
  }
}
