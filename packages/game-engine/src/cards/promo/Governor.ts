import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { costsExactly } from '../../StandardCardEligibilityFunctions';

// Governor (Action): +1 Action. Choose one; you get the version in parentheses:
// Each player gets +1 (+3) Cards; or each player gains a Silver (Gold);
// or each player may trash a card from their hand and gain a card costing exactly $1 ($2) more.
export class Governor extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Governor'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);
    await ie
      .chooseOneOption('Choose one:')
      .from(
        new ActionChoice('Each player gets +1 Card (+3 for you)', async () => {
          await ie.eachOtherPlayer(async (otherIe) => {
            await otherIe.drawCards(1);
          });
          await ie.drawCards(3);
        }),
      )
      .from(
        new ActionChoice('Each player gains a Silver (Gold for you)', async () => {
          await ie.eachOtherPlayer(async (otherIe) => {
            await otherIe.gainFromPile('Silver');
          });
          await ie.gainFromPile('Gold');
        }),
      )
      .from(
        new ActionChoice('Each player may trash and gain +$1 (you gain +$2 more)', async () => {
          await ie.eachOtherPlayer(async (otherIe) => {
            const cardToTrash: Card | Choice = await otherIe
              .chooseCard('You may trash a card and gain one costing exactly $1 more')
              .from(CardLocation.HAND)
              .to(CardSelectionPurpose.TRASH)
              .allowNoneOption()
              .choose();
            if (cardToTrash instanceof Card) {
              const trashed = await otherIe.trashCardFromLocation(cardToTrash, CardLocation.HAND);
              if (trashed !== undefined) {
                const toGain: Card | Choice = await otherIe
                  .chooseCard(`Gain a card costing exactly $${trashed.getCost().plus(1).coins}`)
                  .from(CardSelectionLocation.SUPPLY)
                  .to(CardSelectionPurpose.GAIN)
                  .whereCardIs(costsExactly(trashed.getCost().plus(1)))
                  .choose();
                if (toGain instanceof Card) {
                  await otherIe.gainCardFromPile(toGain);
                }
              }
            }
          });
          const cardToTrash: Card | Choice = await ie
            .chooseCard('You may trash a card and gain one costing exactly $2 more')
            .from(CardLocation.HAND)
            .to(CardSelectionPurpose.TRASH)
            .allowNoneOption()
            .choose();
          if (cardToTrash instanceof Card) {
            const trashed = await ie.trashCardFromLocation(cardToTrash, CardLocation.HAND);
            if (trashed !== undefined) {
              const toGain: Card | Choice = await ie
                .chooseCard(`Gain a card costing exactly $${trashed.getCost().plus(2).coins}`)
                .from(CardSelectionLocation.SUPPLY)
                .to(CardSelectionPurpose.GAIN)
                .whereCardIs(costsExactly(trashed.getCost().plus(2)))
                .choose();
              if (toGain instanceof Card) {
                await ie.gainCardFromPile(toGain);
              }
            }
          }
        }),
      )
      .choose();
  }
}
