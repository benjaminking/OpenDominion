export class CardPlayOptions {
  protected constructor(
    public readonly shouldUseAction = true,
    public readonly shouldLog = true,
    public readonly leaveInPlace = false,
  ) {}

  static Builder = class {
    shouldUseAction = true;
    shouldLog = true;
    leaveInPlace = false;

    public dontUseAction(): this {
      this.shouldUseAction = false;
      return this;
    }

    public dontLog(): this {
      this.shouldLog = false;
      return this;
    }

    public leaveItThere(): this {
      this.leaveInPlace = true;
      return this;
    }

    public build(): CardPlayOptions {
      return new CardPlayOptions(this.shouldUseAction, this.shouldLog);
    }
  };

  public static builder() {
    return new CardPlayOptions.Builder();
  }

  // quick common configurations
  public static DONT_USE_ACTION = CardPlayOptions.builder().dontUseAction().build();
  public static DONT_LOG = CardPlayOptions.builder().dontLog().build();
  public static LEAVING_IT_THERE = CardPlayOptions.builder().dontUseAction().leaveItThere().build();
  public static DEFAULT = CardPlayOptions.builder().build();
}
