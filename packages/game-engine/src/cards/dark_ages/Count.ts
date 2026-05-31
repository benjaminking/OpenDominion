import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { anyCard } from '../../StandardCardEligibilityFunctions';
import { exactlyNChecked } from '../../StandardNumberEligibilityFunctions';

export class Count extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Count'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    // First choice
    await ie
      .chooseOneOption('Choose one:')
      .from(
        new ActionChoice('Discard 2 cards', async () => {
          const toDiscard: CardCollection = await ie
            .chooseCards('Choose 2 cards to discard')
            .from(CardLocation.HAND)
            .to(CardSelectionPurpose.DISCARD)
            .whereNumCardsIs(exactlyNChecked(2))
            .choose();
          await ie.discardCardsFromLocation(toDiscard, CardLocation.HAND);
        }),
      )
      .from(
        new ActionChoice('Put a card from your hand onto your deck', async () => {
          const card: Card | Choice = await ie
            .chooseCard('Choose a card from your hand to put onto your deck')
            .from(CardLocation.HAND)
            .to(CardSelectionPurpose.TOPDECK)
            .allowNoneOption()
            .choose();
          if (card instanceof Card) {
            await ie.topDeckCardFromLocation(card, CardLocation.HAND);
          }
        }),
      )
      .from(
        new ActionChoice('Gain a Copper to your hand', async () => {
          await ie.gainFromPile('copper', CardLocation.HAND);
        }),
      )
      .choose();

    // Second choice
    await ie
      .chooseOneOption('Choose one:')
      .from(
        new ActionChoice('+$3', async () => {
          await ie.addCoins(3);
        }),
      )
      .from(
        new ActionChoice('Trash your hand', async () => {
          const hand: CardCollection = ie.getMatchingCardsInHand(anyCard);
          await ie.trashCardsFromLocation(hand, CardLocation.HAND);
        }),
      )
      .from(
        new ActionChoice('Gain a Duchy', async () => {
          await ie.gainFromPile('duchy');
        }),
      )
      .choose();
  }
}
