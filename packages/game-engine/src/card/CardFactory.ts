import { CardLocation } from '@dominion/common';

import * as cards from '../cards/index';
import { SharedGameState } from '../SharedGameState';
import { Card } from './Card';

export class CardFactory {
  constructor(private readonly sharedGameState: SharedGameState) {}

  public createCard(name: string, id: string, location: CardLocation): Card {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/consistent-type-assertions
    const card: Card = new (<any>cards)[name](this.sharedGameState);
    card.setId(id);
    card.setLocation(location);
    return card;
  }
}
