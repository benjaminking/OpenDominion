import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { CardShapedObject } from '../../card/CardShapedObject';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectContext } from '../../effects/EffectContext';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { LocationExpectation } from '../../game-state/LocationExpectation';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Library extends KingdomCard {
  private setAsideCards: CardCollection = new CardCollection();
  // The set-aside cards are discarded after the rest of the drawing, which can fire triggers (e.g. on a shuffle)
  private setAsideExpectations = new Map<Card, LocationExpectation>();

  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Library'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    this.setAsideCards = new CardCollection();
    this.setAsideExpectations = new Map<Card, LocationExpectation>();
    this.addEffect(
      new Effect.Builder()
        .from(this as unknown as CardShapedObject)
        .triggerOn(EffectTriggerType.REVEALED_ACTION_DURING_DTX, EffectSource.SELF)
        .makeMandatory()
        .action(
          new EffectAction(async (ie: InstructionExecutor, effectContext: EffectContext) => {
            const card = effectContext.getTargetCard()!;
            await ie
              .chooseOneOption('The top card is ' + card.getName() + '. What do you want to do?')
              .from(
                new ActionChoice('Draw it into your hand', async () => {
                  await ie.drawCards(1);
                }),
              )
              .from(
                new ActionChoice('Set it aside', async () => {
                  if (!effectContext.getLocationExpectation()!.isMet(card)) {
                    ie.sendLostTrackMessage(card);
                    return;
                  }
                  const setAsideExpectation = ie.createLocationExpectation(CardLocation.SET_ASIDE);
                  await ie.setCardAsideFromLocation(card, CardLocation.DECK);
                  this.setAsideCards.addCard(card);
                  this.setAsideExpectations.set(card, setAsideExpectation);
                }),
              )
              .choose();
          }),
        )
        .build(),
    );
    await ie.drawUpTo(7);
    const cardsToDiscard = new CardCollection();
    for (const card of this.setAsideCards) {
      if (this.setAsideExpectations.get(card)!.isMet(card)) {
        cardsToDiscard.addCard(card);
      } else {
        ie.sendLostTrackMessage(card);
      }
    }
    if (cardsToDiscard.size() > 0) {
      await ie.discardCardsFromLocation(cardsToDiscard, CardLocation.SET_ASIDE);
    }
    this.removeEffectsByType(EffectTriggerType.REVEALED_ACTION_DURING_DTX);
  }
}
