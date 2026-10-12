import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectCondition } from '../../effects/EffectCondition';
import { EffectContext } from '../../effects/EffectContext';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

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

    await ie.gainCardFromPileNTimes('Silver', trashedCard.getCost().coins);
  }

  private async reaction(ie: InstructionExecutor, effectContext: EffectContext): Promise<void> {
    const gainedCard = effectContext.getTargetCard()!;
    await ie.revealCard(this);
    // Once something else has moved the gained card (e.g. Trail playing itself, Inn shuffling itself into the deck,
    // or Watchtower trashing it), Trader has lost track of it and can't exchange it
    if (!effectContext.getLocationExpectation()!.isMet(gainedCard)) {
      ie.sendLostTrackMessage(gainedCard);
      return;
    }
    ie.exchangeCardFromLocation(gainedCard, effectContext.getGainLocation()!, 'Silver');
  }
}
