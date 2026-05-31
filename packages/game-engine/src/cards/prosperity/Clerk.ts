import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectCondition } from '../../effects/EffectCondition';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Clerk extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Clerk'));
    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
        .addCondition(new EffectCondition(() => this.getLocation() === CardLocation.HAND))
        .action(
          new EffectAction(async (ie: InstructionExecutor) => {
            await ie
              .chooseOneOption('Do you want to play Clerk from your hand?')
              .from(
                new ActionChoice('Yes', async () => {
                  await ie.playCardFromLocation(this, CardLocation.HAND);
                }),
              )
              .from(new ActionChoice('No'))
              .choose();
          }),
        )
        .build(),
    );
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(2);
    await ie.eachOtherPlayer(async (otherIe: InstructionExecutor) => {
      if (otherIe.handSize() < 5) {
        return;
      }

      const cardToTopDeck: Card | Choice = await otherIe
        .chooseCard('Choose a card to put onto your deck')
        .from(CardLocation.HAND)
        .to(CardSelectionPurpose.TOPDECK)
        .choose();
      if (cardToTopDeck instanceof Card) {
        await otherIe.topDeckCardFromLocation(cardToTopDeck, CardLocation.HAND);
      }
    });
  }
}
