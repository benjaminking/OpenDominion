import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { coppers, offeredEffects, resolveEffects } from './seasideHelpers';

describe('Tide Pools', () => {
  it('gives +3 Cards and +1 Action, then makes its owner discard 2 cards at the start of the next turn', async () => {
    const game = createGame({ kingdom: ['Tide Pools'] });
    game.alice.setHand(['Tide Pools', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', 'Silver', 'Silver', 'Estate', 'Estate', ...coppers(15)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Tide Pools');
    expect(game.alice.hand).toHaveLength(7);
    expect(game.alice.actions).toBe(1);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual(['Tide Pools']);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.expectDecision('chooseCards', 'Alice').numSelectedEligibility).toEqual([2]);
    await game.chooseCards(['Estate', 'Estate']);
    expect(game.alice.hand).toEqual(coppers(3));
    expect(game.alice.inPlay).toEqual(['Tide Pools']);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual([]);
  });

  it('discards the only card in hand at the start of the next turn', async () => {
    const game = createGame({ kingdom: ['Tide Pools'] });
    game.alice.setHand(['Tide Pools']);
    game.alice.setDeck(['Copper']);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Tide Pools');
    await game.endTurn();
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toEqual(['Copper']);
    if (game.pending.kind === 'chooseCards') {
      await game.chooseCards(['Copper']);
    }
    expect(game.alice.hand).toEqual([]);
    expect(game.alice.discard).toEqual(['Copper']);
  });

  it('makes its owner discard 2 cards twice at the start of the next turn when played twice by Throne Room', async () => {
    const game = createGame({ kingdom: ['Tide Pools', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Tide Pools', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck([...coppers(6), 'Estate', 'Estate', 'Estate', 'Estate', 'Copper', ...coppers(10)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Tide Pools');
    expect(game.alice.hand).toHaveLength(9);
    expect(game.alice.actions).toBe(2);
    await game.endTurn();
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    await game.chooseCards(['Estate', 'Estate']);
    expect(game.pending.kind).toBe('chooseCards');
    await game.chooseCards(['Estate', 'Estate']);
    expect(game.alice.hand).toEqual(['Copper']);
  });

  it('discards nothing at the start of the next turn when the hand is empty, and is discarded that turn', async () => {
    const game = createGame({ kingdom: ['Tide Pools'] });
    game.alice.setHand(['Tide Pools']);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Tide Pools');
    await game.endTurn();

    expect(game.alice.hand).toEqual([]);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    if (game.pending.kind === 'chooseCards') {
      await game.chooseCards([]);
    }
    expect(game.alice.hand).toEqual([]);
    expect(game.alice.discard).toEqual([]);
    expect(game.alice.inPlay).toEqual(['Tide Pools']);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual([]);
    expect(game.alice.hand).toEqual(['Tide Pools']);
  });

  it("lets its owner resolve Sea Witch's draw and discard before Tide Pools' discard at the start of the next turn", async () => {
    const game = createGame({ kingdom: ['Tide Pools', 'Sea Witch'] });
    game.alice.setHand(['Tide Pools', 'Sea Witch', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck([
      ...coppers(5),
      'Estate',
      'Estate',
      'Duchy',
      'Duchy',
      'Silver',
      'Silver',
      'Gold',
      ...coppers(10),
    ]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Tide Pools');
    await game.playAction('Sea Witch');
    await game.endTurn();
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toEqual(['Estate', 'Estate', 'Duchy', 'Duchy', 'Silver']);
    const durations = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect([...offeredEffects(durations)].sort()).toEqual(['Sea Witch', 'Tide Pools']);
    await game.chooseEffect('Sea Witch');
    expect(game.alice.hand).toEqual(['Estate', 'Estate', 'Duchy', 'Duchy', 'Silver', 'Silver', 'Gold']);
    await game.chooseCards(['Estate', 'Estate']);
    await resolveEffects(game);
    await game.chooseCards(['Duchy', 'Duchy']);

    expect(game.alice.hand).toEqual(['Silver', 'Silver', 'Gold']);
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Estate', 'Estate', 'Duchy', 'Duchy']));
  });
  it('draws only what it can when the deck and discard pile have fewer than 3 cards', async () => {
    const game = createGame({ kingdom: ['Tide Pools'] });
    game.alice.setHand(['Tide Pools']);
    game.alice.setDeck(['Copper']);
    game.alice.setDiscard(['Silver']);

    await game.start();
    await game.playAction('Tide Pools');

    expect(game.alice.hand).toEqual(['Copper', 'Silver']);
    expect(game.alice.actions).toBe(1);
  });

  it('makes its owner discard 2 of the 3-card hand on the Outpost turn when played with Outpost', async () => {
    const game = createGame({ kingdom: ['Tide Pools', 'Outpost'] });
    game.alice.setHand(['Tide Pools', 'Outpost', 'Copper']);
    game.alice.setDeck(['Copper', 'Copper', 'Copper', 'Estate', 'Estate', 'Silver', ...coppers(10)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Tide Pools');
    await game.playAction('Outpost');
    await game.endTurn();
    await game.chooseExtraTurn('Outpost');
    await resolveEffects(game, ['Tide Pools']);

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toEqual(['Estate', 'Estate', 'Silver']);
    await game.chooseCards(['Estate', 'Estate']);
    await resolveEffects(game);

    expect(game.alice.hand).toEqual(['Silver']);
    await game.endTurn();
    expect(game.alice.inPlay).toEqual([]);
  });

  it('lets a Tunnel discarded at the start of the turn be revealed to gain a Gold', async () => {
    const game = createGame({ kingdom: ['Tide Pools', 'Tunnel'] });
    game.alice.setHand(['Tide Pools', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck([...coppers(3), 'Tunnel', 'Estate', 'Copper', 'Copper', 'Copper', ...coppers(10)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Tide Pools');
    await game.endTurn();
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toEqual(expect.arrayContaining(['Tunnel', 'Estate']));
    await game.chooseCards(['Tunnel', 'Estate']);
    await game.chooseEffect('Tunnel');

    expect(game.alice.discard).toEqual(expect.arrayContaining(['Tunnel', 'Estate', 'Gold']));
  });
});
