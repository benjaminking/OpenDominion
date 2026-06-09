import { Cost as CommonCost } from '@dominion/common';

export class Cost {
  private _coins = 0;
  public get coins(): number {
    return this._coins;
  }
  private _potions = 0;
  public get potions(): number {
    return this._potions;
  }
  private _debt = 0;
  public get debt(): number {
    return this._debt;
  }
  private _hasAsterisk = false;

  private constructor(coins: number, potions: number, debt: number, hasAsterisk?: boolean) {
    this._coins = coins;
    this._potions = potions;
    this._debt = debt;
    if (hasAsterisk) {
      this._hasAsterisk = true;
    }
  }

  public static Simple(coins: number): Cost {
    return new Cost(coins, 0, 0);
  }

  public static Potion(coins: number): Cost {
    return new Cost(coins, 1, 0);
  }

  public static Debt(coins: number, debt: number): Cost {
    return new Cost(coins, 0, debt);
  }

  public static fromCommonCost(commonCost: CommonCost): Cost {
    return new Cost(commonCost.coins, commonCost.potions ?? 0, commonCost.debt ?? 0, commonCost.has_asterisk);
  }

  public plus(coins: number): Cost {
    if (this.coins + coins < 0) {
      return new Cost(0, this.potions, this.debt);
    }
    return new Cost(this.coins + coins, this.potions, this.debt);
  }

  public minus(coins: number): Cost {
    if (this.coins - coins < 0) {
      return new Cost(0, this.potions, this.debt);
    }
    return new Cost(this.coins - coins, this.potions, this.debt);
  }

  public toCommonCost(): CommonCost {
    return {
      coins: this.coins,
      potions: this.potions,
      debt: this.debt,
      has_asterisk: this._hasAsterisk,
    };
  }

  public isLessThanOrEqualTo(other: Cost): boolean {
    return this.coins <= other.coins && this.potions <= other.potions && this.debt <= other.debt;
  }

  public isLessThan(other: Cost): boolean {
    return (
      this.isLessThanOrEqualTo(other) &&
      (this.coins < other.coins || this.potions < other.potions || this.debt < other.debt)
    );
  }

  public isEqualTo(other: Cost): boolean {
    return this.coins === other.coins && this.potions === other.potions && this.debt === other.debt;
  }

  public toString(): string {
    if (this._potions === 0 && this._debt === 0) {
      return '$' + this._coins.toFixed();
    }
    if (this._potions === 1 && this._coins > 0) {
      return '$' + this._coins.toFixed() + 'P';
    }
    if (this._potions === 1 && this._coins === 0) {
      return '$P';
    }
    if (this._debt > 0 && this._coins > 0) {
      return this._debt.toFixed() + 'D' + '$' + this._coins.toFixed();
    }
    if (this._debt > 0 && this._coins === 0) {
      return this._debt.toFixed() + 'D';
    }
    throw new Error(
      'Unsupported cost combination ' +
        this._coins.toFixed() +
        ' coins, ' +
        this._potions.toFixed() +
        ' potions' +
        this._debt.toFixed() +
        ' debt',
    );
  }
}
