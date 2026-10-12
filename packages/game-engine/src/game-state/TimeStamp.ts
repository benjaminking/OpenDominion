export class TimeStamp {
  public constructor(private readonly timeStamp: number) {}

  public isBefore(otherTimeStamp: TimeStamp): boolean {
    return this.timeStamp < otherTimeStamp.timeStamp;
  }

  public isAfter(otherTimeStamp: TimeStamp): boolean {
    return this.timeStamp > otherTimeStamp.timeStamp;
  }

  public isEqualTo(otherTimeStamp: TimeStamp): boolean {
    return this.timeStamp === otherTimeStamp.timeStamp;
  }
}
