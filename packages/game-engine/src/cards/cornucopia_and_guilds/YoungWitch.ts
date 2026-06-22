import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { CardEligibilityFunction } from '../../CardEligibilityFunction';
import { ActionChoice } from '../../decisions/ActionChoice';
import { SharedGameState } from '../../game-state/SharedGameState';
import { Pile } from '../../piles/Pile';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { AddedPilePostAction } from '../../setup/AddedPilePostAction';
import { PileAddingSetupRule } from '../../setup/PileAddingSetupRule';
import { PileSpecification } from '../../setup/PileSpecification';
import { both, costsExactly, either,isKingdomCard } from '../../StandardCardEligibilityFunctions';
import { exactlyNChecked } from '../../StandardNumberEligibilityFunctions';

let banePileName = '';
class IsBaneCard extends CardEligibilityFunction {
  public constructor() {
    super((c: Card) => c.getPileName() === banePileName);
  }
}
const isBaneCard = new IsBaneCard();

// Young Witch: +2 Cards, discard 2 cards. Each other player gains a Curse
// unless they reveal a Bane card from their hand.
// Setup: Add an extra Kingdom card pile costing $2 or $3 — its cards are Banes.
// Note: Bane card identification is a stub (no Bane tracking in engine yet).
export class YoungWitch extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Young Witch'));
    this.addSetupRule(new PileAddingSetupRule(new PileSpecification(both(isKingdomCard, either(costsExactly(Cost.Simple(2)), costsExactly(Cost.Simple(3)))), true, true),
      new AddedPilePostAction((pile: Pile) => {
        banePileName = pile.name;
      })
    ));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(2);

    const toDiscard: CardCollection = await ie
      .chooseCards('Discard 2 cards')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.DISCARD)
      .whereNumCardsIs(exactlyNChecked(2))
      .choose();
    await ie.discardCardsFromLocation(toDiscard, CardLocation.HAND);

    await ie.performAttack(this, this.attack.bind(this));
  }

  private async attack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    const attackedIe: InstructionExecutor = attackedPlayer.getInstructionExecutor();
    let revealedBane = false;
    if (attackedIe.hasMatchingCardInHand(isBaneCard)) {
      await attackedIe
        .chooseOneOption(
          'Do you want to reveal a Bane?',
        )
        .from(
          new ActionChoice('Yes', async () => {
            const baneCard = attackedIe.getMatchingCardsInHand(isBaneCard).getArbitraryCard();
            await attackedIe.revealCard(baneCard);
            revealedBane = true;
          }),
        )
        .from(
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          new ActionChoice('No', async () => { }),
        )
        .choose();
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!revealedBane) {
      await attackedIe.gainFromPile('curse');
    }
  }
}
