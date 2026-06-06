import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectCondition } from '../../effects/EffectCondition';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Watchtower extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Watchtower'));
    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
        .addCondition(new EffectCondition(() => this.getLocation() === CardLocation.HAND))
        .action(
          new EffectAction(async (ie: InstructionExecutor, gainedCard: Card) => {
            await ie.revealCard(this);
            await ie
              .chooseOneOption('What do you want to do with ' + gainedCard.getName() + '?')
              .from(
                new ActionChoice('Trash it', async () => {
                  await ie.trashCardFromLocation(gainedCard, gainedCard.getLocation());
                }),
              )
              .from(
                new ActionChoice('Put it onto your deck', async () => {
                  await ie.topDeckCardFromLocation(gainedCard, gainedCard.getLocation());
                }),
              )
              .choose();
          }),
        )
        .build(),
    );
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawUpTo(6);
  }
}
