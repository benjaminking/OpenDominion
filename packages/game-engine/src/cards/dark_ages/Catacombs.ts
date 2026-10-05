import { CardInfoLookup } from '@dominion/card-info';
import { CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { costsLessThanCard, isTheSameCardAs } from '../../StandardCardEligibilityFunctions';

export class Catacombs extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Catacombs'));
    // When you trash this, gain a card costing less than it
    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TRASH)
        .whereCardIs(isTheSameCardAs(this))
        .makeMandatory()
        .action(
          new EffectAction(async (ie: InstructionExecutor) => {
            const cardToGain: Card | Choice = await ie
              .chooseCard('Gain a card costing less than $' + this.getCost().coins.toFixed())
              .from(CardSelectionLocation.SUPPLY)
              .to(CardSelectionPurpose.GAIN)
              .whereCardIs(costsLessThanCard(this))
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
        new ActionChoice('Put them into your hand', () => {
          ie.putCardsIntoHandFromSet(topCards.clone(), topCards);
        }),
      )
      .from(
        new ActionChoice('Discard them and +3 Cards', async () => {
          await ie.discardCardsFromRevealedSet(topCards);
          await ie.drawCards(3);
        }),
      )
      .choose();
  }
}
