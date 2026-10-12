import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const copies = (name: string, count: number): string[] => Array<string>(count).fill(name);

describe('Clean-up and Durations', () => {
  it("keeps a Duration in play through every other player's turn until its owner's next turn is over", async () => {
    const game = createGame({ kingdom: ['Wharf'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Wharf', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(copies('Copper', 20));
    game.bob.setHand(copies('Copper', 5));
    game.bob.setDeck(copies('Copper', 10));
    game.player('Cara').setHand(copies('Copper', 5));
    game.player('Cara').setDeck(copies('Copper', 10));

    await game.start();
    await game.playAction('Wharf');
    await game.endTurn();
    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.inPlay).toEqual(['Wharf']);
    await game.endTurn();
    expect(game.currentPlayerName).toBe('Cara');
    expect(game.alice.inPlay).toEqual(['Wharf']);
    await game.endTurn();

    // Alice's next turn: +2 Cards, +1 Buy, and the Wharf stays until this turn's Clean-up
    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toHaveLength(7);
    expect(game.alice.buys).toBe(2);
    expect(game.alice.inPlay).toEqual(['Wharf']);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual([]);
    expect(game.alice.discard).toContain('Wharf');
  });

  it('lets the player choose the order of several start-of-turn effects', async () => {
    const game = createGame({ kingdom: ['Wharf', 'Haven', 'Village'] });
    game.alice.setHand(['Village', 'Wharf', 'Haven', 'Gold', 'Copper']);
    game.alice.setDeck(copies('Estate', 20));
    game.bob.setDeck(copies('Copper', 10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Haven');
    await game.chooseCard('Gold');
    await game.playAction('Wharf');
    await game.endTurn();
    await game.endTurn();

    const decision = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(decision.mandatoryEffects.map((effect) => effect.effectName).sort()).toEqual(['Haven', 'Wharf']);
    expect(decision.optionalEffects).toEqual([]);
    // Haven first: the Gold comes back before Wharf draws (Wharf, the only effect left, then resolves by itself)
    await game.chooseEffect('Haven');

    expect(game.alice.hand).toEqual([...copies('Estate', 5), 'Gold', 'Estate', 'Estate']);
    expect(game.alice.setAside).toEqual([]);
  });

  it("discards cards other players played on this turn in this turn's Clean-up", async () => {
    const game = createGame({ kingdom: ['Militia', 'Guard Dog'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(copies('Copper', 10));
    game.bob.setHand(['Guard Dog', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.bob.setDeck(copies('Silver', 10));
    game.player('Cara').setHand(['Guard Dog', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.player('Cara').setDeck(copies('Silver', 10));

    await game.start();
    await game.playAction('Militia');
    // Both react before the Attack resolves on either of them
    await game.chooseEffect('Guard Dog');
    expect(game.pending.playerName).toBe('Cara');
    await game.chooseEffect('Guard Dog');
    await game.chooseCards(['Estate', 'Estate', 'Estate']);
    await game.chooseCards(['Estate', 'Estate', 'Estate']);

    expect(game.bob.inPlay).toEqual(['Guard Dog']);
    expect(game.player('Cara').inPlay).toEqual(['Guard Dog']);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.bob.inPlay).toEqual([]);
    expect(game.bob.discard).toContain('Guard Dog');
    expect(game.player('Cara').inPlay).toEqual([]);
    expect(game.player('Cara').discard).toContain('Guard Dog');
    // Their hands are untouched by Alice's Clean-up
    expect(game.player('Cara').hand).toHaveLength(3);
  });
});
