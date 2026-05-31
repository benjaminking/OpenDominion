import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

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
              .action(
                new EffectAction(async (ie2: InstructionExecutor, gainedCard: Card) => {
                  await ie2
                    .chooseOneOption('Put gained card onto your deck?')
                    .from(
                      new ActionChoice('Yes', async () => {
                        await ie2.topDeckCardFromLocation(gainedCard, gainedCard.getLocation());
                      }),
                    )
                    .from(new ActionChoice('No', async () => Promise.resolve()))
                    .choose();
                }),
              )
              .build(),
          );
        }),
      )
      .choose(2);
  }
}
