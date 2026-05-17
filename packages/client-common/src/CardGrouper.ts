import { CardMetadata } from '@dominion/common';

import { CardGroup } from './CardGroup';
import { DefaultCardGroupSortingFunction } from './SortingFunctions';

export class CardGrouper {
  private cardGroups: CardGroup[] = [];

  constructor(
    private readonly cards: CardMetadata[],
    private readonly sorted = false,
  ) {
    this.groupCards();
  }

  private groupCards(): void {
    const cardsByName: Map<string, CardMetadata[]> = new Map<string, CardMetadata[]>();

    for (const card of this.cards) {
      if (!cardsByName.has(card.name)) {
        cardsByName.set(card.name, []);
      }
      cardsByName.get(card.name)?.push(card);
    }

    this.cardGroups = Array.from(cardsByName.values()).map(
      (namedCardGroup: CardMetadata[]) => new CardGroup(namedCardGroup),
    );

    if (this.sorted) {
      this.cardGroups = this.cardGroups.sort(new DefaultCardGroupSortingFunction().getBoundOrderingFunction());
    }
  }

  public getCardGroups(): CardGroup[] {
    return this.cardGroups;
  }
}

export class SingleCardGrouper {
  private cardGroups: CardGroup[] = [];

  constructor(
    private readonly cards: CardMetadata[],
    private readonly sorted = false,
  ) {
    this.groupCards();
  }

  private groupCards(): void {
    this.cardGroups = this.cards.map((card: CardMetadata) => new CardGroup([card]));

    if (this.sorted) {
      this.cardGroups = this.cardGroups.sort(new DefaultCardGroupSortingFunction().getBoundOrderingFunction());
    }
  }

  public getCardGroups(): CardGroup[] {
    return this.cardGroups;
  }
}
