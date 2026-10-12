import { Client, EmptyLogTransmitter } from '@dominion/client-common';
import { DecisionService, GameMessageTransmitter } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { Game } from '../../../src/Game';
import { PlayerSpecification } from '../../../src/players/PlayerSpecification';
import { GameInitializer } from '../../../src/setup/GameInitializer';
import { createGame } from '../gameHarness';

const COPPERS = Array<string>(10).fill('Copper');

/**
 * Sets up a real 2-player game without the harness (which empties every deck) and returns each player's
 * starting cards (sorted) and starting score. No decision is ever asked, so the services are empty stubs.
 */
const startingDecks = (useShelters: boolean): { cards: string[]; score: number }[] => {
  const stub = new Proxy({}, { get: () => () => undefined });
  const specifications = ['Alice', 'Bob'].map(
    (name) =>
      new PlayerSpecification(
        name,
        new Client(stub as DecisionService, new EmptyLogTransmitter(), stub as GameMessageTransmitter),
      ),
  );
  const initializer = new GameInitializer(specifications, ['Rats'], { useShelters, useColoniesPlatinum: false });
  const game = (initializer as unknown as { game: Game }).game;
  return game
    .getPlayers()
    .getAllPlayers()
    .map((player) => {
      player.calculateScore();
      return {
        cards: player
          .getOwnedCards()
          .getAllCards()
          .map((card) => card.getName())
          .sort(),
        score: player.getStatistics().getScore(),
      };
    });
};

describe('Necropolis', () => {
  it('can be part of a starting deck in a game with Shelters', () => {
    expect(() => createGame({ kingdom: ['Rats'], useShelters: true })).not.toThrow();
  });

  it('gives +2 Actions in a real turn, so two more Actions can be played', async () => {
    const game = createGame({ kingdom: ['Smithy'] });
    game.alice.setHand(['Necropolis', 'Smithy', 'Smithy', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Necropolis');
    expect(game.alice.actions).toBe(2);
    await game.playAction('Smithy');
    await game.playAction('Smithy');

    expect(game.alice.inPlay).toEqual(['Necropolis', 'Smithy', 'Smithy']);
    expect(game.alice.actions).toBe(0);
  });

  it('is not in the Supply, so it has no pile and cannot be bought', async () => {
    const game = createGame({ kingdom: ['Smithy'] });
    game.alice.setHand(['Copper', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    expect(game.hasPile('Necropolis')).toBe(false);
    const buy = game.expectDecision('treasurePhase', 'Alice');
    expect(buy.cardChoices.map((choice) => choice.card.name)).not.toContain('Necropolis');
  });

  it('replaces an Estate in every starting deck in a game with Shelters, along with Hovel and Overgrown Estate', () => {
    const shelterDeck = [...Array<string>(7).fill('Copper'), 'Hovel', 'Necropolis', 'Overgrown Estate'].sort();
    for (const deck of startingDecks(true)) {
      expect(deck.cards).toEqual(shelterDeck);
      // Shelters are worth nothing, so every player starts on 0 VP
      expect(deck.score).toBe(0);
    }
    for (const deck of startingDecks(false)) {
      expect(deck.cards).toEqual([...Array<string>(7).fill('Copper'), 'Estate', 'Estate', 'Estate']);
      expect(deck.score).toBe(3);
    }
  });

  it('is played by Golem as an Action card, giving +2 Actions', async () => {
    const game = createGame({ kingdom: ['Golem', 'Smithy'] });
    game.alice.setHand(['Golem', 'Smithy', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Necropolis', 'Copper', 'Ruined Village', ...COPPERS]);

    await game.start();
    await game.playAction('Golem');
    await game.chooseCard('Necropolis');

    game.expectDecision('actionPhase', 'Alice');
    expect(game.alice.inPlay).toEqual(['Golem', 'Necropolis', 'Ruined Village']);
    expect(game.alice.actions).toBe(3);
    await game.playAction('Smithy');
    expect(game.alice.actions).toBe(2);
  });
});
