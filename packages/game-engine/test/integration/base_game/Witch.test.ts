import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { revealMoat } from './baseGameHelpers';

const coppers = (n: number): string[] => Array<string>(n).fill('Copper');

describe('Witch', () => {
  it('gives out the last Curse in turn order when the pile runs low', async () => {
    const game = createGame({ kingdom: ['Witch'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Witch', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    const cara = game.player('Cara');
    game.setPileSize('Curse', 1);

    await game.start();
    await game.playAction('Witch');

    expect(game.bob.discard).toEqual(['Curse']);
    expect(cara.discard).toEqual([]);
    expect(game.pileSize('Curse')).toBe(0);
  });

  it('still draws 2 cards when the Curse pile is empty', async () => {
    const game = createGame({ kingdom: ['Witch'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Witch', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', 'Gold', 'Copper', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.setPileSize('Curse', 0);

    await game.start();
    await game.playAction('Witch');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Silver', 'Gold']);
    expect(game.bob.discard).toEqual([]);
    expect(game.player('Cara').discard).toEqual([]);
  });

  it('skips a player who reveals Moat: the next player in turn order gets the last Curse', async () => {
    const game = createGame({ kingdom: ['Witch', 'Moat'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Witch', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Moat', 'Copper', 'Copper', 'Copper', 'Copper']);
    const cara = game.player('Cara');
    game.setPileSize('Curse', 1);

    await game.start();
    await game.playAction('Witch');
    await revealMoat(game, 'Bob');

    expect(game.bob.discard).toEqual([]);
    expect(cara.discard).toEqual(['Curse']);
  });

  it("gives Curses in turn order starting from the attacker's left, on another player's turn", async () => {
    const game = createGame({ kingdom: ['Witch'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(coppers(5));
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Witch', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));
    const cara = game.player('Cara');
    game.setPileSize('Curse', 1);

    await game.start();
    await game.endTurn();
    await game.playAction('Witch');

    expect(cara.discard).toEqual(['Curse']);
    expect(game.alice.discard).not.toContain('Curse');
  });

  it('gives Curses to the first players in turn order in a 4-player game when the pile runs low', async () => {
    const game = createGame({ kingdom: ['Witch'], players: ['Alice', 'Bob', 'Cara', 'Dave'] });
    game.alice.setHand(['Witch', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.setPileSize('Curse', 2);

    await game.start();
    await game.playAction('Witch');

    expect(game.bob.discard).toEqual(['Curse']);
    expect(game.player('Cara').discard).toEqual(['Curse']);
    expect(game.player('Dave').discard).toEqual([]);
  });

  it('can give the last Curse to the next player after a target exchanges it with Trader', async () => {
    const game = createGame({ kingdom: ['Witch', 'Trader'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Witch', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Trader', 'Copper', 'Copper', 'Copper', 'Copper']);
    const cara = game.player('Cara');
    game.setPileSize('Curse', 1);

    await game.start();
    await game.playAction('Witch');
    // Bob exchanges the Curse for a Silver: the Curse goes back to its pile
    await game.chooseEffect('Trader');

    expect(game.bob.discard).toEqual(['Silver']);
    expect(cara.discard).toEqual(['Curse']);
    expect(game.pileSize('Curse')).toBe(0);
  });

  it('does not give the next player a Curse that a target trashed with Watchtower', async () => {
    const game = createGame({ kingdom: ['Witch', 'Watchtower'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Witch', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Watchtower', 'Copper', 'Copper', 'Copper', 'Copper']);
    const cara = game.player('Cara');
    game.setPileSize('Curse', 1);

    await game.start();
    await game.playAction('Witch');
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Trash it');

    expect(game.trash).toEqual(['Curse']);
    expect(game.bob.discard).toEqual([]);
    expect(cara.discard).toEqual([]);
  });

  it('draws only the 1 card left in the deck and discard pile, and still gives a Curse', async () => {
    const game = createGame({ kingdom: ['Witch'] });
    game.alice.setHand(['Witch', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDiscard(['Silver']);

    await game.start();
    await game.playAction('Witch');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Silver']);
    expect(game.alice.discard).toEqual([]);
    expect(game.bob.discard).toEqual(['Curse']);
  });

  it('giving the last Curse as the third empty Supply pile ends the game only after the turn', async () => {
    const game = createGame({ kingdom: ['Witch', 'Village', 'Smithy'] });
    game.alice.setHand(['Witch', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.setPileSize('Village', 0);
    game.setPileSize('Smithy', 0);
    game.setPileSize('Curse', 1);

    await game.start();
    await game.playAction('Witch');

    expect(game.bob.discard).toEqual(['Curse']);
    expect(game.isFinished).toBe(false);
    await game.playAllTreasures();
    await game.buy('Silver');

    expect(game.isFinished).toBe(true);
    expect(game.alice.discard).toContain('Silver');
  });
});
