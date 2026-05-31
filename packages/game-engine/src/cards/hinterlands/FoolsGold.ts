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
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { cardNameIs, isTheSameCardAs } from '../../StandardCardEligibilityFunctions';

export class FoolsGold extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo("Fool's Gold"));
    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.GAIN, EffectSource.OTHER_PLAYER)
        .whereCardIs(cardNameIs('Province'))
        .addCondition(new EffectCondition(() => this.getLocation() === CardLocation.HAND))
        .action(new EffectAction(this.reaction.bind(this)))
        .build(),
    );
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    if (ie.numMatchingCardsPlayedThisTurn(isTheSameCardAs(this)) === 1) {
      await ie.addCoins(1);
    } else {
      await ie.addCoins(4);
    }
  }

  private async reaction(ie: InstructionExecutor, _gainedCard: Card): Promise<void> {
    await ie
      .chooseOneOption("You may trash Fool's Gold from your hand to gain a Gold onto your deck")
      .from(
        new ActionChoice('Trash and gain Gold onto deck', async () => {
          await ie.revealCard(this);
          await ie.trashCardFromLocation(this, CardLocation.HAND);
          await ie.gainCardFromPile('Gold', CardLocation.DECK);
        }),
      )
      .from(new ActionChoice('Do nothing'))
      .choose();
  }
}
