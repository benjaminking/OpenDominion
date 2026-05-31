import { CardInfoLookup } from '@dominion/card-info';

import { CardCollection } from '../../card/CardCollection';
import { Landmark } from '../../card/Landmark';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isVictoryCard } from '../../StandardCardEligibilityFunctions';

export class Battlefield extends Landmark {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Battlefield'));
    this._numVPChips = 6 * sharedGameState.getNumPlayers();

    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
        .whereCardIs(isVictoryCard)
        .action(
          new EffectAction((ie: InstructionExecutor) => {
            if (this._numVPChips >= 2) {
              ie.addVP(2);
              this._numVPChips -= 2;
            }
          }),
        )
        .build(),
    );
  }

  score(_allCardGroups: CardCollection[]): number {
    return 0;
  }
}
