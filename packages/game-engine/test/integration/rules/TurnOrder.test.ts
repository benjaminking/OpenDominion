import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const copies = (name: string, count: number): string[] => Array<string>(count).fill(name);

describe('Turn order with 3 or 4 players', () => {
  it('offers reactions to an Attack clockwise from the attacker, then resolves it on each player in that order', async () => {
    const game = createGame({ kingdom: ['Militia', 'Moat'], players: ['Alice', 'Bob', 'Cara', 'Dan'] });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(copies('Copper', 10));
    for (const name of ['Bob', 'Cara', 'Dan']) {
      game.player(name).setHand(['Moat', 'Estate', 'Estate', 'Copper', 'Copper']);
    }

    await game.start();
    await game.playAction('Militia');

    const reactionOrder: string[] = [];
    while (game.pending.kind === 'chooseFromMultipleEvents') {
      reactionOrder.push(game.pending.playerName);
      await game.declineEffects();
    }
    expect(reactionOrder).toEqual(['Bob', 'Cara', 'Dan']);

    const attackOrder: string[] = [];
    while (game.pending.kind === 'chooseCards') {
      attackOrder.push(game.pending.playerName);
      await game.chooseCards(['Estate', 'Estate']);
    }
    expect(attackOrder).toEqual(['Bob', 'Cara', 'Dan']);
    expect(game.pending.playerName).toBe('Alice');
  });

  it("starts with the attacker's left-hand neighbour and wraps around on a later player's turn", async () => {
    const game = createGame({ kingdom: ['Militia'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Estate', 'Estate', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', 'Estate', 'Copper', 'Copper', 'Copper', ...copies('Copper', 5)]);
    game.bob.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(copies('Copper', 10));
    game.player('Cara').setHand(['Estate', 'Estate', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await game.endTurn();
    expect(game.currentPlayerName).toBe('Bob');
    await game.playAction('Militia');

    expect(game.expectDecision('chooseCards').playerName).toBe('Cara');
    await game.chooseCards(['Estate', 'Estate']);
    expect(game.expectDecision('chooseCards').playerName).toBe('Alice');
    await game.chooseCards(['Estate', 'Estate']);
    expect(game.pending.playerName).toBe('Bob');
  });

  it("gives the last Curse to the attacker's left-hand neighbour, not to the first player", async () => {
    const game = createGame({ kingdom: ['Familiar'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(copies('Copper', 5));
    game.alice.setDeck(copies('Copper', 10));
    game.bob.setHand(['Familiar', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(copies('Copper', 10));
    game.setPileSize('Curse', 1);

    await game.start();
    await game.endTurn();
    await game.playAction('Familiar');

    expect(game.player('Cara').discard).toEqual(['Curse']);
    expect(game.alice.discard).not.toContain('Curse');
  });

  it("asks about each player's top card for Scrying Pool clockwise from its owner, wrapping around", async () => {
    const game = createGame({ kingdom: ['Scrying Pool'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(copies('Copper', 5));
    game.alice.setDeck(['Gold', ...copies('Copper', 10)]);
    game.bob.setHand(['Scrying Pool', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(['Estate', 'Silver', ...copies('Copper', 5)]);
    game.player('Cara').setDeck(['Curse', 'Copper']);

    await game.start();
    await game.endTurn();
    await game.playAction('Scrying Pool');

    const prompts: string[] = [];
    while (game.pending.kind === 'chooseOneOption') {
      expect(game.pending.playerName).toBe('Bob');
      prompts.push(game.pending.prompt);
      await game.chooseOption('Put it back');
    }
    expect(prompts).toHaveLength(3);
    expect(prompts[0]).toContain("Bob's Estate");
    expect(prompts[1]).toContain("Cara's Curse");
    expect(prompts[2]).toContain("Alice's");
  });
});
