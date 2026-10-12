import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
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
import { exactlyNChecked } from '../../StandardNumberEligibilityFunctions';

const banePileNames = new WeakMap<SharedGameState, string>();
class IsBaneCard extends CardEligibilityFunction {
  public constructor(sharedGameState: SharedGameState) {
    super((c: Card) => c.getPileName() === banePileNames.get(sharedGameState));
  }
}

export class YoungWitch extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Young Witch'));
    this.addSetupRule(
      new PileAddingSetupRule(
        new PileSpecification({ requiredCoinCosts: [2, 3] }, true, true),
        new AddedPilePostAction((pile: Pile) => {
          banePileNames.set(sharedGameState, pile.name);
        }),
      ),
    );
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(2);

    const toDiscard: CardCollection = await ie
      .chooseCards('Discard 2 cards')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.DISCARD)
      .whereNumCardsIs(exactlyNChecked(Math.min(2, ie.handSize())))
      .choose();
    await ie.discardCardsFromLocation(toDiscard, CardLocation.HAND);

    await ie.performAttack(this, this.attack.bind(this));
  }

  private async attack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    const attackedIe: InstructionExecutor = attackedPlayer.getInstructionExecutor();
    const isBaneCard = new IsBaneCard(this.sharedGameState);
    let revealedBane = false;
    if (attackedIe.hasMatchingCardInHand(isBaneCard)) {
      await attackedIe
        .chooseOneOption('Do you want to reveal a Bane?')
        .from(
          new ActionChoice('Yes', async () => {
            const baneCard = attackedIe.getMatchingCardsInHand(isBaneCard).getArbitraryCard();
            await attackedIe.revealCard(baneCard);
            revealedBane = true;
          }),
        )
        .from(
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          new ActionChoice('No', async () => {}),
        )
        .choose();
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!revealedBane) {
      await attackedIe.gainFromPile('Curse');
    }
  }
}
