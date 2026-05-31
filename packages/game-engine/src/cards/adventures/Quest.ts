import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { Event } from '../../card/Event';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isAttackCard, isCurseCard } from '../../StandardCardEligibilityFunctions';
import { upToNChecked, exactlyNChecked } from '../../StandardNumberEligibilityFunctions';

export class Quest extends Event {
  public constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Quest'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    let discarded = false;

    await ie
      .chooseOneOption('Discard an Attack, two Curses, or six cards')
      .from(
        new ActionChoice('Discard an Attack', async () => {
          const card: Card | Choice = await ie
            .chooseCard('Discard an Attack from your hand')
            .from(CardLocation.HAND)
            .to(CardSelectionPurpose.DISCARD)
            .whereCardIs(isAttackCard)
            .allowNoneOption()
            .choose();
          if (card instanceof Card) {
            await ie.discardCardFromLocation(card, CardLocation.HAND);
            discarded = true;
          }
        }),
      )
      .from(
        new ActionChoice('Discard two Curses', async () => {
          const cards: CardCollection = await ie
            .chooseCards('Discard two Curses from your hand')
            .from(CardLocation.HAND)
            .to(CardSelectionPurpose.DISCARD)
            .whereCardIs(isCurseCard)
            .whereNumCardsIs(exactlyNChecked(2))
            .choose();
          if (cards.size() === 2) {
            await ie.discardCardsFromLocation(cards, CardLocation.HAND);
            discarded = true;
          }
        }),
      )
      .from(
        new ActionChoice('Discard six cards', async () => {
          const cards: CardCollection = await ie
            .chooseCards('Discard six cards from your hand')
            .from(CardLocation.HAND)
            .to(CardSelectionPurpose.DISCARD)
            .whereNumCardsIs(exactlyNChecked(6))
            .choose();
          if (cards.size() === 6) {
            await ie.discardCardsFromLocation(cards, CardLocation.HAND);
            discarded = true;
          }
        }),
      )
      .from(
        new ActionChoice('Pass', () => {
          /* pass */
        }),
      )
      .choose();

    if (discarded) {
      await ie.gainCardFromPile('Gold');
    }
  }
}
