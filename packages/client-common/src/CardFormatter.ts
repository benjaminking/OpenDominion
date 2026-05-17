import { LogMessage } from '@dominion/common';

export interface CardFormatter {
  format(logMessage: LogMessage): string;
}
