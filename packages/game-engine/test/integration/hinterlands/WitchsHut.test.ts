import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const KINGDOM = ["Witch's Hut", 'Village', 'Smithy'];
const COPPERS = Array<string>(10).fill('Copper');
const PLAYERS = ['Alice', 'Bob', 'Cara'];

describe('WitchsHut', () => {
  it('gives each other player a Curse when both discarded cards are Actions, with 3 players', async () => {
    const game = createGame({ kingdom: KINGDOM, players: PLAYERS });
    game.alice.setHand(["Witch's Hut", 'Village', 'Smithy', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Copper', 'Silver', 'Estate', ...COPPERS]);
    const cara = game.player('Cara');
    const curses = game.pileSize('Curse');

    await game.start();
    await game.playAction("Witch's Hut");

    const discard = game.expectDecision('chooseCards', 'Alice');
    expect(discard.numSelectedEligibility).toEqual([2]);
    expect(game.alice.hand).toHaveLength(8);
    await game.chooseCards(['Village', 'Smithy']);

    expect(game.alice.log).toContain('Alice reveals Village, Smithy');
    expect(game.alice.discard).toEqual(['Village', 'Smithy']);
    expect(game.bob.discard).toEqual(['Curse']);
    expect(cara.discard).toEqual(['Curse']);
    expect(game.pileSize('Curse')).toBe(curses - 2);
  });

  it('reveals the discarded cards but gives no Curse when they are not both Actions', async () => {
    const game = createGame({ kingdom: KINGDOM, players: PLAYERS });
    game.alice.setHand(["Witch's Hut", 'Village', 'Smithy', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Copper', 'Silver', 'Estate', ...COPPERS]);
    const curses = game.pileSize('Curse');

    await game.start();
    await game.playAction("Witch's Hut");
    await game.chooseCards(['Village', 'Estate']);

    expect(game.alice.log).toContain('Alice reveals Village, Estate');
    expect(game.bob.discard).toEqual([]);
    expect(game.pileSize('Curse')).toBe(curses);
  });

  it('gives out only the Curses that are left, in turn order', async () => {
    const game = createGame({ kingdom: KINGDOM, players: PLAYERS });
    game.alice.setHand(["Witch's Hut", 'Village', 'Smithy', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.setPileSize('Curse', 1);
    const cara = game.player('Cara');

    await game.start();
    await game.playAction("Witch's Hut");
    await game.chooseCards(['Village', 'Smithy']);

    expect(game.bob.discard).toEqual(['Curse']);
    expect(cara.discard).toEqual([]);
    expect(game.pileSize('Curse')).toBe(0);
  });

  it('discards the only card left when there are fewer than 2 cards in hand', async () => {
    const game = createGame({ kingdom: KINGDOM, players: PLAYERS });
    game.alice.setHand(["Witch's Hut"]);
    game.alice.setDeck(['Village']);

    await game.start();
    await game.playAction("Witch's Hut");

    const discard = game.expectDecision('chooseCards', 'Alice');
    expect(discard.numSelectedEligibility).toContain(1);
    await game.chooseCards(['Village']);

    expect(game.alice.discard).toEqual(['Village']);
    expect(game.bob.discard).toEqual([]);
  });

  it('still gives a Curse to a player who revealed Diplomat against it', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Diplomat'] });
    game.alice.setHand(["Witch's Hut", 'Village', 'Smithy', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Diplomat', 'Estate', 'Estate', 'Copper', 'Copper']);
    game.bob.setDeck(['Silver', 'Gold', ...COPPERS]);

    await game.start();
    await game.playAction("Witch's Hut");

    // Bob reacts as soon as it is played, before Alice draws and discards
    await game.chooseEffect('Diplomat');
    await game.chooseCards(['Estate', 'Estate', 'Copper']);
    expect(game.bob.hand).toEqual(['Diplomat', 'Copper', 'Silver', 'Gold']);

    await game.chooseCards(['Village', 'Smithy']);
    expect(game.bob.discard).toEqual(['Estate', 'Estate', 'Copper', 'Curse']);
  });

  it('may discard a Trail, which is played but still counts as one of the two Actions discarded', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Trail'] });
    game.alice.setHand(["Witch's Hut", 'Trail', 'Smithy', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Copper', 'Copper', 'Copper', 'Gold', ...COPPERS]);

    await game.start();
    await game.playAction("Witch's Hut");
    await game.chooseCards(['Trail', 'Smithy']);
    await game.chooseEffect('Trail');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.inPlay).toEqual(["Witch's Hut", 'Trail']);
    expect(game.alice.hand).toContain('Gold');
    expect(game.bob.discard).toEqual(['Curse']);
  });

  it('counts Actions with other types: discarding Coronet and Mill gives out Curses', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Mill'] });
    game.alice.setHand(["Witch's Hut", 'Coronet', 'Mill', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction("Witch's Hut");
    await game.chooseCards(['Coronet', 'Mill']);

    expect(game.alice.log).toContain('Alice reveals Coronet, Mill');
    expect(game.bob.discard).toEqual(['Curse']);
  });

  it('does not count a Cauldron, which is a Treasure and an Attack but not an Action', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Cauldron'] });
    game.alice.setHand(["Witch's Hut", 'Cauldron', 'Smithy', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction("Witch's Hut");
    await game.chooseCards(['Cauldron', 'Smithy']);

    expect(game.alice.log).toContain('Alice reveals Cauldron, Smithy');
    expect(game.bob.discard).toEqual([]);
  });

  it('gives a Curse to each other player in turn order with 4 players, except one who revealed Moat', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Moat'], players: ['Alice', 'Bob', 'Cara', 'Dan'] });
    game.alice.setHand(["Witch's Hut", 'Village', 'Smithy', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    const cara = game.player('Cara');
    cara.setHand(['Moat', 'Copper', 'Copper', 'Copper', 'Copper']);
    const dan = game.player('Dan');
    game.setPileSize('Curse', 2);

    await game.start();
    await game.playAction("Witch's Hut");
    // Moat is revealed when Witch's Hut is played, before Alice draws and discards
    game.expectDecision('chooseFromMultipleEvents', 'Cara');
    await game.chooseEffect('Moat');
    if (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.declineEffects();
    }
    await game.chooseCards(['Village', 'Smithy']);

    expect(game.bob.discard).toEqual(['Curse']);
    expect(cara.discard).toEqual([]);
    expect(dan.discard).toEqual(['Curse']);
    expect(game.pileSize('Curse')).toBe(0);
  });

  it('asks nothing and gives out no Curse with no cards to draw or discard', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(["Witch's Hut"]);
    const curses = game.pileSize('Curse');

    await game.start();
    await game.playAction("Witch's Hut");

    game.expectDecision('buyPhase', 'Alice');
    expect(game.bob.discard).toEqual([]);
    expect(game.pileSize('Curse')).toBe(curses);
  });

  it('lets a discarded Tunnel gain a Gold, but a Tunnel is not an Action, so there is no Curse', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Tunnel'] });
    game.alice.setHand(["Witch's Hut", 'Tunnel', 'Smithy', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction("Witch's Hut");
    await game.chooseCards(['Tunnel', 'Smithy']);
    await game.chooseEffect('Tunnel');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.discard).toEqual(['Tunnel', 'Smithy', 'Gold']);
    expect(game.bob.discard).toEqual([]);
  });
});
