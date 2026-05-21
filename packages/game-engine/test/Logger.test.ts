import { LogMessage, LogMessageType } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { Game } from '../src/Game';
import { Logger } from '../src/logging/Logger';
import { ServerLogMessage } from '../src/logging/ServerLogMessage';
import { Player } from '../src/players/Player';

const createRecipient = (name: string): Player => {
  return {
    getName: vi.fn(() => name),
    transmitLogMessage: vi.fn(),
  } as unknown as Player;
};

describe('Logger', () => {
  describe('gameMessage', () => {
    it('should send the local render to the owner, the remote render to every opponent, and increment the order index', () => {
      const ownerRecipient = createRecipient('Alice');
      const opponentOne = createRecipient('Bob');
      const opponentTwo = createRecipient('Carol');
      const players = {
        getPlayerByName: vi.fn(() => ownerRecipient),
        getOpponentsOfPlayerByName: vi.fn(() => [opponentOne, opponentTwo]),
      };
      const game = {
        getPlayers: vi.fn(() => players),
      } as unknown as Game;
      const logger = new Logger(game);
      const localMessage: LogMessage = {
        orderIndex: 0,
        playerName: 'Alice',
        text: 'local',
        knownCards: [],
        numUnknownCards: 0,
        type: LogMessageType.NORMAL,
      };
      const remoteMessage: LogMessage = {
        ...localMessage,
        text: 'remote',
      };
      const message = {
        renderLocal: vi.fn().mockReturnValue(localMessage),
        renderRemote: vi.fn().mockReturnValue(remoteMessage),
      } as unknown as ServerLogMessage;
      const sourcePlayer = {
        getName: vi.fn(() => 'Alice'),
      } as unknown as Player;

      logger.gameMessage(sourcePlayer, message);
      logger.gameMessage(sourcePlayer, message);

      expect(message.renderLocal).toHaveBeenNthCalledWith(1, 0);
      expect(message.renderRemote).toHaveBeenNthCalledWith(1, 0);
      expect(message.renderLocal).toHaveBeenNthCalledWith(2, 1);
      expect(message.renderRemote).toHaveBeenNthCalledWith(2, 1);
      expect(ownerRecipient.transmitLogMessage).toHaveBeenCalledTimes(2);
      expect(ownerRecipient.transmitLogMessage).toHaveBeenNthCalledWith(1, localMessage);
      expect(opponentOne.transmitLogMessage).toHaveBeenCalledTimes(2);
      expect(opponentOne.transmitLogMessage).toHaveBeenNthCalledWith(1, remoteMessage);
      expect(opponentTwo.transmitLogMessage).toHaveBeenCalledTimes(2);
      expect(players.getPlayerByName).toHaveBeenCalledWith('Alice');
      expect(players.getOpponentsOfPlayerByName).toHaveBeenCalledWith('Alice');
    });

    it('should skip opponent delivery when the remote render is undefined', () => {
      const ownerRecipient = createRecipient('Alice');
      const opponent = createRecipient('Bob');
      const players = {
        getPlayerByName: vi.fn(() => ownerRecipient),
        getOpponentsOfPlayerByName: vi.fn(() => [opponent]),
      };
      const game = {
        getPlayers: vi.fn(() => players),
      } as unknown as Game;
      const logger = new Logger(game);
      const localMessage: LogMessage = {
        orderIndex: 0,
        playerName: 'Alice',
        text: 'local only',
        knownCards: [],
        numUnknownCards: 0,
        type: LogMessageType.NORMAL,
      };
      const message = {
        renderLocal: vi.fn().mockReturnValue(localMessage),
        renderRemote: vi.fn().mockReturnValue(undefined),
      } as unknown as ServerLogMessage;
      const sourcePlayer = {
        getName: vi.fn(() => 'Alice'),
      } as unknown as Player;

      logger.gameMessage(sourcePlayer, message);

      expect(ownerRecipient.transmitLogMessage).toHaveBeenCalledWith(localMessage);
      expect(opponent.transmitLogMessage).not.toHaveBeenCalled();
    });
  });
});
