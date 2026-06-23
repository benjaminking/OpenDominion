import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { OneTimeEffectExpirtation, OnceThisTurnEffectExpiration } from '../../effects/StandardEffectExpirations';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { isVictoryCard } from '../../StandardCardEligibilityFunctions';
import { upToNChecked } from '../../StandardNumberEligibilityFunctions';

export class Cage extends KingdomCard {
  private readonly setAsideCards = new CardCollection();

  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Cage'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const cardsToSetAside = await ie
      .chooseCards('Choose up to 4 cards to set aside')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.OTHER)
      .whereNumCardsIs(upToNChecked(4))
      .choose();

    for (const card of cardsToSetAside) {
      await ie.setCardAsideFromLocation(card, CardLocation.HAND);
      this.setAsideCards.addCard(card);
    }

    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
        .whereCardIs(isVictoryCard)
        .withExpiration(new OneTimeEffectExpirtation())
        .makeMandatory()
        .action(
          new EffectAction(async (effectIe: InstructionExecutor) => {
            await effectIe.trashCardFromLocation(this, CardLocation.IN_PLAY);
            effectIe.addEffect(
              new Effect.Builder()
                .from(this)
                .triggerOn(EffectTriggerType.TURN_END, EffectSource.SELF)
                .onTurn(effectIe.createThisTurnEligibilityFunction())
                .withExpiration(new OnceThisTurnEffectExpiration(effectIe.getSharedGameState().getCurrentTurn()))
                .makeMandatory()
                .action(
                  new EffectAction((turnEndIe: InstructionExecutor) => {
                    turnEndIe.putCardsIntoHandFromLocation(this.setAsideCards, CardLocation.SET_ASIDE);
                    this.setAsideCards.clear();
                    this.markAsFinished();
                  }),
                )
                .build(),
            );
          }),
        )
        .build(),
    );
    this.markAsUnfinished();
  }
}
