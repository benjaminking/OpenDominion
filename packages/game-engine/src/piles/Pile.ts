import { CardLocation, CardType, PileCategory, PileMetadata } from '@dominion/common';

import { CardCollection } from '../card/CardCollection';
import { Cost } from '../card/Cost';
import { PrivacyType } from '../card/PrivacyType';
import { SharedOrderedStack } from '../card/SharedOrderedStack';
import { GameMessageBroadcaster } from '../messaging/GameMessageBroadcaster';

export class Pile extends SharedOrderedStack {
  private readonly _originalSize: number;
  private readonly _cost: Cost;

  // TODO: maybe this should accept an object that creates the card array?
  public constructor(
    private readonly _name: string,
    cards: CardCollection,
    private readonly types: Set<CardType>,
    private readonly categories: Set<PileCategory>,
    gameMessageBroadcaster: GameMessageBroadcaster,
  ) {
    super(CardLocation.PILE, gameMessageBroadcaster, PrivacyType.SIZE_AND_TOP_CARD_VISIBLE_TO_ALL, cards);
    this._originalSize = cards.size();
    this._cost = this.getTopCard()?.getCost() ?? Cost.Simple(0);
  }

  public get name(): string {
    return this._name;
  }

  public get originalSize(): number {
    return this._originalSize;
  }

  public get cost(): Cost {
    return this._cost;
  }

  public isEmpty(): boolean {
    return this.size() === 0;
  }

  public getTypes(): Set<CardType> {
    return this.types;
  }

  public getCategories(): Set<PileCategory> {
    return this.categories;
  }

  public getPileMetadata(): PileMetadata {
    return {
      name: this.name,
      size: this.size(),
      cost: this.cost.toCommonCost(),
      topCard: this.getTopCard()?.getMetadata(),
      types: Array.from(this.getTopCard()?.getTypes() ?? []),
      categories: Array.from(this.categories),
    };
  }

  protected broadcastValue(): void {
    this.gameMessageBroadcaster.sendPileMetadata(this.getPileMetadata());
  }

  public communicateInitialState(): void {
    this.broadcastValue();
  }
}
