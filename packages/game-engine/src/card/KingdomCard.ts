import { CardInfo } from '@dominion/common';
import { Expansion } from '@dominion/common';

import { SharedGameState } from '../game-state/SharedGameState';
import { Card } from './Card';

export class KingdomCard extends Card {
  private _expansion: Expansion;
  public get expansion(): Expansion {
    return this._expansion;
  }

  public constructor(sharedGameState: SharedGameState, cardInfo: CardInfo) {
    super(sharedGameState, cardInfo);
    this._expansion = cardInfo.expansion;
    this.markAsSupplyCard();
  }

  // TODO: there are non-kingdom cards that have an expansion
  // (This is only important if we want to display the expansion symbol)
  public isFromExpansion(expansion: Expansion): boolean {
    return this._expansion === expansion;
  }
}
