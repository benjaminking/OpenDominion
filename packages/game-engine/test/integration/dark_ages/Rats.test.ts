import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const COPPERS = Array<string>(10).fill('Copper');

describe('Rats', () => {
  it("draws a card for its owner when trashed by another player's Rogue", async () => {
    const game = createGame({ kingdom: ['Rats', 'Rogue'] });
    game.alice.setHand(['Rogue', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Copper', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(['Rats', 'Estate', 'Gold', ...COPPERS]);

    await game.start();
    await game.playAction('Rogue');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual(['Rats']);
    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Copper', 'Gold']);
    expect(game.bob.discard).toEqual(['Estate']);
    expect(game.alice.hand).toHaveLength(4);
  });

  it("shuffles its owner's discard pile, without the other revealed card, to draw when trashed by a Knight", async () => {
    const game = createGame({ kingdom: ['Rats', 'Knights'] });
    game.alice.setHand(['Sir Martin', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Copper', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(['Rats', 'Estate']);
    game.bob.setDiscard(['Gold']);

    await game.start();
    await game.playAction('Sir Martin');

    expect(game.trash).toEqual(['Rats']);
    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Copper', 'Gold']);
    expect(game.bob.discard).toEqual(['Estate']);
    expect(game.bob.deck).toEqual([]);
  });

  it('gains a Rats and trashes a card for each play when played by Throne Room', async () => {
    const game = createGame({ kingdom: ['Rats', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Rats', 'Estate', 'Estate', 'Copper']);
    game.alice.setDeck(['Rats', 'Copper', ...COPPERS]);
    const rats = game.pileSize('Rats');

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Rats');
    await game.chooseCard('Estate');
    // The Rats drawn by the first play can't be trashed
    const secondTrash = game.expectDecision('chooseCard', 'Alice');
    expect(secondTrash.cardChoices.map((choice) => choice.card.name)).not.toContain('Rats');
    await game.chooseCard('Estate');

    expect(game.pileSize('Rats')).toBe(rats - 2);
    expect(game.alice.discard).toEqual(['Rats', 'Rats']);
    expect(game.trash).toEqual(['Estate', 'Estate']);
    expect(game.alice.hand).toEqual(['Copper', 'Rats', 'Copper']);
    expect(game.alice.actions).toBe(2);
  });

  it('draws a card for the player who trashes it from the Supply with Lurker', async () => {
    const game = createGame({ kingdom: ['Rats', 'Lurker'] });
    game.alice.setHand(['Lurker', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Gold', ...COPPERS]);

    await game.start();
    await game.playAction('Lurker');
    await game.chooseOption('Trash an Action card from the Supply');
    await game.chooseCard('Rats');

    expect(game.trash).toEqual(['Rats']);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Gold']);
  });

  it('reveals a hand of only Rats and trashes nothing, even after drawing and gaining Rats', async () => {
    const game = createGame({ kingdom: ['Rats'] });
    game.alice.setHand(['Rats', 'Rats']);
    game.alice.setDeck(['Rats', ...COPPERS]);
    const rats = game.pileSize('Rats');

    await game.start();
    await game.playAction('Rats');

    game.expectDecision('actionPhase', 'Alice');
    expect(game.alice.hand).toEqual(['Rats', 'Rats']);
    expect(game.alice.discard).toEqual(['Rats']);
    expect(game.pileSize('Rats')).toBe(rats - 1);
    expect(game.trash).toEqual([]);
    expect(game.alice.log).toContain('Alice reveals Rats, Rats');
  });

  it('draws a card for each Rats when Chapel trashes two of them along with other cards', async () => {
    const game = createGame({ kingdom: ['Rats', 'Chapel'] });
    game.alice.setHand(['Chapel', 'Rats', 'Rats', 'Estate', 'Copper']);
    game.alice.setDeck(['Silver', 'Gold', ...COPPERS]);

    await game.start();
    await game.playAction('Chapel');
    await game.chooseCards(['Rats', 'Rats', 'Estate', 'Copper']);

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual(['Rats', 'Rats', 'Estate', 'Copper']);
    expect(game.alice.hand).toEqual(['Silver', 'Gold']);
  });

  it('draws a card when Watchtower trashes the Rats it gains, before the trash from hand', async () => {
    const game = createGame({ kingdom: ['Rats', 'Watchtower'] });
    game.alice.setHand(['Rats', 'Watchtower', 'Estate', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', 'Gold', ...COPPERS]);
    const rats = game.pileSize('Rats');

    await game.start();
    await game.playAction('Rats');
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Trash it');

    const trash = game.expectDecision('chooseCard', 'Alice');
    expect(game.alice.hand).toEqual(['Watchtower', 'Estate', 'Copper', 'Copper', 'Silver', 'Gold']);
    expect(trash.cardChoices.map((choice) => choice.card.name)).not.toContain('Rats');
    await game.chooseCard('Estate');

    expect(game.trash).toEqual(['Rats', 'Estate']);
    expect(game.pileSize('Rats')).toBe(rats - 1);
    expect(game.alice.discard).toEqual([]);
  });

  it('can trash a Fortress, which goes back to hand', async () => {
    const game = createGame({ kingdom: ['Rats', 'Fortress'] });
    game.alice.setHand(['Rats', 'Fortress', 'Copper']);
    game.alice.setDeck(['Rats', ...COPPERS]);

    await game.start();
    await game.playAction('Rats');
    await game.chooseCard('Fortress');

    game.expectDecision('actionPhase', 'Alice');
    expect(game.trash).toEqual([]);
    expect(game.alice.hand).toEqual(['Copper', 'Rats', 'Fortress']);
    expect(game.alice.actions).toBe(1);
  });

  it('gains nothing from an empty Rats pile but still trashes a card', async () => {
    const game = createGame({ kingdom: ['Rats'] });
    game.alice.setHand(['Rats', 'Estate', 'Copper']);
    game.alice.setDeck(['Copper', ...COPPERS]);
    game.setPileSize('Rats', 0);

    await game.start();
    await game.playAction('Rats');
    await game.chooseCard('Estate');

    expect(game.trash).toEqual(['Estate']);
    expect(game.alice.discard).toEqual([]);
    expect(game.alice.hand).toEqual(['Copper', 'Copper']);
  });

  it('has a pile of 20 Rats, whatever the number of players', () => {
    expect(createGame({ kingdom: ['Rats'] }).pileSize('Rats')).toBe(20);
    expect(createGame({ kingdom: ['Rats'], players: ['Alice', 'Bob', 'Cara', 'Dan'] }).pileSize('Rats')).toBe(20);
  });

  it('gains a Rats and trashes nothing when played alone with nothing to draw', async () => {
    const game = createGame({ kingdom: ['Rats'] });
    game.alice.setHand(['Rats']);

    await game.start();
    await game.playAction('Rats');

    game.expectDecision(['actionPhase', 'treasurePhase', 'buyPhase'], 'Alice');
    expect(game.alice.hand).toEqual([]);
    expect(game.alice.discard).toEqual(['Rats']);
    expect(game.alice.inPlay).toEqual(['Rats']);
    expect(game.trash).toEqual([]);
    expect(game.alice.actions).toBe(1);
  });

  it('can gain the last Rats, emptying a third pile; the game ends only after the turn', async () => {
    const game = createGame({ kingdom: ['Rats', 'Village', 'Smithy'] });
    game.setPileSize('Village', 0);
    game.setPileSize('Smithy', 0);
    game.setPileSize('Rats', 1);
    game.alice.setHand(['Rats', 'Estate', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Rats');
    await game.chooseCard('Estate');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.pileSize('Rats')).toBe(0);
    expect(game.isFinished).toBe(false);
    await game.playAllTreasures();
    await game.buy('Silver');

    expect(game.isFinished).toBe(true);
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Rats', 'Silver']));
  });
});
