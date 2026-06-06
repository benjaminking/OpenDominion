import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Library extends KingdomCard {
  private setAsideCards: CardCollection = new CardCollection();

  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Library'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    this.setAsideCards = new CardCollection();
    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.REVEALED_ACTION_DURING_DTX, EffectSource.SELF)
        .makeMandatory()
        .action(
          new EffectAction(async (ie: InstructionExecutor, card: Card) => {
            await ie
              .chooseOneOption('The top card is ' + card.getName() + '. What do you want to do?')
              .from(
                new ActionChoice('Draw it into your hand', async () => {
                  await ie.drawCards(1);
                }),
              )
              .from(
                new ActionChoice('Set it aside', async () => {
                  await ie.setCardAsideFromLocation(card, CardLocation.DECK);
                  this.setAsideCards.addCard(card);
                }),
              )
              .choose();
          }),
        )
        .build(),
    );
    await ie.drawUpTo(7);
    if (this.setAsideCards.size() > 0) {
      await ie.discardCardsFromLocation(this.setAsideCards, CardLocation.SET_ASIDE);
    }
    this.removeEffectsByType(EffectTriggerType.REVEALED_ACTION_DURING_DTX);
  }
}
