import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { coppers, resolveEffects } from './seasideHelpers';

describe('Sea Witch', () => {
  it('curses each other player, then at the start of the next turn draws 2 cards and discards 2', async () => {
    const game = createGame({ kingdom: ['Sea Witch'], players: ['Alice', 'Bob', 'Cara'] });
    const cara = game.player('Cara');
    game.alice.setHand(['Sea Witch', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', 'Silver', ...coppers(5), 'Estate', 'Estate', ...coppers(10)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));
    cara.setHand(coppers(5));
    cara.setDeck(coppers(10));

    await game.start();
    await game.playAction('Sea Witch');
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Silver', 'Silver']);
    expect(game.bob.discard).toEqual(['Curse']);
    expect(cara.discard).toEqual(['Curse']);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual(['Sea Witch']);
    await game.endTurn();
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    const discard = game.expectDecision('chooseCards', 'Alice');
    expect(discard.numSelectedEligibility).toEqual([2]);
    expect(game.alice.hand).toHaveLength(7);
    await game.chooseCards(['Estate', 'Estate']);

    expect(game.alice.hand).toEqual(coppers(5));
    expect(game.alice.inPlay).toEqual(['Sea Witch']);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual([]);
    expect(game.alice.discard).toContain('Sea Witch');
  });

  it('discards the only card in hand at the start of the next turn when there is nothing left to draw', async () => {
    const game = createGame({ kingdom: ['Sea Witch'] });
    game.alice.setHand(['Sea Witch']);
    game.alice.setDeck(['Copper']);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Sea Witch');
    expect(game.alice.hand).toEqual(['Copper']);
    await game.endTurn();
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    if (game.pending.kind === 'chooseCards') {
      await game.chooseCards(['Copper']);
    }
    expect(game.alice.hand).toEqual([]);
    expect(game.alice.discard).toEqual(['Copper']);
  });

  it('curses twice, then draws 2 and discards 2 twice at the start of the next turn when played twice by Throne Room', async () => {
    const game = createGame({ kingdom: ['Sea Witch', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Sea Witch', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck([...coppers(9), 'Estate', 'Estate', 'Estate', 'Estate', ...coppers(10)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Sea Witch');
    expect(game.alice.hand).toHaveLength(7);
    expect(game.bob.discard).toEqual(['Curse', 'Curse']);
    await game.endTurn();
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    await game.chooseCards(['Estate', 'Estate']);
    expect(game.pending.kind).toBe('chooseCards');
    await game.chooseCards(['Estate', 'Estate']);
    expect(game.alice.hand).toEqual(coppers(5));
  });

  it("curses 3 times, then draws 2 and discards 2 three times at the start of the next turn when played by King's Court", async () => {
    const game = createGame({ kingdom: ['Sea Witch', "King's Court"] });
    game.alice.setHand(["King's Court", 'Sea Witch', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck([...coppers(11), 'Estate', 'Estate', 'Estate', 'Estate', 'Estate', 'Estate', ...coppers(10)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction("King's Court");
    await game.chooseCard('Sea Witch');
    expect(game.alice.hand).toHaveLength(9);
    expect(game.bob.discard).toEqual(['Curse', 'Curse', 'Curse']);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual(["King's Court", 'Sea Witch']);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    for (let i = 0; i < 3; i++) {
      await game.chooseCards(['Estate', 'Estate']);
    }
    expect(game.alice.hand).toEqual(coppers(5));
    expect(game.alice.inPlay).toEqual(["King's Court", 'Sea Witch']);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual([]);
  });

  it('lets a player reveal Moat to each play of a Sea Witch played twice by Throne Room', async () => {
    const game = createGame({ kingdom: ['Sea Witch', 'Throne Room', 'Moat'] });
    game.alice.setHand(['Throne Room', 'Sea Witch', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(['Moat', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Sea Witch');
    await game.chooseEffect('Moat');
    expect(game.bob.discard).toEqual([]);

    // The second play is a separate Attack; this time Bob doesn't reveal Moat
    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.declineEffects();
    expect(game.bob.discard).toEqual(['Curse']);
  });

  it('draws and discards nothing at the start of the next turn when there are no cards to draw or discard', async () => {
    const game = createGame({ kingdom: ['Sea Witch'] });
    game.alice.setHand(['Sea Witch']);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Sea Witch');
    expect(game.alice.hand).toEqual([]);
    expect(game.bob.discard).toEqual(['Curse']);
    await game.endTurn();
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    if (game.pending.kind === 'chooseCards') {
      await game.chooseCards([]);
    }
    expect(game.alice.hand).toEqual([]);
    expect(game.alice.discard).toEqual([]);
    expect(game.alice.inPlay).toEqual(['Sea Witch']);
  });
  it('gives the last Curse to the next player in turn order only', async () => {
    const game = createGame({ kingdom: ['Sea Witch'], players: ['Alice', 'Bob', 'Cara'] });
    const cara = game.player('Cara');
    game.alice.setHand(['Sea Witch', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    cara.setHand(coppers(5));
    game.setPileSize('Curse', 1);

    await game.start();
    await game.playAction('Sea Witch');

    expect(game.bob.discard).toEqual(['Curse']);
    expect(cara.discard).toEqual([]);
    expect(game.pileSize('Curse')).toBe(0);
  });

  it('ends the game only after the turn when its Curses empty a third pile', async () => {
    const game = createGame({ kingdom: ['Sea Witch', 'Village', 'Smithy'] });
    game.alice.setHand(['Sea Witch', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));
    game.setPileSize('Village', 0);
    game.setPileSize('Smithy', 0);
    game.setPileSize('Curse', 1);

    await game.start();
    await game.playAction('Sea Witch');
    expect(game.pileSize('Curse')).toBe(0);
    expect(game.isFinished).toBe(false);
    await game.playAllTreasures();
    await game.buy('Silver');

    expect(game.isFinished).toBe(true);
    expect(game.alice.discard).toContain('Silver');
    expect(game.bob.score).toBe(-1);
  });

  it('draws 2 and discards 2 on the Outpost turn when played on the same turn as Outpost', async () => {
    const game = createGame({ kingdom: ['Sea Witch', 'Outpost', 'Village'] });
    game.alice.setHand(['Village', 'Sea Witch', 'Outpost', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Copper', ...coppers(3), 'Estate', 'Estate', ...coppers(10)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Sea Witch');
    await game.playAction('Outpost');
    await game.endTurn();
    await game.chooseExtraTurn('Outpost');
    await resolveEffects(game, ['Sea Witch']);

    // 3-card hand, +2 Cards, then discard 2
    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toHaveLength(5);
    await game.chooseCards(['Estate', 'Estate']);
    await resolveEffects(game);
    expect(game.alice.hand).toEqual(coppers(3));
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.inPlay).toEqual([]);
  });
});
