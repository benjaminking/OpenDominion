import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { createGame, GameHarness } from '../gameHarness';

const COPPERS = Array<string>(20).fill('Copper');

/** Replaces the Ruins pile with the given cards, listed top card first. */
const setRuinsPile = (game: GameHarness, names: string[]): void => {
  game.setPileSize('Ruins', 0);
  for (const name of [...names].reverse()) {
    const card = game.alice.createCard(name, CardLocation.PILE);
    card.markAsSupplyCard();
    game.state.piles.returnCardToPile(card);
  }
};

const setUp = (ruins: string[]) => {
  const game = createGame({ players: ['Alice', 'Bob', 'Cara'], kingdom: ['Marauder'] });
  game.alice.setHand(['Marauder', 'Copper', 'Copper', 'Copper', 'Copper']);
  game.alice.setDeck(COPPERS);
  setRuinsPile(game, ruins);
  return game;
};

describe('Marauder', () => {
  it('gains a Spoils, then each other player gains the top Ruins in turn order', async () => {
    const game = setUp(['Abandoned Mine', 'Ruined Village', 'Survivors']);
    const spoils = game.pileSize('Spoils');

    await game.start();
    await game.playAction('Marauder');

    expect(game.alice.discard).toEqual(['Spoils']);
    expect(game.pileSize('Spoils')).toBe(spoils - 1);
    expect(game.bob.discard).toEqual(['Abandoned Mine']);
    expect(game.player('Cara').discard).toEqual(['Ruined Village']);
    expect(game.pileSize('Ruins')).toBe(1);
  });

  it('stops giving out Ruins when the Ruins pile runs out', async () => {
    const game = setUp(['Survivors']);

    await game.start();
    await game.playAction('Marauder');

    expect(game.alice.discard).toEqual(['Spoils']);
    expect(game.bob.discard).toEqual(['Survivors']);
    expect(game.player('Cara').discard).toEqual([]);
  });

  it('still gives Ruins to a player who reacts with Beggar', async () => {
    const game = setUp(['Abandoned Mine', 'Ruined Village', 'Survivors']);
    game.bob.setHand(['Beggar', 'Copper', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Marauder');
    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Beggar');

    expect(game.bob.discard).toEqual(expect.arrayContaining(['Beggar', 'Silver', 'Abandoned Mine']));
    expect(game.player('Cara').discard).toEqual(['Ruined Village']);
  });
});

describe('Marauder: interactions', () => {
  it('with an empty Spoils pile still gives each other player a Ruins', async () => {
    const game = setUp(['Abandoned Mine', 'Ruined Village']);
    game.setPileSize('Spoils', 0);

    await game.start();
    await game.playAction('Marauder');

    expect(game.alice.discard).toEqual([]);
    expect(game.bob.discard).toEqual(['Abandoned Mine']);
    expect(game.player('Cara').discard).toEqual(['Ruined Village']);
  });

  it('a player who reveals Moat gains no Ruins, but Marauder still gains a Spoils', async () => {
    const game = setUp(['Abandoned Mine', 'Ruined Village']);
    game.bob.setHand(['Moat', 'Copper', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Marauder');
    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Moat');

    expect(game.alice.discard).toEqual(['Spoils']);
    expect(game.bob.discard).toEqual([]);
    expect(game.player('Cara').discard).toEqual(['Abandoned Mine']);
  });

  it("played on the second player's turn gives Ruins starting with the player to their left, wrapping around (3 players)", async () => {
    const game = createGame({ players: ['Alice', 'Bob', 'Cara'], kingdom: ['Marauder'] });
    const cara = game.player('Cara');
    game.alice.setHand(['Copper', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Marauder', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(COPPERS);
    cara.setHand(['Copper', 'Copper', 'Copper', 'Copper', 'Copper']);
    setRuinsPile(game, ['Abandoned Mine', 'Ruined Village', 'Survivors']);

    await game.start();
    await game.endTurn();
    expect(game.currentPlayerName).toBe('Bob');
    await game.playAction('Marauder');

    expect(game.bob.discard).toEqual(['Spoils']);
    expect(cara.discard).toEqual(['Abandoned Mine']);
    expect(game.alice.discard.filter((name) => name !== 'Copper')).toEqual(['Ruined Village']);
    expect(game.pileCards('Ruins')).toEqual(['Survivors']);
  });
});
