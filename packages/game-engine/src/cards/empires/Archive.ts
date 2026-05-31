import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Archive extends KingdomCard {
  private archiveCards: CardCollection = new CardCollection();

  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Archive'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);
    // Set aside top 3 cards face down
    const takenCards = await ie.takeCardsOffDeck(3);
    for (const card of takenCards) {
      ie.setCardAside(card, true);
      this.archiveCards.addCard(card);
    }
    // Put one into hand now
    await this.pickOneArchiveCard(ie);
    // Add effect for next turn (which will chain to the turn after if needed)
    if (this.archiveCards.size() > 0) {
      this.addArchiveTurnEffect(ie);
      this.markAsUnfinished();
    }
  }

  private async pickOneArchiveCard(ie: InstructionExecutor): Promise<void> {
    if (this.archiveCards.size() === 0) {
      return;
    }
    const chosen: Card | Choice = await ie
      .chooseCard('Choose a set-aside card to put into your hand')
      .from(this.archiveCards)
      .to(CardSelectionPurpose.OTHER)
      .choose();
    if (chosen instanceof Card) {
      this.archiveCards.removeCard(chosen);
      ie.putCardIntoHandFromLocation(chosen, CardLocation.SET_ASIDE);
    }
  }

  private addArchiveTurnEffect(ie: InstructionExecutor): void {
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
        .onTurn(ie.createNextTurnEligibilityFunction())
        .withExpiration(ie.createEndOfMyNextTurnEffectExpiration())
        .makeMandatory()
        .action(
          new EffectAction(async (ie: InstructionExecutor) => {
            await this.pickOneArchiveCard(ie);
            if (this.archiveCards.size() > 0) {
              this.addArchiveTurnEffect(ie);
            } else {
              this.markAsFinished();
            }
          }),
        )
        .build(),
    );
  }
}
