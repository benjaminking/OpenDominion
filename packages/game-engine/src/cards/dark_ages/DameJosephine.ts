import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Knights } from './Knights';

export class DameJosephine extends Knights {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Dame Josephine'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const selfExpectation = ie.createLocationExpectation(CardLocation.IN_PLAY);
    await this.performKnightAttack(ie, selfExpectation);
  }

  public score(_allCardGroups: CardCollection[]): number {
    return 2;
  }
}
