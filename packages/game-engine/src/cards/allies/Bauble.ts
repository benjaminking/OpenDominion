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
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Bauble extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Bauble'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie
      .chooseMultipleOptions('Choose two different options:')
      .from(
        new ActionChoice('+1 Buy', async () => {
          ie.addBuys(1);
        }),
      )
      .from(
        new ActionChoice('+$1', async () => {
          ie.addCoins(1);
        }),
      )
      .from(
        new ActionChoice('+1 Favor', async () => {
          ie.addFavors(1);
        }),
      )
      .from(
        new ActionChoice('This turn, when you gain a card, you may put it onto your deck', async () => {
          ie.addEffect(
            new Effect.Builder()
              .from(this)
              .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
              .onTurn(ie.createThisTurnEligibilityFunction())
              // Only for a card gained to the discard pile or hand, while it's still there (as Tiara)
              .addCondition(
                new EffectCondition((_ie: InstructionExecutor, effectContext: EffectContext) => {
                  const gainLocation = effectContext.getGainLocation();
                  return gainLocation === CardLocation.DISCARD || gainLocation === CardLocation.HAND;
                }),
              )
              .withExpiration(ie.createRestOfTurnEffectExpiration())
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
        }),
      )
      .choose(2);
  }
}
