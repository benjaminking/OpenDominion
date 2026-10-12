import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

describe('Soothsayer', () => {
  it('with too few Curses, deals them in turn order, and only players who gained one draw', async () => {
    const game = createGame({ kingdom: ['Soothsayer'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Soothsayer', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(['Silver']);
    game.player('Cara').setDeck(['Silver']);
    game.setPileSize('Curse', 1);

    await game.start();
    await game.playAction('Soothsayer');

    expect(game.alice.discard).toEqual(['Gold']);
    expect(game.bob.discard).toEqual(['Curse']);
    expect(game.bob.hand).toEqual(['Silver']);
    expect(game.player('Cara').discard).toEqual([]);
    expect(game.player('Cara').hand).toEqual([]);
  });

  it('still makes the other players gain Curses when there is no Gold left', async () => {
    const game = createGame({ kingdom: ['Soothsayer'] });
    game.alice.setHand(['Soothsayer', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(['Silver']);
    game.setPileSize('Gold', 0);

    await game.start();
    await game.playAction('Soothsayer');

    expect(game.alice.discard).toEqual([]);
    expect(game.bob.discard).toEqual(['Curse']);
    expect(game.bob.hand).toEqual(['Silver']);
  });

  it('a player who trashes the Curse with Watchtower still gained it, so still draws', async () => {
    const game = createGame({ kingdom: ['Soothsayer', 'Watchtower'] });
    game.alice.setHand(['Soothsayer', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Watchtower', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(['Silver', ...coppers(5)]);

    await game.start();
    await game.playAction('Soothsayer');
    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Trash it');

    expect(game.trash).toEqual(['Curse']);
    expect(game.bob.discard).toEqual([]);
    expect(game.bob.hand).toEqual(['Watchtower', 'Copper', 'Copper', 'Copper', 'Copper', 'Silver']);
  });

  it('a Moat drawn because of the Curse comes too late to block it', async () => {
    const game = createGame({ kingdom: ['Soothsayer', 'Moat'] });
    game.alice.setHand(['Soothsayer', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(['Moat', ...coppers(5)]);

    await game.start();
    await game.playAction('Soothsayer');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.bob.discard).toEqual(['Curse']);
    expect(game.bob.hand).toEqual([...coppers(5), 'Moat']);
  });

  it('with 4 players and 2 Curses left, a Moat blocks one player and the Curses go to the next two', async () => {
    const game = createGame({ kingdom: ['Soothsayer', 'Moat'], players: ['Alice', 'Bob', 'Cara', 'Dave'] });
    game.alice.setHand(['Soothsayer', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(['Silver']);
    game.player('Cara').setHand(['Moat', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.player('Cara').setDeck(['Silver']);
    game.player('Dave').setHand(coppers(5));
    game.player('Dave').setDeck(['Silver']);
    game.setPileSize('Curse', 2);

    await game.start();
    await game.playAction('Soothsayer');
    game.expectDecision('chooseFromMultipleEvents', 'Cara');
    await game.chooseEffect('Moat');
    while (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.declineEffects();
    }

    expect(game.bob.discard).toEqual(['Curse']);
    expect(game.bob.hand).toContain('Silver');
    expect(game.player('Cara').discard).toEqual([]);
    expect(game.player('Cara').hand).not.toContain('Silver');
    expect(game.player('Dave').discard).toEqual(['Curse']);
    expect(game.player('Dave').hand).toContain('Silver');
    expect(game.pileSize('Curse')).toBe(0);
  });

  it('a player with no cards to draw still gains the Curse', async () => {
    const game = createGame({ kingdom: ['Soothsayer'] });
    game.alice.setHand(['Soothsayer', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Copper', 'Copper']);

    await game.start();
    await game.playAction('Soothsayer');

    // The Curse went to Bob's discard pile, so drawing shuffles it and draws it
    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Curse']);
    expect(game.bob.discard).toEqual([]);
    expect(game.alice.discard).toEqual(['Gold']);
  });
});
