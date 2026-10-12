import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { isActionCard } from '../../StandardCardEligibilityFunctions';

export class ScryingPool extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Scrying Pool'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);

    await this.revealTopCardChoice(ie.getSharedGameState().getCurrentPlayer(), ie);
    await ie.performAttack(this, this.attack.bind(this));

    // Reveal until a non-Action, then put all revealed cards (including the non-Action) into hand
    const locationExpectation = ie.createLocationExpectation(CardLocation.REVEAL_LIMBO);
    const revealedCards: CardCollection = new CardCollection();
    let revealedCard: Card | undefined;
    do {
      revealedCard = await ie.takeCardOffDeck();
      if (revealedCard === undefined) {
        break;
      }
      await ie.revealCard(revealedCard);
      revealedCards.addCard(revealedCard);
    } while (isActionCard.matches(revealedCard));
    for (const card of revealedCards) {
      if (!locationExpectation.isMet(card)) {
        ie.sendLostTrackMessage(card);
      } else {
        ie.putCardIntoHandFromLocation(card, CardLocation.REVEAL_LIMBO);
      }
    }
  }

  public async attack(attackedPlayer: Player, attackingPlayer: Player): Promise<void> {
    await this.revealTopCardChoice(attackedPlayer, attackingPlayer.getInstructionExecutor());
  }

  private async revealTopCardChoice(targetPlayer: Player, chooserIe: InstructionExecutor): Promise<void> {
    const targetIe = targetPlayer.getInstructionExecutor();
    const topCard: Card | undefined = await targetIe.lookAtTopCardOfDeck();
    if (topCard === undefined) {
      return;
    }
    const locationExpectation = targetIe.createLocationExpectation(CardLocation.DECK);

    await targetIe.revealCard(topCard);
    await chooserIe
      .chooseOneOption('Choose what happens to ' + targetPlayer.getName() + "'s " + topCard.getName())
      .from(
        new ActionChoice('Discard it', async () => {
          // "When you reveal" abilities have resolved in between
          if (!locationExpectation.isMet(topCard)) {
            targetIe.sendLostTrackMessage(topCard);
            return;
          }
          await targetIe.discardCardFromLocation(topCard, CardLocation.DECK);
        }),
      )
      .from(new ActionChoice('Put it back'))
      .choose();
  }
}
