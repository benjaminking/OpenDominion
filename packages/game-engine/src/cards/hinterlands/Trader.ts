import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectCondition } from '../../effects/EffectCondition';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Trader extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Trader'));
    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
        .addCondition(new EffectCondition(() => this.getLocation() === CardLocation.HAND))
        .action(new EffectAction(this.reaction.bind(this)))
        .build(),
    );
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const cardToTrash: Card | Choice = await ie
      .chooseCard('Choose a card to trash')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .choose();

    if (!(cardToTrash instanceof Card)) {
      return;
    }

    const trashedCard = await ie.trashCardFromLocation(cardToTrash, CardLocation.HAND);
    if (trashedCard === undefined) {
      return;
    }

    for (let i = 0; i < trashedCard.getCost().coins; i++) {
      await ie.gainCardFromPile('Silver');
    }
  }

  private async reaction(ie: InstructionExecutor, gainedCard: Card): Promise<void> {
    await ie
      .chooseOneOption('You may reveal Trader to exchange gained card for a Silver')
      .from(
        new ActionChoice('Exchange for Silver', async () => {
          await ie.revealCard(this);
          await ie.trashCardFromLocation(gainedCard, gainedCard.getLocation());
          await ie.gainCardFromPile('Silver', gainedCard.getLocation());
        }),
      )
      .from(new ActionChoice('Do not exchange'))
      .choose();
  }
}
