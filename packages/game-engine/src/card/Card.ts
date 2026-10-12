import { CardInfo, CardLocation, CardMetadata, CardType } from '@dominion/common';

import { CardEligibilityFunction } from '../CardEligibilityFunction';
import { SharedGameState } from '../game-state/SharedGameState';
import { TimeStamp } from '../game-state/TimeStamp';
import { InstructionExecutor } from '../players/InstructionExecutor';
import { Player } from '../players/Player';
import { CardCollection } from './CardCollection';
import { CardShapedObject } from './CardShapedObject';
import { Cost } from './Cost';
import { MovementLog } from './MovementLog';

export class Card extends CardShapedObject {
  private readonly _cost: Cost;
  private readonly _types: Set<CardType>;
  private readonly _pileName: string;
  private _originalCost: Cost;
  private _location: CardLocation = CardLocation.PILE;
  private _owner: Player | undefined = undefined;
  private _previousOwner: Player | undefined = undefined;
  private _isSimpleTreasure = false;
  private _isSupplyCard = false;
  private _coins = 0;
  private _hasThingsLeftToDo = false;
  private readonly durationsBeingTracked: Card[] = [];
  private readonly _movementLog: MovementLog = new MovementLog();

  public constructor(
    protected readonly sharedGameState: SharedGameState,
    cardInfo: CardInfo,
  ) {
    super(sharedGameState, cardInfo);
    this._cost = Cost.fromCommonCost(cardInfo.cost);
    this._types = new Set(cardInfo.types);
    this._pileName = cardInfo.pileNameOverride ?? this._properName;
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
  public setLocation(newLocation: CardLocation): void {
    const oldLocation = this._location;
    this._location = newLocation;
    // A move happens after every location expectation created before it
    this.sharedGameState.advanceTime();
    this._movementLog.recordMovement(oldLocation, newLocation, this.sharedGameState.getCurrentTimeStamp());

    // Cards in shared locations don't belong to anyone. Locations that belong to a player set the owner as the
    // card moves there (see PlayerCards).
    if (newLocation === CardLocation.PILE || newLocation === CardLocation.TRASH) {
      this.changeOwner(undefined);
    }
  }

  // The previous owner is who owned the card before its last change of owner, e.g. the player whose card was just
  // trashed, so moving between one player's own locations doesn't change it
  public changeOwner(newOwner: Player | undefined): void {
    if (newOwner === this._owner) {
      return;
    }
    this._previousOwner = this._owner;
    this._owner = newOwner;
  }

  public getOwner(): Player | undefined {
    return this._owner;
  }

  public hasOwner(potentialOwner: Player): boolean {
    return this._owner === potentialOwner;
  }

  public hasPreviousOwner(potentialOwner: Player): boolean {
    return this._previousOwner === potentialOwner;
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

  public async play(_ie: InstructionExecutor): Promise<void> {
    //
  }

  public canBeBought(_ie: InstructionExecutor): boolean {
    return true;
  }

  public score(_allCardGroups: CardCollection[]): number {
    return 0;
  }

  public canBeDiscardedInCleanup(): boolean {
    return !this._hasThingsLeftToDo && !this.isTrackingAnUnfinishedDuration();
  }

  private isTrackingAnUnfinishedDuration(): boolean {
    return this.durationsBeingTracked.some(
      (duration: Card) =>
        !duration.canBeDiscardedInCleanup() &&
        (duration.getLocation() === CardLocation.IN_PLAY || duration.getLocation() === CardLocation.PILE),
    );
  }

  public stayInPlayWhileTracking(duration: Card): void {
    if (duration.hasType(CardType.DURATION)) {
      this.durationsBeingTracked.push(duration);
    }
  }

  public stopTrackingDurations(): void {
    this.durationsBeingTracked.length = 0;
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

  public hasMovedFromLocationSince(location: CardLocation, timeStamp: TimeStamp): boolean {
    return this._movementLog.hasCardMovedAwayFromAreaSince(location, timeStamp);
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
