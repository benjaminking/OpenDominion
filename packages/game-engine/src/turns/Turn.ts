import { Player } from '../players/Player';

export class Turn {
  private number: number;
  private unofficialNumber: number;
  private owner: Player;

  constructor(owner: Player, number: number, unofficialNumber: number) {
    this.number = number;
    this.unofficialNumber = unofficialNumber;
    this.owner = owner;
  }

  public nextTurn(): Turn {
    return new Turn(this.owner, this.number + 1, this.unofficialNumber + 1);
  }

  public nextUnofficialTurn(): Turn {
    return new Turn(this.owner, this.number, this.unofficialNumber + 1);
  }

  public getOwner(): Player {
    return this.owner;
  }

  public getNumber(): number {
    return this.number;
  }

  public getUnofficialNumber(): number {
    return this.unofficialNumber;
  }
}
