import { TimeStamp } from './TimeStamp';

export class Clock {
  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
  private currentTime: number = 0;

  public createTimeStamp(): TimeStamp {
    return new TimeStamp(this.currentTime);
  }

  public advanceTime(): void {
    this.currentTime++;
  }
}
