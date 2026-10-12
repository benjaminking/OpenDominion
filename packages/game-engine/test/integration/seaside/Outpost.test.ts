import { CardLocation, GameOutcome } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { coppers, offeredEffects, outcomeOf, resolveEffects, turnsOf } from './seasideHelpers';

describe('Outpost', () => {
  it('gives an extra turn with only 3 cards drawn for it', async () => {
    const game = createGame({ kingdom: ['Outpost'] });
    game.alice.setHand(['Outpost', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Outpost');
    await game.endTurn();
    await game.chooseExtraTurn('Outpost');

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toHaveLength(3);
  });

  it('stays in play until the clean-up of the extra turn, after which the next player takes a turn', async () => {
    const game = createGame({ kingdom: ['Outpost'] });
    game.alice.setHand(['Outpost', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Outpost');
    await game.endTurn();
    await game.chooseExtraTurn('Outpost');

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.inPlay).toEqual(['Outpost']);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.pending.playerName).toBe('Bob');
    expect(game.alice.inPlay).toEqual([]);
    expect(game.alice.discard).toContain('Outpost');
  });

  it('gives only one extra turn when two Outposts are played', async () => {
    const game = createGame({ kingdom: ['Outpost', 'Village'] });
    game.alice.setHand(['Village', 'Outpost', 'Outpost', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Outpost');
    await game.playAction('Outpost');
    await game.endTurn();
    await game.chooseExtraTurn('Outpost');

    expect(game.currentPlayerName).toBe('Alice');
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.pending.playerName).toBe('Bob');
  });

  it('gives no third turn in a row when played during the Outpost turn', async () => {
    const game = createGame({ kingdom: ['Outpost'] });
    game.alice.setHand(['Outpost', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Outpost', ...coppers(20)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Outpost');
    await game.endTurn();
    await game.chooseExtraTurn('Outpost');

    expect(game.currentPlayerName).toBe('Alice');
    await game.playAction('Outpost');
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.pending.playerName).toBe('Bob');
  });

  it("discards an Outpost that failed on the Outpost turn in the next player's clean-up", async () => {
    const game = createGame({ kingdom: ['Outpost'] });
    game.alice.setHand(['Outpost', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Outpost', ...coppers(20)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Outpost');
    await game.endTurn();
    await game.chooseExtraTurn('Outpost');
    await game.playAction('Outpost');
    await game.endTurn();

    // It only fails between the extra turn and Bob's turn, so it survives the extra turn's clean-up
    expect(game.alice.inPlay).toEqual(['Outpost']);
    expect(game.alice.discard.filter((name) => name === 'Outpost')).toHaveLength(1);
    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.inPlay).toEqual(['Outpost']);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual([]);
    expect(game.alice.discard.filter((name) => name === 'Outpost')).toHaveLength(2);
  });

  it('makes a Merchant Ship played on the same turn give its +$2 on the extra turn', async () => {
    const game = createGame({ kingdom: ['Outpost', 'Merchant Ship', 'Village'] });
    game.alice.setHand(['Village', 'Outpost', 'Merchant Ship', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Outpost');
    await game.playAction('Merchant Ship');
    await game.endTurn();
    await game.chooseExtraTurn('Outpost');

    expect(game.currentPlayerName).toBe('Alice');
    await game.chooseEffect('Merchant Ship');
    expect(game.alice.coins).toBe(2);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.inPlay).toEqual([]);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.coins).toBe(0);
  });

  it('gives only one extra turn when played twice by Throne Room', async () => {
    const game = createGame({ kingdom: ['Outpost', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Outpost', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Outpost');
    await game.endTurn();
    await game.chooseExtraTurn('Outpost');

    expect(game.currentPlayerName).toBe('Alice');
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.pending.playerName).toBe('Bob');
  });

  it('still draws only 3 cards for the next hand when played during the Outpost turn', async () => {
    const game = createGame({ kingdom: ['Outpost'] });
    game.alice.setHand(['Outpost', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Outpost', ...coppers(20)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Outpost');
    await game.endTurn();
    await game.chooseExtraTurn('Outpost');

    expect(game.currentPlayerName).toBe('Alice');
    await game.playAction('Outpost');
    await game.endTurn();

    expect(game.alice.hand).toHaveLength(3);
  });

  it("keeps a second Outpost played the same turn in play until the extra turn's clean-up", async () => {
    const game = createGame({ kingdom: ['Outpost', 'Village'] });
    game.alice.setHand(['Village', 'Outpost', 'Outpost', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Outpost');
    await game.playAction('Outpost');
    await game.endTurn();
    await game.chooseExtraTurn('Outpost');

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.inPlay).toEqual(['Outpost', 'Outpost']);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual([]);
    expect(game.alice.discard.filter((name) => name === 'Outpost')).toHaveLength(2);
  });

  it("resolves Wharf, Caravan and Fishing Village played the same turn at the start of the extra turn, in the player's chosen order", async () => {
    const game = createGame({ kingdom: ['Outpost', 'Wharf', 'Caravan', 'Fishing Village'] });
    game.alice.setHand(['Fishing Village', 'Caravan', 'Wharf', 'Outpost', 'Copper']);
    game.alice.setDeck(coppers(30));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Fishing Village');
    await game.playAction('Caravan');
    await game.playAction('Wharf');
    await game.playAction('Outpost');
    await game.endTurn();
    await game.chooseExtraTurn('Outpost');

    expect(game.currentPlayerName).toBe('Alice');
    const durations = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect([...offeredEffects(durations)].sort()).toEqual(['Caravan', 'Fishing Village', 'Outpost', 'Wharf']);
    expect(durations.optionalEffects).toEqual([]);
    await resolveEffects(game, ['Wharf', 'Fishing Village', 'Caravan']);

    // 3 cards for the Outpost hand, +2 from Wharf and +1 from Caravan
    expect(game.alice.hand).toHaveLength(6);
    expect(game.alice.actions).toBe(2);
    expect(game.alice.buys).toBe(2);
    expect(game.alice.coins).toBe(1);
    await game.endTurn();

    // Everything is done, so it was all discarded in the extra turn's clean-up, and Bob's turn changes nothing
    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.inPlay).toEqual([]);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.pending.kind).toBe('treasurePhase');
    expect(game.alice.hand).toHaveLength(5);
    expect(game.alice.coins).toBe(0);
    expect(game.alice.buys).toBe(1);
  });

  it('returns the card Haven set aside at the start of the extra turn', async () => {
    const game = createGame({ kingdom: ['Outpost', 'Haven'] });
    game.alice.setHand(['Haven', 'Outpost', 'Gold', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(30));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Haven');
    await game.chooseCard('Gold');
    await game.playAction('Outpost');
    await game.endTurn();
    await game.chooseExtraTurn('Outpost');
    await resolveEffects(game);

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Gold']);
    expect(game.alice.setAside).toEqual([]);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.inPlay).toEqual([]);
  });

  it("gives Tactician's +5 Cards, +1 Action and +1 Buy on the extra turn, on top of the 3-card hand", async () => {
    const game = createGame({ kingdom: ['Outpost', 'Tactician', 'Village'] });
    game.alice.setHand(['Village', 'Outpost', 'Tactician', 'Copper', 'Estate']);
    game.alice.setDeck(coppers(30));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Outpost');
    await game.playAction('Tactician');
    expect(game.alice.hand).toEqual([]);
    await game.endTurn();
    await game.chooseExtraTurn('Outpost');
    await resolveEffects(game);

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toHaveLength(8);
    expect(game.alice.actions).toBe(2);
    expect(game.alice.buys).toBe(2);
  });

  it('keeps a Throne Room that played it in play through the extra turn, alongside a Wharf played the same turn', async () => {
    const game = createGame({ kingdom: ['Outpost', 'Throne Room', 'Wharf', 'Village'] });
    game.alice.setHand(['Village', 'Throne Room', 'Outpost', 'Wharf', 'Copper']);
    game.alice.setDeck(coppers(30));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Throne Room');
    await game.chooseCard('Outpost');
    await game.playAction('Wharf');
    await game.endTurn();

    expect(game.alice.inPlay).toEqual(['Throne Room', 'Outpost', 'Wharf']);
    await game.chooseExtraTurn('Outpost');
    await resolveEffects(game);

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toHaveLength(5);
    expect(game.alice.buys).toBe(2);
    expect(game.alice.inPlay).toEqual(['Throne Room', 'Outpost', 'Wharf']);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.inPlay).toEqual([]);
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Throne Room', 'Outpost', 'Wharf']));
  });

  it('gives no extra turn when the game ends at the end of the turn it was played', async () => {
    const game = createGame({ kingdom: ['Outpost'] });
    game.alice.setHand(['Outpost', 'Gold', 'Gold', 'Gold', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));
    game.setPileSize('Province', 1);

    await game.start();
    await game.playAction('Outpost');
    await game.playAllTreasures();
    await game.buy('Province');

    expect(game.isFinished).toBe(true);
    expect(turnsOf(game, 'Alice')).toBe(1);
    expect(outcomeOf(game, 'Alice')).toBe(GameOutcome.WIN);
  });

  it('ends the game at the end of the extra turn when that turn empties the Province pile', async () => {
    const game = createGame({ kingdom: ['Outpost'] });
    game.alice.setHand(['Outpost', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Gold', 'Gold', 'Gold', ...coppers(10)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));
    game.setPileSize('Province', 1);

    await game.start();
    await game.playAction('Outpost');
    await game.endTurn();
    await game.chooseExtraTurn('Outpost');
    await resolveEffects(game);

    expect(game.alice.hand).toEqual(['Gold', 'Gold', 'Gold']);
    await game.playAllTreasures();
    await game.buy('Province');

    expect(game.isFinished).toBe(true);
    expect(game.alice.score).toBe(6);
    expect(outcomeOf(game, 'Alice')).toBe(GameOutcome.WIN);
  });

  it("doesn't count the extra turn for the tie-breaker", async () => {
    const game = createGame({ kingdom: ['Outpost'] });
    game.alice.setHand(coppers(5));
    game.alice.setDeck(['Province', ...coppers(10)]);
    game.bob.setHand(['Outpost', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(['Gold', 'Gold', 'Gold', ...coppers(10)]);
    game.setPileSize('Province', 1);

    await game.start();
    await game.endTurn();
    await game.playAction('Outpost');
    await game.endTurn();
    await game.chooseExtraTurn('Outpost');
    await resolveEffects(game);
    await game.playAllTreasures();
    await game.buy('Province');

    // Both have 6 VP and one (official) turn each
    expect(game.isFinished).toBe(true);
    expect(game.alice.score).toBe(6);
    expect(game.bob.score).toBe(6);
    expect(turnsOf(game, 'Bob')).toBe(1);
    expect(outcomeOf(game, 'Alice')).toBe(GameOutcome.TIE);
    expect(outcomeOf(game, 'Bob')).toBe(GameOutcome.TIE);
  });

  it('keeps only the inner Throne Room in play when Throne Room plays a Throne Room on Outpost and Wharf', async () => {
    const game = createGame({ kingdom: ['Outpost', 'Throne Room', 'Wharf'] });
    const [, innerThroneRoom, outpost, wharf] = game.alice.setHand([
      'Throne Room',
      'Throne Room',
      'Outpost',
      'Wharf',
      'Copper',
    ]);
    game.alice.setDeck(coppers(30));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Throne Room');
    await game.chooseCard('Outpost');
    await game.chooseCard('Wharf');
    await game.endTurn();

    const inPlayIds = (): string[] => game.alice.cards(CardLocation.IN_PLAY).map((card) => card.getId());
    expect(inPlayIds()).toEqual([innerThroneRoom.getId(), outpost.getId(), wharf.getId()]);
    await game.chooseExtraTurn('Outpost');
    await resolveEffects(game);

    // Only one extra turn; 3 cards plus 2 Wharf draws of 2
    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toHaveLength(7);
    expect(game.alice.buys).toBe(3);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.inPlay).toEqual([]);
  });
  it('in a 3-player game, takes the extra turn before the player to the left, then play goes on in order', async () => {
    const game = createGame({ kingdom: ['Outpost'], players: ['Alice', 'Bob', 'Cara'] });
    const cara = game.player('Cara');
    game.alice.setHand(['Outpost', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));
    cara.setHand(coppers(5));
    cara.setDeck(coppers(10));

    await game.start();
    await game.playAction('Outpost');
    await game.endTurn();
    await game.chooseExtraTurn('Outpost');

    expect(game.currentPlayerName).toBe('Alice');
    await game.endTurn();
    expect(game.currentPlayerName).toBe('Bob');
    await game.endTurn();
    expect(game.currentPlayerName).toBe('Cara');
    await game.endTurn();
    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toHaveLength(5);
  });
});
