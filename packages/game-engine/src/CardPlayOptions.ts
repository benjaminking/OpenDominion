export class CardPlayOptionsBuilder {
  instance: CardPlayOptions = new CardPlayOptions();
  public dontUseAction(): this {
    this.instance.shouldUseAction = false;
    return this;
  }

  public dontLog(): this {
    this.instance.shouldLog = false;
    return this;
  }

  public build(): CardPlayOptions {
    return this.instance;
  }
}

export class CardPlayOptions {
  shouldUseAction = true;
  shouldLog = true;

  // quick common configurations
  public static DONT_USE_ACTION = new CardPlayOptionsBuilder().dontUseAction().build();
  public static DONT_LOG = new CardPlayOptionsBuilder().dontLog().build();
  public static DEFAULT = new CardPlayOptionsBuilder().build();
}
