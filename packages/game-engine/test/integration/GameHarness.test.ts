import { describe, expect, it } from 'vitest';

import { createGame } from './gameHarness';

describe('GameHarness', () => {
  it('runs a turn with real piles and moves on to the next player after clean-up', async () => {
    const game = createGame({ kingdom: ['Village', 'Smithy'] });
    game.alice.setHand(['Village', 'Smithy', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', 'Copper', 'Estate', 'Gold', 'Copper', 'Copper', 'Estate', 'Estate', 'Copper']);
    game.bob.setDeck(['Copper', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setHand(['Estate', 'Estate', 'Estate', 'Copper', 'Copper']);

    await game.start();
    expect(game.currentPlayerName).toBe('Alice');
    await game.playAction('Village');
    expect(game.alice.actions).toBe(2);
    await game.playAction('Smithy');
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Silver', 'Copper', 'Estate', 'Gold']);

    await game.playAllTreasures();
    expect(game.alice.coins).toBe(9);
    const silversBefore = game.pileSize('Silver');
    await game.buy('Silver');
    expect(game.pileSize('Silver')).toBe(silversBefore - 1);

    // Clean-up: everything is discarded and 5 new cards are drawn; Bob's turn starts
    expect(game.pending.playerName).toBe('Bob');
    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.inPlay).toEqual([]);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Estate', 'Estate', 'Copper']);
    expect(game.alice.discard).toContain('Silver');
  });

  it('gives the first player 1 Action and 1 Buy on the first turn of a real game', async () => {
    const game = createGame({ kingdom: ['Village'], resetStatisticsBeforeStart: false });
    game.alice.setHand(['Village', 'Copper', 'Copper', 'Copper', 'Copper']);

    await game.start();

    // Alice should be in her action phase with Village playable, not skipped to Bob's turn
    expect(game.pending.playerName).toBe('Alice');
    expect(game.pending.kind).toBe('actionPhase');
    expect(game.alice.actions).toBe(1);
    expect(game.alice.buys).toBe(1);
  });

  it('lets a player reveal Moat when another player plays Militia, blocking the attack', async () => {
    const game = createGame({ kingdom: ['Militia', 'Moat'] });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setHand(['Moat', 'Estate', 'Estate', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Militia');

    // The ATTACK trigger offers Bob his Moat
    const reaction = game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect(reaction.optionalEffects.map((effect) => effect.effectName)).toEqual(['Moat']);
    await game.chooseEffect('Moat');
    // Moat's effect reveals it; Bob is then asked again with nothing left, or play moves on
    if (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.declineEffects();
    }

    expect(game.bob.hand).toHaveLength(5);
    expect(game.alice.coins).toBe(2);
    expect(game.pending.playerName).toBe('Alice');
  });

  it('can set the exact contents of a pile, top card first', async () => {
    const game = createGame({ kingdom: ['Cultist'] });
    game.setPile('Ruins', ['Ruined Village', 'Survivors']);
    game.alice.setHand(['Cultist', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Copper', 'Copper', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setHand(['Copper', 'Copper', 'Copper', 'Copper', 'Copper']);

    expect(game.pileCards('Ruins')).toEqual(['Ruined Village', 'Survivors']);
    await game.start();
    await game.playAction('Cultist');

    expect(game.bob.discard).toEqual(['Ruined Village']);
    expect(game.pileCards('Ruins')).toEqual(['Survivors']);
  });

  it('makes a player without Moat discard down to 3 when Militia is played', async () => {
    const game = createGame({ kingdom: ['Militia', 'Moat'] });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setHand(['Estate', 'Estate', 'Copper', 'Copper', 'Silver']);

    await game.start();
    await game.playAction('Militia');
    game.expectDecision('chooseCards', 'Bob');
    await game.chooseCards(['Estate', 'Estate']);

    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Silver']);
    expect(game.bob.discard).toEqual(['Estate', 'Estate']);
  });

  it('resolves a Duration card at the start of the next turn and keeps it in play until then', async () => {
    const game = createGame({ kingdom: ['Wharf'] });
    game.alice.setHand(['Wharf', 'Copper', 'Copper', 'Copper', 'Copper']);
    // Enough cards that Alice never reshuffles during the test
    game.alice.setDeck([...Array<string>(20).fill('Copper')]);
    game.bob.setHand(['Copper', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(['Copper', 'Copper', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Wharf');
    expect(game.alice.hand).toHaveLength(6);
    expect(game.alice.buys).toBe(2);
    await game.endTurn();

    // Wharf stays in play through Alice's clean-up and Bob's turn
    expect(game.alice.inPlay).toEqual(['Wharf']);
    expect(game.currentPlayerName).toBe('Bob');
    await game.endTurn();

    // At the start of Alice's next turn: +2 Cards, +1 Buy
    while (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.chooseEffect('Wharf');
    }
    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toHaveLength(7);
    expect(game.alice.buys).toBe(2);
    expect(game.alice.inPlay).toEqual(['Wharf']);

    // It is discarded in the clean-up of the turn it finished on
    await game.endTurn();
    expect(game.alice.inPlay).toEqual([]);
    expect(game.alice.discard).toContain('Wharf');
  });
});
