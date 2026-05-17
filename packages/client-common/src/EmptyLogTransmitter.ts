import { LogMessage, LogMessageTransmitter } from '@dominion/common';

export class EmptyLogTransmitter implements LogMessageTransmitter {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public sendLogMessage(_logMessage: LogMessage): void {}
}
