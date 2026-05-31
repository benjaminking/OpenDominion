import { CardInfoLookup } from '@dominion/card-info';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class SprawlingCastle extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Sprawling Castle'));

    // On gain: gain a Duchy or 3 Estates
    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
        .makeMandatory()
        .action(
          new EffectAction(async (ie: InstructionExecutor) => {
            await ie
              .chooseOneOption('Choose one:')
              .from(
                new ActionChoice('Gain a Duchy', async () => {
                  await ie.gainCardFromPile('Duchy');
                }),
              )
              .from(
                new ActionChoice('Gain 3 Estates', async () => {
                  for (let i = 0; i < 3; i++) {
                    await ie.gainCardFromPile('Estate');
                  }
                }),
              )
              .choose();
          }),
        )
        .build(),
    );
  }

  public score(_allCardGroups: CardCollection[]): number {
    return 4;
  }
}

