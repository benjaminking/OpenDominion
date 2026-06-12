import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectCondition } from '../../effects/EffectCondition';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { cardNameIs } from '../../StandardCardEligibilityFunctions';

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
    if (ie.numMatchingCardsPlayedThisTurn(cardNameIs("Fool's Gold")) === 1) {
      await ie.addCoins(1);
    } else {
      await ie.addCoins(4);
    }
  }

  private async reaction(ie: InstructionExecutor, _gainedCard: Card): Promise<void> {
    await ie.revealCard(this);
    await ie.trashCardFromLocation(this, CardLocation.HAND);
    await ie.gainCardFromPile('Gold', CardLocation.DECK);
  }
}
