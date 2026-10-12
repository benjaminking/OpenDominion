import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectCondition } from '../../effects/EffectCondition';
import { EffectContext } from '../../effects/EffectContext';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Watchtower extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Watchtower'));
    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
        .addCondition(new EffectCondition(() => this.getLocation() === CardLocation.HAND))
        .action(
          new EffectAction(async (ie: InstructionExecutor, effectContext: EffectContext) => {
            const gainedCard = effectContext.getTargetCard()!;
            const gainLocation = effectContext.getGainLocation()!;
            // Not met once the gained card has moved since it was gained, even if it's back there (e.g. another
            // Watchtower has put a card gained onto the deck onto the deck)
            const locationExpectation = effectContext.getLocationExpectation()!;

            await ie.revealCard(this);
            await ie
              .chooseOneOption('What do you want to do with ' + gainedCard.getName() + '?')
              .from(
                new ActionChoice('Trash it', async () => {
                  if (!locationExpectation.isMet(gainedCard)) {
                    ie.sendLostTrackMessage(gainedCard);
                  } else {
                    await ie.trashCardFromLocation(gainedCard, gainLocation);
                  }
                }),
              )
              .from(
                new ActionChoice('Put it onto your deck', async () => {
                  if (!locationExpectation.isMet(gainedCard)) {
                    ie.sendLostTrackMessage(gainedCard);
                  } else {
                    await ie.topDeckCardFromLocation(gainedCard, gainLocation);
                  }
                }),
              )
              .choose();
          }),
        )
        .build(),
    );
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawUpTo(6);
  }
}
