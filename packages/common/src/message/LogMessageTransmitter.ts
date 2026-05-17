import { LogMessage } from './LogMessage.js';

export interface LogMessageTransmitter {
  sendLogMessage: (logMessage: LogMessage) => void;
}
