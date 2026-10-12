import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { coppers, offeredEffects, resolveEffects } from './seasideHelpers';

describe('Lighthouse', () => {
  it('gives +1 Action and +$1 now and +$1 at the start of the next turn, staying in play until then', async () => {
    const game = createGame({ kingdom: ['Lighthouse'] });
    game.alice.setHand(['Lighthouse', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Lighthouse');
    expect(game.alice.actions).toBe(1);
    expect(game.alice.coins).toBe(1);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual(['Lighthouse']);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.coins).toBe(1);
    expect(game.alice.inPlay).toEqual(['Lighthouse']);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual([]);
    expect(game.alice.discard).toContain('Lighthouse');
  });

  it("protects only its owner from another player's Attack before the owner's next turn", async () => {
    const game = createGame({ kingdom: ['Lighthouse', 'Sea Witch'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Lighthouse', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(['Sea Witch', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(20));
    game.player('Cara').setHand(coppers(5));
    game.player('Cara').setDeck(coppers(10));

    await game.start();
    await game.playAction('Lighthouse');
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    await game.playAction('Sea Witch');

    expect(game.bob.hand).toHaveLength(6);
    expect(game.alice.discard).not.toContain('Curse');
    expect(game.player('Cara').discard).toEqual(['Curse']);
  });

  it("stops protecting once its owner's next turn has started", async () => {
    const game = createGame({ kingdom: ['Lighthouse', 'Cutpurse'] });
    game.alice.setHand(['Lighthouse', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(['Cutpurse', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(['Cutpurse', ...coppers(20)]);

    await game.start();
    await game.playAction('Lighthouse');
    await game.endTurn();

    await game.playAction('Cutpurse');
    expect(game.alice.hand).toHaveLength(5);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    await game.endTurn();

    expect(game.bob.hand).toContain('Cutpurse');
    await game.playAction('Cutpurse');
    expect(game.alice.hand).toHaveLength(4);
  });

  it('protects against a Duration Attack played while it was in effect, even after it has left play', async () => {
    const game = createGame({ kingdom: ['Lighthouse', 'Corsair'] });
    game.alice.setHand(['Lighthouse', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', ...coppers(4), ...coppers(20)]);
    game.bob.setHand(['Corsair', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(20));

    await game.start();
    await game.playAction('Lighthouse');
    await game.endTurn();

    await game.playAction('Corsair');
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    await game.playTreasure('Silver');
    expect(game.trash).toEqual([]);
    expect(game.alice.inPlay).toContain('Silver');
  });

  it('does not protect against a Duration Attack played before it', async () => {
    const game = createGame({ kingdom: ['Lighthouse', 'Corsair'] });
    game.alice.setHand(coppers(5));
    game.alice.setDeck(['Lighthouse', 'Silver', ...coppers(3), ...coppers(20)]);
    game.bob.setHand(['Corsair', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(20));

    await game.start();
    await game.endTurn();
    await game.playAction('Corsair');
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    await game.playAction('Lighthouse');
    await game.playTreasure('Silver');
    expect(game.trash).toEqual(['Silver']);
  });

  it('protects against an Attack played by Throne Room', async () => {
    const game = createGame({ kingdom: ['Lighthouse', 'Cutpurse', 'Throne Room'] });
    game.alice.setHand(['Lighthouse', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(['Throne Room', 'Cutpurse', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(20));

    await game.start();
    await game.playAction('Lighthouse');
    await game.endTurn();

    await game.playAction('Throne Room');
    await game.chooseCard('Cutpurse');

    expect(game.bob.coins).toBe(4);
    expect(game.alice.hand).toHaveLength(5);
  });

  it('gives +$2 at the start of the next turn when played twice by Throne Room', async () => {
    const game = createGame({ kingdom: ['Lighthouse', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Lighthouse', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Lighthouse');
    expect(game.alice.coins).toBe(2);
    await game.endTurn();
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.coins).toBe(2);
  });

  it('stops protecting when an Outpost turn starts, so an Attack played after the extra turn affects its owner', async () => {
    const game = createGame({ kingdom: ['Lighthouse', 'Outpost', 'Cutpurse'] });
    game.alice.setHand(['Lighthouse', 'Outpost', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(['Cutpurse', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Lighthouse');
    await game.playAction('Outpost');
    await game.endTurn();
    await game.chooseExtraTurn('Outpost');
    await resolveEffects(game, ['Lighthouse']);

    // The +$1 comes on the extra turn
    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.coins).toBe(1);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.inPlay).toEqual([]);
    expect(game.alice.hand).toHaveLength(5);
    await game.playAction('Cutpurse');
    expect(game.alice.hand).toHaveLength(4);
  });

  it("protects against Blockade's Curse, while the Blockade still sets its card aside", async () => {
    const game = createGame({ kingdom: ['Lighthouse', 'Blockade'] });
    game.alice.setHand(['Lighthouse', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', 'Silver', 'Copper', 'Copper', 'Copper', ...coppers(20)]);
    game.bob.setHand(['Blockade', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(20));

    await game.start();
    await game.playAction('Lighthouse');
    await game.endTurn();

    await game.playAction('Blockade');
    await game.chooseCard('Silver');
    expect(game.bob.setAside).toEqual(['Silver']);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    await game.playAllTreasures();
    await game.buy('Silver');
    expect(game.alice.discard).not.toContain('Curse');
    expect(game.pileSize('Curse')).toBe(10);
  });

  it('does not protect against a Blockade played before it', async () => {
    const game = createGame({ kingdom: ['Lighthouse', 'Blockade'] });
    game.alice.setHand(coppers(5));
    game.alice.setDeck(['Lighthouse', 'Silver', 'Copper', 'Copper', 'Copper', ...coppers(20)]);
    game.bob.setHand(['Blockade', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(20));

    await game.start();
    await game.endTurn();
    await game.playAction('Blockade');
    await game.chooseCard('Silver');
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    await game.playAction('Lighthouse');
    await game.playAllTreasures();
    await game.buy('Silver');
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Silver', 'Curse']));
  });

  it("protects against every play of a Sea Witch played three times by King's Court", async () => {
    const game = createGame({ kingdom: ['Lighthouse', 'Sea Witch', "King's Court"] });
    game.alice.setHand(['Lighthouse', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(["King's Court", 'Sea Witch', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(20));

    await game.start();
    await game.playAction('Lighthouse');
    await game.endTurn();

    await game.playAction("King's Court");
    await game.chooseCard('Sea Witch');

    expect(game.bob.hand).toHaveLength(9);
    expect(game.alice.discard).not.toContain('Curse');
    expect(game.pileSize('Curse')).toBe(10);
  });

  it('still lets its owner reveal a Reaction such as Moat to an Attack', async () => {
    const game = createGame({ kingdom: ['Lighthouse', 'Cutpurse', 'Moat'] });
    game.alice.setHand(['Lighthouse', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Moat', ...coppers(20)]);
    game.bob.setHand(['Cutpurse', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(20));

    await game.start();
    await game.playAction('Lighthouse');
    await game.endTurn();

    await game.playAction('Cutpurse');
    const reactions = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(offeredEffects(reactions)).toContain('Moat');
    await game.chooseEffect('Moat');
    await resolveEffects(game);

    expect(game.alice.log).toContain('Alice reveals Moat');
    expect(game.alice.hand).toHaveLength(5);
    expect(game.bob.coins).toBe(2);
  });
  it("protects against a Clerk, an Action-Reaction-Attack, played at the start of the attacker's turn", async () => {
    const game = createGame({ kingdom: ['Lighthouse', 'Clerk'] });
    game.alice.setHand(['Lighthouse', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', ...coppers(20)]);
    game.bob.setHand(['Clerk', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Lighthouse');
    await game.endTurn();

    expect(game.alice.hand).toHaveLength(5);
    expect(offeredEffects(game.expectDecision('chooseFromMultipleEvents', 'Bob'))).toEqual(['Clerk']);
    await game.chooseEffect('Clerk');

    expect(game.bob.coins).toBe(2);
    expect(game.bob.inPlay).toEqual(['Clerk']);
    expect(game.alice.hand).toHaveLength(5);
    expect(game.pending.playerName).toBe('Bob');
  });

  it('protects against a Knight such as Dame Josephine', async () => {
    const game = createGame({ kingdom: ['Lighthouse', 'Knights'] });
    game.alice.setHand(['Lighthouse', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck([...coppers(5), 'Silver', 'Gold', ...coppers(10)]);
    game.bob.setHand(['Dame Josephine', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Lighthouse');
    await game.endTurn();

    expect(game.alice.deck.slice(0, 2)).toEqual(['Silver', 'Gold']);
    await game.playAction('Dame Josephine');

    expect(game.trash).toEqual([]);
    expect(game.alice.deck.slice(0, 2)).toEqual(['Silver', 'Gold']);
    expect(game.bob.inPlay).toEqual(['Dame Josephine']);
  });

  it("does not protect against another player's card that is not an Attack, such as Masquerade", async () => {
    const game = createGame({ kingdom: ['Lighthouse', 'Masquerade'] });
    game.alice.setHand(['Lighthouse', 'Estate', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', 'Copper', 'Copper', 'Copper', 'Copper', ...coppers(10)]);
    game.bob.setHand(['Masquerade', 'Silver', 'Silver', 'Silver', 'Silver']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Lighthouse');
    await game.endTurn();

    await game.playAction('Masquerade');
    await game.chooseCard('Silver');
    expect(game.expectDecision('chooseCard', 'Alice').cardChoices.length).toBeGreaterThan(0);
    await game.chooseCard('Estate');
    await game.chooseNone();

    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Silver']);
    expect(game.bob.hand).toContain('Estate');
  });

  it('protects its owner on their own turn against an Attack another player plays then, e.g. a Berserker gained from Jester', async () => {
    const game = createGame({ kingdom: ['Lighthouse', 'Jester', 'Berserker', 'Fishing Village'] });
    game.alice.setHand(coppers(5));
    game.alice.setDeck(['Lighthouse', 'Jester', 'Copper', 'Copper', 'Copper', 'Copper', ...coppers(10)]);
    game.bob.setHand(['Fishing Village', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck([...coppers(5), 'Berserker', ...coppers(10)]);

    await game.start();
    await game.endTurn();
    // Bob's Fishing Village stays in play into Alice's turn, so a gained Berserker will be played
    await game.playAction('Fishing Village');
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.bob.inPlay).toEqual(['Fishing Village']);
    game.alice.addToHand('Copper');
    await game.playAction('Lighthouse');
    await game.playAction('Jester');
    await game.chooseOption('Bob gains a copy');

    // Bob plays the Berserker on Alice's turn; it gains him a card costing less, but doesn't make Alice discard
    expect(game.bob.inPlay).toEqual(['Fishing Village', 'Berserker']);
    await game.chooseCard('Silver');
    expect(game.bob.discard).toEqual(expect.arrayContaining(['Berserker', 'Silver']));
    expect(game.alice.hand).toEqual(coppers(4));
    expect(game.pending.playerName).toBe('Alice');
  });

  it("played on an Outpost turn, protects through the next player's turn and gives +$1 on its owner's next normal turn", async () => {
    const game = createGame({ kingdom: ['Lighthouse', 'Outpost', 'Cutpurse'] });
    game.alice.setHand(['Outpost', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Lighthouse', 'Copper', 'Copper', ...coppers(20)]);
    game.bob.setHand(['Cutpurse', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Outpost');
    await game.endTurn();
    await game.chooseExtraTurn('Outpost');
    await resolveEffects(game);

    await game.playAction('Lighthouse');
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    await game.playAction('Cutpurse');
    expect(game.alice.hand).toHaveLength(5);
    expect(game.alice.inPlay).toEqual(['Lighthouse']);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.coins).toBe(1);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual([]);
  });
});
