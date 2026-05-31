import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, CardType } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { CardEligibilityFunction } from '../../CardEligibilityFunction';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isTreasureCard } from '../../StandardCardEligibilityFunctions';

const isNonDurationTreasure = new CardEligibilityFunction(
  (c: Card) => isTreasureCard.matches(c) && !c.hasType(CardType.DURATION),
);

// Crypt (Night/Duration): Set aside any number of non-Duration Treasures from play.
// While any remain, at the start of each of your turns, put one into your hand.
export class Crypt extends KingdomCard {
  private setAsideCards: CardCollection = new CardCollection();

  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Crypt'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const treasuresToSetAside: CardCollection = await ie
      .chooseCards('Set aside any number of non-Duration Treasures from play')
      .from(CardLocation.IN_PLAY)
      .to(CardSelectionPurpose.OTHER)
      .whereCardIs(isNonDurationTreasure)
      .choose();

    for (const treasure of treasuresToSetAside) {
      const setAside = await ie.setCardAsideFromLocation(treasure, CardLocation.IN_PLAY);
      if (setAside !== undefined) {
        this.setAsideCards.addCard(setAside);
      }
    }

    if (this.setAsideCards.size() > 0) {
      this.addCryptEffect(ie);
      this.markAsUnfinished();
    }
  }

  private addCryptEffect(ie: InstructionExecutor): void {
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
        .onTurn(ie.createNextTurnEligibilityFunction())
        .withExpiration(ie.createEndOfMyNextTurnEffectExpiration())
        .makeMandatory()
        .action(
          new EffectAction(async (effectIe: InstructionExecutor) => {
            const card = this.setAsideCards.getArbitraryCard();
            if (card !== undefined) {
              this.setAsideCards.removeCard(card);
              effectIe.putCardIntoHandFromLocation(card, CardLocation.SET_ASIDE);
            }
            if (this.setAsideCards.size() > 0) {
              this.addCryptEffect(effectIe);
            } else {
              this.markAsFinished();
            }
          }),
        )
        .build(),
    );
  }
}
