import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
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
        .withExpiration(new RestOfTurnEffectExpiration(ie.getSharedGameState().getCurrentTurn()))
        .action(
          new EffectAction(async (effectIe: InstructionExecutor, gainedCard: Card) => {
            await effectIe
              .chooseOneOption('Do you want to put ' + gainedCard.getName() + ' onto your deck?')
              .from(
                new ActionChoice('Yes', async () =>
                  effectIe.topDeckCardFromLocation(gainedCard, gainedCard.getLocation()),
                ),
              )
              .from(new ActionChoice('No', () => Promise.resolve()))
              .choose();
          }),
        )
        .build(),
    );
  }
}
