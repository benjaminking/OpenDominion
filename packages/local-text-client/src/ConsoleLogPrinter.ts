import { CardFormatter } from '@dominion/client-common';
import { LogMessage, LogMessageTransmitter, LogMessageType } from '@dominion/common';

import { ConsoleCardFormatter } from './ConsoleCardFormatter';

export class ConsoleLogPrinter implements LogMessageTransmitter {
  private cardFormatter: CardFormatter = new ConsoleCardFormatter();

  public addTurnStartMessage(logMessage: LogMessage): void {
    console.log('\n' + logMessage.playerName + ' ' + logMessage.text);
    console.log('====================================');
  }

  public sendLogMessage(logMessage: LogMessage): void {
    if (logMessage.type === LogMessageType.TURN_START) {
      this.addTurnStartMessage(logMessage);
    } else {
      this.printNormalLogMessage(logMessage);
    }
  }

  private printNormalLogMessage(logMessage: LogMessage): void {
    let message = logMessage.text;
    if (message.includes('%c')) {
      message = message.replace('%c', this.cardFormatter.format(logMessage));
    }
    console.log(logMessage.playerName + ' ' + message);
  }
}
