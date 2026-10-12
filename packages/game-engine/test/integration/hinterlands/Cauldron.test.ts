import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const KINGDOM = ['Cauldron', 'Workshop', 'Throne Room', 'Village', 'Smithy', 'Cellar', 'Guard Dog', 'Market'];
const COPPERS = Array<string>(10).fill('Copper');

describe('Cauldron', () => {
  it('gives each other player a Curse only on the third Action gained this turn, with 3 players', async () => {
    const game = createGame({ kingdom: KINGDOM, players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Market', 'Market', 'Workshop', 'Cauldron', 'Gold']);
    game.alice.setDeck(['Gold', 'Gold', ...COPPERS]);
    const cara = game.player('Cara');
    const curses = game.pileSize('Curse');

    await game.start();
    await game.playAction('Market');
    await game.playAction('Market');
    // 1st Action gained, before Cauldron is played
    await game.playAction('Workshop');
    await game.chooseCard('Village');
    await game.playTreasure('Cauldron');
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(13);
    expect(game.alice.buys).toBe(4);

    // A non-Action gain does not count
    await game.buy('Silver');
    // 2nd Action gained
    await game.buy('Smithy');
    expect(game.pileSize('Curse')).toBe(curses);

    // 3rd Action gained
    await game.buy('Village');
    expect(game.bob.discard).toEqual(['Curse']);
    expect(cara.discard).toEqual(['Curse']);
    expect(game.pileSize('Curse')).toBe(curses - 2);

    // 4th Action gained: no more Curses
    await game.buy('Cellar');
    expect(game.bob.discard).toEqual(['Curse']);
    expect(cara.discard).toEqual(['Curse']);
    expect(game.pileSize('Curse')).toBe(curses - 2);
  });

  it('gives no Curse if three Actions were already gained before it was played', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Village', 'Throne Room', 'Workshop', 'Workshop', 'Cauldron']);
    game.alice.setDeck(['Copper', ...COPPERS]);
    const curses = game.pileSize('Curse');

    await game.start();
    await game.playAction('Village');
    await game.playAction('Throne Room');
    await game.chooseCard('Workshop');
    await game.chooseCard('Village');
    await game.chooseCard('Village');
    await game.playAction('Workshop');
    await game.chooseCard('Smithy');

    await game.playTreasure('Cauldron');
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(3);
    // 4th Action gained this turn, 1st since Cauldron was played
    await game.buy('Village');

    expect(game.bob.discard).toEqual([]);
    expect(game.pileSize('Curse')).toBe(curses);
  });

  it('is cumulative: each Cauldron in play gives out a Curse', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Cauldron', 'Cauldron', 'Gold', 'Gold', 'Gold']);
    game.alice.setDeck(COPPERS);
    const curses = game.pileSize('Curse');

    await game.start();
    await game.playTreasure('Cauldron');
    await game.playTreasure('Cauldron');
    await game.playAllTreasures();
    expect(game.alice.buys).toBe(3);
    await game.buy('Village');
    await game.buy('Village');
    await game.buy('Village');

    expect(game.bob.discard).toEqual(['Curse', 'Curse']);
    expect(game.pileSize('Curse')).toBe(curses - 2);
  });

  it('is an Attack, so other players can react with Guard Dog when it is played in the Buy phase', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Cauldron', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Guard Dog', 'Estate', 'Estate', 'Copper', 'Copper']);
    game.bob.setDeck(['Silver', 'Silver', ...COPPERS]);

    await game.start();
    await game.playTreasure('Cauldron');

    const reaction = game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect(reaction.optionalEffects.map((effect) => effect.effectName)).toEqual(['Guard Dog']);
    await game.chooseEffect('Guard Dog');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.bob.inPlay).toEqual(['Guard Dog']);
    expect(game.bob.hand).toEqual(['Estate', 'Estate', 'Copper', 'Copper', 'Silver', 'Silver']);
    expect(game.alice.coins).toBe(2);
    expect(game.alice.buys).toBe(2);
  });

  it('gives out only one Curse when the third Action is gained by the second Action gained (Border Village)', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Border Village'] });
    game.alice.setHand(['Cauldron', 'Gold', 'Gold', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    const curses = game.pileSize('Curse');

    await game.start();
    await game.playTreasure('Cauldron');
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(10);
    // 1st Action gained
    await game.buy('Smithy');
    // 2nd Action gained; its on-gain ability gains the 3rd
    await game.buy('Border Village');
    expect(game.pileSize('Curse')).toBe(curses);
    await game.chooseCard('Village');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.bob.discard).toEqual(['Curse']);
    expect(game.pileSize('Curse')).toBe(curses - 1);
  });

  it("does not count Actions you gained on another player's turn", async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Militia', 'Weaver'] });
    game.alice.setHand(['Copper', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Weaver', 'Copper', 'Market', 'Cauldron', 'Gold', 'Gold', ...COPPERS]);
    game.bob.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(COPPERS);
    const curses = game.pileSize('Curse');

    await game.start();
    await game.endTurn();

    // On Bob's turn, Alice discards Weaver to Militia and plays it to gain an Action
    await game.playAction('Militia');
    await game.chooseCards(['Weaver', 'Copper']);
    await game.chooseEffect('Weaver');
    await game.chooseOption('Gain a card costing up to $4');
    await game.chooseCard('Smithy');
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toEqual(['Market', 'Cauldron', 'Gold']);
    await game.playAction('Market');
    await game.playTreasure('Cauldron');
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(9);
    expect(game.alice.buys).toBe(3);
    await game.buy('Village');
    await game.buy('Village');
    // Only 2 Actions gained this turn
    expect(game.pileSize('Curse')).toBe(curses);
    await game.buy('Cellar');

    expect(game.bob.discard).toContain('Curse');
    expect(game.pileSize('Curse')).toBe(curses - 1);
  });

  it('still gives out a Curse for each play when Counterfeit plays it twice and trashes it', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Counterfeit'] });
    game.alice.setHand(['Counterfeit', 'Cauldron', 'Gold', 'Gold', 'Silver']);
    game.alice.setDeck(COPPERS);
    const curses = game.pileSize('Curse');

    await game.start();
    await game.playTreasure('Counterfeit');
    await game.chooseCard('Cauldron');
    expect(game.trash).toEqual(['Cauldron']);
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(13);
    expect(game.alice.buys).toBe(4);

    await game.buy('Village');
    await game.buy('Village');
    await game.buy('Village');

    expect(game.bob.discard).toEqual(['Curse', 'Curse']);
    expect(game.pileSize('Curse')).toBe(curses - 2);
  });

  it('gives no Curse to a player who revealed Moat when it was played, with 3 players', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Moat'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Workshop', 'Cauldron', 'Gold', 'Gold', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Moat', 'Copper', 'Copper', 'Copper', 'Copper']);
    const cara = game.player('Cara');
    cara.setHand(['Copper', 'Copper', 'Copper', 'Copper', 'Copper']);
    const curses = game.pileSize('Curse');

    await game.start();
    await game.playAction('Workshop');
    await game.chooseCard('Village');
    await game.playTreasure('Cauldron');
    await game.chooseEffect('Moat');
    if (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.declineEffects();
    }
    await game.playAllTreasures();
    // The 3rd Action is gained later in the turn, but Bob is still unaffected
    await game.buy('Village');
    await game.buy('Village');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.bob.discard).not.toContain('Curse');
    expect(cara.discard).toEqual(['Curse']);
    expect(game.pileSize('Curse')).toBe(curses - 1);
  });

  it('does nothing on the third Action gained when the Curse pile is empty', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Cauldron', 'Cauldron', 'Gold', 'Gold', 'Gold']);
    game.alice.setDeck(COPPERS);
    game.setPileSize('Curse', 0);

    await game.start();
    await game.playTreasure('Cauldron');
    await game.playTreasure('Cauldron');
    await game.playAllTreasures();
    await game.buy('Village');
    await game.buy('Village');
    await game.buy('Village');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.bob.discard).toEqual([]);
    expect(game.gameResult).toBeUndefined();
  });

  it('does not count Actions gained on the turn before an Outpost turn', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Outpost'] });
    game.alice.setHand(['Outpost', 'Cauldron', 'Gold', 'Gold', 'Copper']);
    game.alice.setDeck(['Cauldron', 'Gold', 'Gold', ...COPPERS]);
    game.bob.setDeck(COPPERS);
    const curses = game.pileSize('Curse');

    await game.start();
    await game.playAction('Outpost');
    await game.playTreasure('Cauldron');
    await game.playAllTreasures();
    await game.buy('Village');
    await game.buy('Village');
    await game.chooseExtraTurn('Outpost');

    // The extra turn is a new turn: its first Action gained is not the third
    expect(game.currentPlayerName).toBe('Alice');
    await game.playTreasure('Cauldron');
    await game.playAllTreasures();
    await game.buy('Village');
    await game.buy('Smithy');

    expect(game.pileSize('Curse')).toBe(curses);
    expect(game.bob.discard).toEqual([]);
  });

  it('ends the game after the turn when its Curse empties a third Supply pile', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Workshop', 'Cauldron', 'Gold', 'Gold', 'Gold']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(COPPERS);
    game.setPileSize('Smithy', 0);
    game.setPileSize('Market', 0);
    game.setPileSize('Curse', 1);

    await game.start();
    await game.playAction('Workshop');
    await game.chooseCard('Village');
    await game.playTreasure('Cauldron');
    await game.playAllTreasures();
    await game.buy('Village');
    expect(game.isFinished).toBe(false);
    await game.buy('Village');

    expect(game.pileSize('Curse')).toBe(0);
    expect(game.isFinished).toBe(true);
    const totalOf = (name: string) =>
      game.gameResult?.playerResults.find((result) => result.playerName === name)?.scoreReport.total;
    expect(totalOf('Alice')).toBe(0);
    expect(totalOf('Bob')).toBe(-1);
  });

  it('counts Actions that have other types too (Mill, Nobles), but not a gained Cauldron', async () => {
    const game = createGame({ kingdom: ['Cauldron', 'Workshop', 'Mill', 'Nobles', 'Festival', 'Village'] });
    game.alice.setHand(['Festival', 'Workshop', 'Workshop', 'Cauldron', 'Gold', 'Gold', 'Gold', 'Gold']);
    game.alice.setDeck(COPPERS);
    const curses = game.pileSize('Curse');

    await game.start();
    await game.playAction('Festival');
    // 1st Action gained: Mill, an Action–Victory card
    await game.playAction('Workshop');
    await game.chooseCard('Mill');
    await game.playAction('Workshop');
    await game.chooseCard('Silver');
    await game.playTreasure('Cauldron');
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(16);
    expect(game.alice.buys).toBe(3);

    // Cauldron is a Treasure–Attack, not an Action
    await game.buy('Cauldron');
    // 2nd Action gained: Nobles, an Action–Victory card
    await game.buy('Nobles');
    expect(game.pileSize('Curse')).toBe(curses);

    // 3rd Action gained
    await game.buy('Village');
    expect(game.bob.discard).toEqual(['Curse']);
    expect(game.pileSize('Curse')).toBe(curses - 1);
  });

  it('still gives out Curses when Trader exchanges the third Action gained for a Silver', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Trader'] });
    game.alice.setHand(['Workshop', 'Cauldron', 'Trader', 'Gold', 'Gold', 'Gold']);
    game.alice.setDeck(COPPERS);
    const curses = game.pileSize('Curse');
    const villages = game.pileSize('Village');

    await game.start();
    await game.playAction('Workshop');
    await game.chooseCard('Village');
    await game.declineEffects();
    await game.playTreasure('Cauldron');
    await game.playAllTreasures();
    await game.buy('Smithy');
    await game.declineEffects();
    await game.buy('Village');

    // The 3rd Action: Trader exchanges it first, but it was still gained
    const order = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(order.optionalEffects.map((effect) => effect.effectName)).toEqual(['Trader']);
    expect(order.mandatoryEffects.map((effect) => effect.effectName)).toEqual(['Cauldron']);
    await game.chooseEffect('Trader');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.pileSize('Village')).toBe(villages - 1);
    expect(game.bob.discard).toEqual(['Curse']);
    expect(game.pileSize('Curse')).toBe(curses - 1);
  });

  it('gives the last Curse to the next player in turn order, with 3 players', async () => {
    const game = createGame({ kingdom: KINGDOM, players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Workshop', 'Cauldron', 'Gold', 'Gold', 'Gold']);
    game.alice.setDeck(COPPERS);
    const cara = game.player('Cara');
    game.setPileSize('Curse', 1);

    await game.start();
    await game.playAction('Workshop');
    await game.chooseCard('Village');
    await game.playTreasure('Cauldron');
    await game.playAllTreasures();
    await game.buy('Smithy');
    await game.buy('Village');

    expect(game.pileSize('Curse')).toBe(0);
    expect(game.bob.discard).toEqual(['Curse']);
    expect(cara.discard).toEqual([]);
  });
});
