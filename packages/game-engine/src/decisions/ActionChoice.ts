export class ActionChoice {
  constructor(
    private readonly name: string,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private readonly action: (() => Promise<void>) | (() => void) = () => {}
  ) {}

  public getName(): string {
    return this.name;
  }

  public async performAction(): Promise<void> {
    return this.action();
  }
}
