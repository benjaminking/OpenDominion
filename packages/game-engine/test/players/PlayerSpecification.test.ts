import { Client } from '@dominion/client-common';
import { describe, expect, it, vi } from 'vitest';

import { Game } from '../../src/Game';
import { PlayerSpecification } from '../../src/players/PlayerSpecification';

const playerConstructor = vi.hoisted(() =>
  vi.fn((name: string, game: Game, client: Client, isBot: boolean) => ({
    name,
    game,
    client,
    isBot,
  })),
);

vi.mock('../../src/players/Player', () => ({
  Player: playerConstructor,
}));

describe('PlayerSpecification', () => {
  it('constructs players with the stored name, client, and bot flag', () => {
    const game = { label: 'game' } as unknown as Game;
    const humanClient = { id: 'human-client' } as unknown as Client;
    const botClient = { id: 'bot-client' } as unknown as Client;

    const humanPlayer = new PlayerSpecification('Alice', humanClient).toPlayer(game);
    const botPlayer = new PlayerSpecification('Bot Bob', botClient, true).toPlayer(game);

    expect(playerConstructor).toHaveBeenNthCalledWith(1, 'Alice', game, humanClient, false);
    expect(playerConstructor).toHaveBeenNthCalledWith(2, 'Bot Bob', game, botClient, true);
    expect(humanPlayer).toEqual({
      name: 'Alice',
      game,
      client: humanClient,
      isBot: false,
    });
    expect(botPlayer).toEqual({
      name: 'Bot Bob',
      game,
      client: botClient,
      isBot: true,
    });
  });
});
