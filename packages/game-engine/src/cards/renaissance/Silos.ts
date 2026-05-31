import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { Project } from '../../card/Project';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { cardNameIs } from '../../StandardCardEligibilityFunctions';

export class Silos extends Project {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Silos'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    // At the start of your turn, discard any number of Coppers (revealed), draw that many.
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
        .makeMandatory()
        .action(
          new EffectAction(async (ie: InstructionExecutor) => {
            const coppers: CardCollection = await ie
              .chooseCards('Silos: discard any Coppers to draw that many')
              .from(CardLocation.HAND)
              .to(CardSelectionPurpose.DISCARD)
              .whereCardIs(cardNameIs('Copper'))
              .choose();
            if (coppers.size() > 0) {
              const count = coppers.size();
              await ie.discardCardsFromLocation(coppers, CardLocation.HAND);
              await ie.drawCards(count);
            }
          }),
        )
        .build(),
    );
  }
}
