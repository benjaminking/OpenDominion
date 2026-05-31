import { CardInfo, CardLocation, CardMetadata, CardType } from '@dominion/common';

import { CardEligibilityFunction } from '../CardEligibilityFunction';
import { SharedGameState } from '../game-state/SharedGameState';
import { InstructionExecutor } from '../players/InstructionExecutor';
import { CardCollection } from './CardCollection';
import { CardShapedObject } from './CardShapedObject';
import { Cost } from './Cost';

export class Card extends CardShapedObject {
  private readonly _cost: Cost;
  private readonly _types: Set<CardType>;
  private readonly _pileName: string;
  private _originalCost: Cost;
  private _location: CardLocation = CardLocation.PILE;
  private _isSimpleTreasure = false;
  private _isSupplyCard = false;
  private _coins = 0;
  private _hasThingsLeftToDo = false;

  public constructor(
    protected readonly sharedGameState: SharedGameState,
    cardInfo: CardInfo,
  ) {
    super(sharedGameState, cardInfo);
    this._cost = Cost.fromCommonCost(cardInfo.cost);
    this._types = new Set(cardInfo.types);
    this._pileName = this._properName;
    this._originalCost = this._cost;
  }

  public getPileName(): string {
    return this._pileName;
  }

  public getOriginalCost(): Cost {
    return this._originalCost;
  }

  public getCost(): Cost {
    return this.sharedGameState.cost(this);
  }

  public adjustCost(cost: Cost, _ie: InstructionExecutor): Cost {
    return cost;
  }

  public getTypes(): Set<CardType> {
    return this._types;
  }

  public getLocation(): CardLocation {
    return this._location;
  }
  public setLocation(value: CardLocation): void {
    this._location = value;
  }

  public isSimpleTreasure(): boolean {
    return this._isSimpleTreasure;
  }
  protected markAsSimpleTreasure(): void {
    this._isSimpleTreasure = true;
  }

  public isSupplyCard(): boolean {
    return this._isSupplyCard;
  }
  public markAsSupplyCard(): void {
    this._isSupplyCard = true;
  }

  public getCoins(): number {
    return this._coins;
  }
  protected setCoins(value: number): void {
    this._coins = value;
  }

  public async play(_ie: InstructionExecutor) {
    //
  }

  public canBeBought(_ie: InstructionExecutor): boolean {
    return true;
  }

  public score(_allCardGroups: CardCollection[]): number {
    return 0;
  }

  public canBeDiscardedInCleanup(): boolean {
    return !this._hasThingsLeftToDo;
  }

  public markAsUnfinished(): void {
    this._hasThingsLeftToDo = true;
  }

  public markAsFinished(): void {
    this._hasThingsLeftToDo = false;
  }

  public hasType(type: CardType): boolean {
    return this._types.has(type);
  }

  /*public async interaction() {
    //
  }

  protected async sendInteractionMessage() {
    await this.gameLogic.messageService.sendGameMessageToEachOpponentAndWaitForResume(
      {
        command: Command.INTERACTION,
        content: this.metadata,
      }
    );
  }*/

  public matches(cardEligibilityFunction: CardEligibilityFunction): boolean {
    return cardEligibilityFunction.matches(this);
  }

  public getMetadata(): CardMetadata {
    const currentCost = this.getCost();
    return {
      name: this.getName(),
      displayName: this.getDisplayName(),
      id: this._id,
      location: this._location,
      types: Array.from(this._types),
      cost: {
        coins: currentCost.coins,
        potions: currentCost.potions,
        debt: currentCost.debt,
      },
    };
  }
}
