import { CardMetadata } from '@dominion/common';

import { CardGroup } from './CardGroup';

export class GroupedCardCollection {
  protected cardGroups: CardGroup[] = [];

  public replaceCards(newCards: CardMetadata[]): void {
    const cardsByName: Map<string, CardMetadata[]> = new Map<string, CardMetadata[]>();

    for (const card of newCards) {
      if (!cardsByName.has(card.name)) {
        cardsByName.set(card.name, []);
      }
      cardsByName.get(card.name)!.push(card);
    }

    this.cardGroups = [];
    for (const cardName of cardsByName.keys()) {
      this.cardGroups.push(new CardGroup(cardsByName.get(cardName)!));
    }
  }

  public getCardGroups(): CardGroup[] {
    return this.cardGroups;
  }
}
