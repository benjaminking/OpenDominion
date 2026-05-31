import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { costsUpTo, isTheSameCardAs } from '../../StandardCardEligibilityFunctions';

export class Catacombs extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Catacombs'));
    // When you trash this, gain a card costing less than it
    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TRASH)
        .self()
        .whereCardIs(isTheSameCardAs(this))
        .makeMandatory()
        .action(
          new EffectAction(async (ie: InstructionExecutor) => {
            const cardToGain: Card | Choice = await ie
              .chooseCard('Gain a card costing less than $' + this.getCost().coins.toFixed())
              .from(CardSelectionLocation.SUPPLY)
              .to(CardSelectionPurpose.GAIN)
              .whereCardIs(costsUpTo(this.getCost().plus(-1)))
              .allowNoneOption()
              .choose();
            if (cardToGain instanceof Card) {
              await ie.gainCardFromPile(cardToGain);
            }
          }),
        )
        .build(),
    );
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const topCards: CardCollection = await ie.takeCardsOffDeck(3);
    await ie.revealCards(topCards);

    await ie
      .chooseOneOption('Choose one:')
      .from(
        new ActionChoice('Put all 3 cards into your hand', () => {
          ie.putCardsIntoHandFromSet(topCards.clone(), topCards);
        }),
      )
      .from(
        new ActionChoice('Discard all 3 and +3 Cards', async () => {
          const toDiscard = topCards.clone();
          await ie.discardCardsFromRevealedSet(toDiscard, topCards);
          await ie.drawCards(3);
        }),
      )
      .choose();
  }
}
