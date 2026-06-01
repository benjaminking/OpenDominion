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

export class Kiln extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Kiln'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addCoins(2);

    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.PLAYED_CARD, EffectSource.SELF)
        .onTurn(ie.createThisTurnEligibilityFunction())
        .withExpiration(ie.createOnceThisTurnEffectExpiration())
        .makeMandatory()
        .action(
          new EffectAction(async (ie2: InstructionExecutor, card: Card) => {
            await ie2
              .chooseOneOption('You may gain a copy of that card')
              .from(
                new ActionChoice('Gain a copy', async () => {
                  await ie2.gainFromPile(card.getPileName());
                }),
              )
              .from(new ActionChoice('Skip', async () => Promise.resolve()))
              .choose();
          }),
        )
        .build(),
    );
  }
}
