import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { costsUpTo } from '../../StandardCardEligibilityFunctions';

export class Quartermaster extends KingdomCard {
  private readonly setAsideCards = new CardCollection();

  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Quartermaster'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
        .makeMandatory()
        .action(
          new EffectAction(async (effectIe: InstructionExecutor) => {
            if (this.setAsideCards.isEmpty()) {
              await this.gainAndSetAside(effectIe);
              return;
            }

            await effectIe
              .chooseOneOption('Choose one')
              .from(
                new ActionChoice('Gain a card costing up to $4 and set it aside', () => this.gainAndSetAside(effectIe)),
              )
              .from(
                new ActionChoice('Put a set aside card into your hand', () => this.putSetAsideCardIntoHand(effectIe)),
              )
              .choose();
          }),
        )
        .build(),
    );
    this.markAsUnfinished();
  }

  private async gainAndSetAside(ie: InstructionExecutor): Promise<void> {
    const cardToGain: Card | Choice = await ie
      .chooseCard('Choose a card costing up to $4 to gain and set aside')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(costsUpTo(Cost.Simple(4)))
      .allowNoneOption()
      .choose();
    if (!(cardToGain instanceof Card)) {
      return;
    }

    const gainedCard = await ie.gainCardFromPile(cardToGain);
    if (gainedCard instanceof Card) {
      await ie.setCardAsideFromLocation(gainedCard, CardLocation.DISCARD);
      this.setAsideCards.addCard(gainedCard);
    }
  }

  private async putSetAsideCardIntoHand(ie: InstructionExecutor): Promise<void> {
    const cardToTake: Card | Choice = await ie
      .chooseCard('Choose a set aside card to put into your hand')
      .from(this.setAsideCards)
      .to(CardSelectionPurpose.DRAW)
      .allowNoneOption()
      .choose();
    if (cardToTake instanceof Card) {
      this.setAsideCards.removeCard(cardToTake);
      ie.putCardIntoHandFromLocation(cardToTake, CardLocation.SET_ASIDE);
    }
  }
}
