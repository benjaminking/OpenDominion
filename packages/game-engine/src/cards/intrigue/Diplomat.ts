import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

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
import { exactlyNChecked } from '../../StandardNumberEligibilityFunctions';

export class Diplomat extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Diplomat'));
    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.ATTACK, EffectSource.OTHER_PLAYER)
        .addCondition(
          new EffectCondition((ie: InstructionExecutor) => {
            return this.getLocation() === CardLocation.HAND && ie.handSize() >= 5;
          }),
        )
        .action(new EffectAction(this.reaction.bind(this)))
        .build(),
    );
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(2);
    if (ie.handSize() <= 5) {
      ie.addActions(2);
    }
  }

  private async reaction(ie: InstructionExecutor, effectContext: EffectContext): Promise<void> {
    await ie.revealCard(this);
    await ie.drawCards(2);
    const cardsToDiscard = await ie
      .chooseCards('Choose three cards to discard')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.DISCARD)
      .whereNumCardsIs(exactlyNChecked(3))
      .choose();
    await ie.discardCardsFromLocation(cardsToDiscard, CardLocation.HAND);

    // With 5 or more cards still in hand, Diplomat can be revealed again for the same Attack. (The engine offers
    // each reaction only once per Attack, so this asks here.)
    if (this.getLocation() === CardLocation.HAND && ie.handSize() >= 5) {
      await ie
        .chooseOneOption('You still have 5 or more cards in hand. Reveal Diplomat again?')
        .from(new ActionChoice('Reveal Diplomat again', async () => this.reaction(ie, effectContext)))
        .from(
          new ActionChoice('No', () => {
            //
          }),
        )
        .choose();
    }
  }
}
