import { LogMessageType } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { CardCollection } from '../src/card/CardCollection';
import { LogMessageVisibility, ServerLogMessage } from '../src/logging/ServerLogMessage';
import { Player } from '../src/players/Player';

const createMockPlayer = (name: string): Player => {
  return {
    getName: vi.fn(() => name),
  } as unknown as Player;
};

const createMockCardCollection = (cardNames: string[]): CardCollection => {
  const metadata = cardNames.map((name, index) => ({
    name,
    id: `${name}-${String(index)}`,
    location: 'discard',
    types: [],
    cost: {
      coins: 0,
      potions: 0,
      debt: 0,
    },
  }));

  return {
    toCardMetadataArray: vi.fn(() => metadata),
    size: vi.fn(() => metadata.length),
  } as unknown as CardCollection;
};

describe('ServerLogMessage', () => {
  describe('publicMessage', () => {
    it('should expose card metadata to both local and remote renders', () => {
      const player = createMockPlayer('Alice');
      const cards = createMockCardCollection(['Copper', 'Silver']);
      const message = ServerLogMessage.publicMessage(player, 'reveals %c', cards);

      expect(message.renderLocal(4)).toEqual({
        orderIndex: 4,
        playerName: 'Alice',
        text: 'reveals %c',
        knownCards: cards.toCardMetadataArray(),
        numUnknownCards: 0,
        type: LogMessageType.NORMAL,
      });
      expect(message.renderRemote(4)).toEqual({
        orderIndex: 4,
        playerName: 'Alice',
        text: 'reveals %c',
        knownCards: cards.toCardMetadataArray(),
        numUnknownCards: 0,
        type: LogMessageType.NORMAL,
      });
      expect(message.getVisibility()).toBe(LogMessageVisibility.PUBLIC);
    });
  });

  describe('privateMessage', () => {
    it('should hide private card identities from remote renders while keeping the unknown count', () => {
      const player = createMockPlayer('Alice');
      const cards = createMockCardCollection(['Gold', 'Province']);
      const message = ServerLogMessage.privateMessage(player, 'gains %c', cards);

      expect(message.renderRemote(7)).toEqual({
        orderIndex: 7,
        playerName: 'Alice',
        text: 'gains %c',
        knownCards: [],
        numUnknownCards: 2,
        type: LogMessageType.NORMAL,
      });
      expect(message.renderLocal(7).knownCards).toEqual(cards.toCardMetadataArray());
    });

    it('should omit hidden card counts when the message does not reference cards', () => {
      const player = createMockPlayer('Alice');
      const cards = createMockCardCollection(['Estate']);
      const message = ServerLogMessage.privateMessage(player, 'passes', cards);

      expect(message.renderRemote(2)).toEqual({
        orderIndex: 2,
        playerName: 'Alice',
        text: 'passes',
        knownCards: [],
        numUnknownCards: 0,
        type: LogMessageType.NORMAL,
      });
    });
  });

  describe('localMessage', () => {
    it('should stay visible only to the local player', () => {
      const player = createMockPlayer('Alice');
      const cards = createMockCardCollection(['Curse']);
      const message = ServerLogMessage.localMessage(player, 'keeps %c', cards);

      expect(message.renderRemote(1)).toBeUndefined();
      expect(message.renderLocal(1)).toEqual({
        orderIndex: 1,
        playerName: 'Alice',
        text: 'keeps %c',
        knownCards: cards.toCardMetadataArray(),
        numUnknownCards: 0,
        type: LogMessageType.NORMAL,
      });
    });
  });

  describe('turnStartMessage', () => {
    it('should render a turn-start log entry with public visibility', () => {
      const player = createMockPlayer('Alice');
      const message = ServerLogMessage.turnStartMessage(player, 3);

      expect(message.renderLocal(5)).toEqual({
        orderIndex: 5,
        playerName: 'Alice',
        text: "'s Turn #3",
        knownCards: [],
        numUnknownCards: 0,
        type: LogMessageType.TURN_START,
      });
      expect(message.renderRemote(5)).toEqual(message.renderLocal(5));
      expect(message.getVisibility()).toBe(LogMessageVisibility.PUBLIC);
    });
  });
});
