import stringify from 'json-stable-stringify';

export class MessageHandler<MessageType extends object, IndexFields extends keyof MessageType = never> {
  private subscribers: Map<string, ((message: Omit<MessageType, IndexFields>) => void)[]>;
  private mostRecentValues: Map<string, Omit<MessageType, IndexFields>>;

  constructor(private readonly indexFieldNames: string[] = []) {
    this.subscribers = new Map();
    this.mostRecentValues = new Map();
  }

  public handleMessage(messageContent: MessageType) {
    const key: string = this.createKey(messageContent);
    const value: Omit<MessageType, IndexFields> = this.createValue(messageContent);
    this.sendMessageToSubscribers(key, value);

    this.mostRecentValues.set(key, value);
  }

  private createKey(messageContent: MessageType): string {
    const key: Pick<MessageType, IndexFields> = this.pick<MessageType, IndexFields>(
      messageContent,
      this.indexFieldNames,
    );
    return this.createKeyStr(key);
  }

  private createKeyStr(key: Pick<MessageType, IndexFields>): string {
    const keyStr: string | undefined = stringify(key);
    return keyStr ?? '';
  }

  private createValue(messageContent: MessageType): Omit<MessageType, IndexFields> {
    return this.omit<MessageType, IndexFields>(messageContent, this.indexFieldNames);
  }

  public subscribe(
    key: Pick<MessageType, IndexFields>,
    callback: (message: Omit<MessageType, IndexFields>) => void,
  ): void {
    const keyStr = this.createKeyStr(key);
    if (!this.subscribers.has(keyStr)) {
      this.subscribers.set(keyStr, []);
    }
    this.subscribers.get(keyStr)!.push(callback);

    if (this.mostRecentValues.has(keyStr)) {
      callback(this.mostRecentValues.get(keyStr)!);
    }
  }

  protected sendMessageToSubscribers(key: string, value: Omit<MessageType, IndexFields>): void {
    if (this.subscribers.has(key)) {
      this.subscribers.get(key)!.forEach((callback) => {
        callback(value);
      });
    }
  }

  private pick<T extends object, K extends keyof T>(obj: T, keys: string[]): Pick<T, K> {
    const result = {} as Pick<T, K>;
    for (const key of keys) {
      if (key in obj) {
        result[key as K] = obj[key as K];
      }
    }
    return result;
  }

  private omit<T extends object, K extends keyof T>(obj: T, keys: string[]): Omit<T, K> {
    const result = { ...obj };
    for (const key of keys) {
      if (key in obj) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete result[key as K];
      }
    }
    return result;
  }
}
