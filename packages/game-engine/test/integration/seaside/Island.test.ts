import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { coppers, offered, putOnIslandMat } from './seasideHelpers';

describe('Island', () => {
  it('puts itself and a chosen card from hand onto the Island mat, where they stay', async () => {
    const game = createGame({ kingdom: ['Island'] });
    game.alice.setHand(['Island', 'Estate', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Island');
    // Setting a card aside is mandatory
    expect(game.expectDecision('chooseCard', 'Alice').noneAllowed).toBe(false);
    await game.chooseCard('Estate');
    await game.endTurn();

    expect(game.alice.islandMat).toEqual(['Island', 'Estate']);
    expect(game.alice.inPlay).toEqual([]);
    expect(game.alice.discard).not.toContain('Island');
  });

  it('puts only itself onto the Island mat when the hand is otherwise empty', async () => {
    const game = createGame({ kingdom: ['Island'] });
    game.alice.setHand(['Island']);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Island');

    expect(game.alice.islandMat).toEqual(['Island']);
    expect(game.alice.inPlay).toEqual([]);
  });

  it('sets aside two cards with it when played twice by Throne Room', async () => {
    const game = createGame({ kingdom: ['Island', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Island', 'Estate', 'Duchy', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Island');
    await game.chooseCard('Estate');
    await game.chooseCard('Duchy');

    // On the second play, Island is already on the mat
    expect(game.alice.log).toContain('Alice has lost track of Island');
    expect([...game.alice.islandMat].sort()).toEqual(['Duchy', 'Estate', 'Island']);
    expect(game.alice.inPlay).toEqual(['Throne Room']);
  });

  it('is worth 2 VP at the end of the game', async () => {
    const game = createGame({ kingdom: ['Island'] });
    game.alice.setHand(coppers(5));
    game.alice.setDeck(['Island']);
    game.setPileSize('Province', 0);

    await game.start();
    await game.endTurn();

    expect(game.isFinished).toBe(true);
    expect(game.alice.score).toBe(2);
  });

  it('counts the cards on the Island mat at the end of the game', async () => {
    const game = createGame({ kingdom: ['Island'] });
    game.alice.setHand(coppers(5));
    putOnIslandMat(game.alice, ['Estate', 'Estate']);
    game.setPileSize('Province', 0);

    await game.start();
    await game.endTurn();

    expect(game.isFinished).toBe(true);
    expect(game.alice.score).toBe(2);
  });

  it('leaves Island in the Supply when Band of Misfits plays it, but still puts the chosen card on the mat', async () => {
    const game = createGame({ kingdom: ['Island', 'Band Of Misfits'] });
    game.alice.setHand(['Band Of Misfits', 'Estate', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));
    const islands = game.pileSize('Island');

    await game.start();
    await game.playAction('Band Of Misfits');
    await game.chooseCard('Island');
    await game.chooseCard('Estate');

    expect(game.alice.log).toContain('Alice has lost track of Island');
    expect(game.alice.islandMat).toEqual(['Estate']);
    expect(game.pileSize('Island')).toBe(islands);
    expect(game.alice.inPlay).toEqual(['Band Of Misfits']);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual([]);
    expect(game.alice.discard).toContain('Band Of Misfits');
    expect(game.alice.islandMat).toEqual(['Estate']);
  });

  it('puts itself and a card from hand onto the mat when played by Golem', async () => {
    const game = createGame({ kingdom: ['Island', 'Golem', 'Village'] });
    game.alice.setHand(['Golem', 'Estate', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Island', 'Village', ...coppers(20)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Golem');
    await game.chooseCard('Island');
    await game.chooseCard('Estate');

    expect(game.alice.islandMat).toEqual(['Island', 'Estate']);
    expect(game.alice.inPlay).toEqual(['Golem', 'Village']);
    await game.endTurn();

    expect(game.alice.islandMat).toEqual(['Island', 'Estate']);
    expect(game.alice.discard).not.toContain('Island');
  });
  it('is not trashed when played twice by Procession, which still gains an Action costing exactly $1 more', async () => {
    const game = createGame({ kingdom: ['Island', 'Procession', 'Market'] });
    game.alice.setHand(['Procession', 'Island', 'Estate', 'Duchy', 'Copper']);
    game.alice.setDeck(coppers(20));

    await game.start();
    await game.playAction('Procession');
    await game.chooseCard('Island');
    await game.chooseCard('Estate');
    await game.chooseCard('Duchy');
    expect(game.alice.islandMat).toEqual(['Island', 'Estate', 'Duchy']);

    // The Island is on the mat, so it can't be trashed, but a $5 Action is still gained
    const gain = offered(game.expectDecision('chooseCard', 'Alice'));
    expect(gain).toContain('Market');
    expect(gain).not.toContain('Island');
    await game.chooseCard('Market');

    expect(game.trash).toEqual([]);
    expect(game.alice.islandMat).toEqual(['Island', 'Estate', 'Duchy']);
    expect(game.alice.discard).toEqual(['Market']);
    expect(game.alice.inPlay).toEqual(['Procession']);
  });

  it("puts only itself and the one card from hand on the mat when played three times by King's Court", async () => {
    const game = createGame({ kingdom: ['Island', "King's Court"] });
    game.alice.setHand(["King's Court", 'Island', 'Estate']);
    game.alice.setDeck(coppers(20));

    await game.start();
    await game.playAction("King's Court");
    await game.chooseCard('Island');
    await game.chooseCard('Estate');

    expect(game.alice.islandMat).toEqual(['Island', 'Estate']);
    expect(game.alice.hand).toEqual([]);
    expect(game.alice.inPlay).toEqual(["King's Court"]);
    expect(game.pending.playerName).toBe('Alice');
    expect(game.pending.kind).not.toBe('chooseCard');
  });
});
