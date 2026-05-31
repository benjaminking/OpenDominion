import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardType } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { CardEligibilityFunction } from '../../CardEligibilityFunction';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

const isActionCard = new CardEligibilityFunction((c: Card) => c.hasType(CardType.ACTION));

// Ghost (Night/Duration/Spirit): Reveal cards from your deck until you reveal an Action.
// Discard the rest, set that Action aside, and at the start of your next turn,
// play it twice.
export class Ghost extends Card {
  private setAsideAction: Card | undefined;

  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Ghost'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    let foundAction: Card | undefined;
    const discardPile: Card[] = [];
    while (foundAction === undefined) {
      const drawn = await ie.takeCardOffDeck();
      if (drawn === undefined) {
        break;
      }
      if (isActionCard.matches(drawn)) {
        foundAction = drawn;
      } else {
        discardPile.push(drawn);
      }
    }
    for (const card of discardPile) {
      await ie.discardCard(card);
    }
    if (foundAction !== undefined) {
      this.setAsideAction = foundAction;
      ie.setCardAside(foundAction);
      ie.addEffect(
        new Effect.Builder()
          .from(this)
          .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
          .onTurn(ie.createNextTurnEligibilityFunction())
          .withExpiration(ie.createEndOfMyNextTurnEffectExpiration())
          .makeMandatory()
          .action(
            new EffectAction(async (effectIe: InstructionExecutor) => {
              if (this.setAsideAction !== undefined) {
                await effectIe.playCardFromLocation(this.setAsideAction, CardLocation.SET_ASIDE);
                await effectIe.playCardFromLocation(this.setAsideAction, CardLocation.IN_PLAY);
              }
              this.markAsFinished();
            }),
          )
          .build(),
      );
      this.markAsUnfinished();
    }
  }
}
