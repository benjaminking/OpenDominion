import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const COPPERS = Array<string>(10).fill('Copper');

describe('Rebuild', () => {
  it('skips the named Victory card, discards the rest, trashes the first other Victory card and upgrades it', async () => {
    const game = createGame({ kingdom: ['Rebuild'] });
    game.alice.setHand(['Rebuild', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Estate', 'Estate', 'Duchy', 'Silver', ...COPPERS]);

    await game.start();
    await game.playAction('Rebuild');
    await game.chooseCard('Estate');

    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(gain.noneAllowed).toBe(false);
    expect(gain.cardChoices.map((choice) => choice.card.name)).toContain('Province');
    await game.chooseCard('Province');

    expect(game.trash).toEqual(['Duchy']);
    expect(game.alice.discard).toEqual(['Copper', 'Estate', 'Estate', 'Province']);
    expect(game.alice.deck[0]).toBe('Silver');
    expect(game.alice.actions).toBe(1);
  });

  it('shuffles without the revealed cards, then discards everything when only the named Victory card turns up', async () => {
    const game = createGame({ kingdom: ['Rebuild'] });
    game.alice.setHand(['Rebuild', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Estate']);
    game.alice.setDiscard(['Silver', 'Estate']);

    await game.start();
    await game.playAction('Rebuild');
    await game.chooseCard('Estate');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual([]);
    expect(game.alice.deck).toEqual([]);
    expect([...game.alice.discard].sort()).toEqual(['Copper', 'Estate', 'Estate', 'Silver']);
  });

  it('finds a Victory card after shuffling the discard pile', async () => {
    const game = createGame({ kingdom: ['Rebuild'] });
    game.alice.setHand(['Rebuild', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper']);
    game.alice.setDiscard(['Duchy']);

    await game.start();
    await game.playAction('Rebuild');
    await game.chooseCard('Province');
    await game.chooseCard('Province', CardLocation.PILE);

    expect(game.trash).toEqual(['Duchy']);
    expect(game.alice.discard).toEqual(['Copper', 'Province']);
    expect(game.alice.deck).toEqual([]);
  });

  it('can trash Dame Josephine, a Victory card costing $5, to gain a Province', async () => {
    const game = createGame({ kingdom: ['Rebuild', 'Knights'] });
    game.alice.setHand(['Rebuild', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Dame Josephine', ...COPPERS]);

    await game.start();
    await game.playAction('Rebuild');
    await game.chooseCard('Province');
    await game.chooseCard('Province', CardLocation.PILE);

    expect(game.trash).toEqual(['Dame Josephine']);
    expect(game.alice.discard).toEqual(['Copper', 'Province']);
  });

  it('can name a card that is not in the Supply', async () => {
    const game = createGame({ kingdom: ['Rebuild'] });
    game.alice.setHand(['Rebuild', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Overgrown Estate', 'Duchy', ...COPPERS]);

    await game.start();
    await game.playAction('Rebuild');
    await game.chooseCard('Overgrown Estate');
    await game.chooseCard('Province', CardLocation.PILE);

    expect(game.trash).toEqual(['Duchy']);
    expect(game.alice.discard).toEqual(['Overgrown Estate', 'Province']);
  });

  it('trashes the first Victory card revealed when a non-Victory card is named', async () => {
    const game = createGame({ kingdom: ['Rebuild'] });
    game.alice.setHand(['Rebuild', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Estate', 'Duchy', ...COPPERS]);

    await game.start();
    await game.playAction('Rebuild');
    await game.chooseCard('Copper');

    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(gain.prompt).toBe('Gain a Victory card costing up to $5');
    expect(gain.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Duchy', 'Estate']);
    await game.chooseCard('Duchy', CardLocation.PILE);

    expect(game.trash).toEqual(['Estate']);
    expect(game.alice.discard).toEqual(['Copper', 'Duchy']);
    expect(game.alice.deck[0]).toBe('Duchy');
  });

  it('discards a named Tunnel it reveals, which can gain a Gold', async () => {
    const game = createGame({ kingdom: ['Rebuild', 'Tunnel'] });
    game.alice.setHand(['Rebuild', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Tunnel', 'Copper', 'Estate', ...COPPERS]);

    await game.start();
    await game.playAction('Rebuild');
    await game.chooseCard('Tunnel');

    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Tunnel');
    await game.chooseCard('Duchy', CardLocation.PILE);

    expect(game.trash).toEqual(['Estate']);
    expect([...game.alice.discard].sort()).toEqual(['Copper', 'Duchy', 'Gold', 'Tunnel']);
  });

  it('uses current costs: with Bridge in play a trashed Duchy costs $4, and Province ($7) can be gained', async () => {
    const game = createGame({ kingdom: ['Rebuild', 'Bridge', 'Village'] });
    game.alice.setHand(['Village', 'Bridge', 'Rebuild', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Duchy', ...COPPERS]);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Bridge');
    await game.playAction('Rebuild');
    await game.chooseCard('Estate');

    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(gain.prompt).toBe('Gain a Victory card costing up to $7');
    expect(gain.cardChoices.map((choice) => choice.card.name)).toContain('Province');
    await game.chooseCard('Province', CardLocation.PILE);

    expect(game.trash).toEqual(['Duchy']);
    expect(game.alice.discard).toEqual(['Province']);
  });

  it("resolves a trashed Feodum's 3 Silvers before gaining a Victory card", async () => {
    const game = createGame({ kingdom: ['Rebuild', 'Feodum'] });
    game.alice.setHand(['Rebuild', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Feodum', ...COPPERS]);

    await game.start();
    await game.playAction('Rebuild');
    await game.chooseCard('Province');

    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(game.alice.discard).toEqual(['Silver', 'Silver', 'Silver']);
    expect(gain.cardChoices.map((choice) => choice.card.name)).not.toContain('Province');
    await game.chooseCard('Duchy', CardLocation.PILE);

    expect(game.trash).toEqual(['Feodum']);
    expect(game.alice.discard).toEqual(['Silver', 'Silver', 'Silver', 'Duchy']);
  });

  it('rebuilds twice when played by Throne Room, not finding the card gained by the first play', async () => {
    const game = createGame({ kingdom: ['Rebuild', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Rebuild', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', 'Copper', 'Duchy', ...COPPERS]);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Rebuild');
    await game.chooseCard('Province');
    await game.chooseCard('Duchy', CardLocation.PILE);
    await game.chooseCard('Province');
    await game.chooseCard('Province', CardLocation.PILE);

    expect(game.trash).toEqual(['Estate', 'Duchy']);
    expect(game.alice.discard).toEqual(['Duchy', 'Copper', 'Province']);
    expect(game.alice.actions).toBe(2);
  });

  it('can find, on its second Throne Room play, the Victory card its first play gained, once the discard pile is shuffled', async () => {
    const game = createGame({ kingdom: ['Rebuild', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Rebuild', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', 'Copper']);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Rebuild');
    await game.chooseCard('Province');
    await game.chooseCard('Duchy', CardLocation.PILE);
    // Second play: Copper, then the deck is empty and the discard pile (just the Duchy) is shuffled
    await game.chooseCard('Province');
    await game.chooseCard('Province', CardLocation.PILE);

    expect(game.trash).toEqual(['Estate', 'Duchy']);
    expect(game.alice.discard).toEqual(['Copper', 'Province']);
    expect(game.alice.deck).toEqual([]);
  });

  it("still counts the revealed cards it discards as Alice's while a discarded Tunnel's reaction is offered", async () => {
    const game = createGame({ kingdom: ['Rebuild', 'Tunnel'] });
    game.alice.setHand(['Rebuild', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Tunnel', 'Copper', 'Estate', ...COPPERS]);
    // Tunnel 2 + Estate 1
    expect(game.alice.score).toBe(3);

    await game.start();
    await game.playAction('Rebuild');
    await game.chooseCard('Tunnel');

    // Tunnel and Copper have been discarded; the Estate is still revealed
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(game.alice.score).toBe(3);
    expect([...game.alice.discard].sort()).toEqual(['Copper', 'Tunnel']);
  });

  it('upgrades a Vineyard ($0P) to a Victory card costing up to $3P: Estate or Vineyard, not Duchy', async () => {
    const game = createGame({ kingdom: ['Rebuild', 'Vineyard'] });
    game.alice.setHand(['Rebuild', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Vineyard', ...COPPERS]);

    await game.start();
    await game.playAction('Rebuild');
    await game.chooseCard('Province');

    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(gain.prompt).toBe('Gain a Victory card costing up to $3P');
    expect(gain.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Estate', 'Vineyard']);
    await game.chooseCard('Vineyard', CardLocation.PILE);

    expect(game.trash).toEqual(['Vineyard']);
    expect(game.alice.discard).toEqual(['Vineyard']);
  });

  it('cannot upgrade an Estate to a Vineyard, which has a Potion in its cost', async () => {
    const game = createGame({ kingdom: ['Rebuild', 'Vineyard', 'Gardens'] });
    game.alice.setHand(['Rebuild', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', ...COPPERS]);

    await game.start();
    await game.playAction('Rebuild');
    await game.chooseCard('Province');

    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(gain.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Duchy', 'Estate', 'Gardens']);
    await game.chooseCard('Gardens');

    expect(game.trash).toEqual(['Estate']);
  });

  it('trashes a Farm (Treasure-Victory) and can gain any Victory card up to $9, including Action-Victory Nobles and Mill', async () => {
    const game = createGame({ kingdom: ['Rebuild', 'Farm', 'Nobles', 'Mill'] });
    game.alice.setHand(['Rebuild', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Mill', 'Copper', 'Farm', ...COPPERS]);

    await game.start();
    await game.playAction('Rebuild');
    // Naming Mill skips the Mill
    await game.chooseCard('Mill');

    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(gain.prompt).toBe('Gain a Victory card costing up to $9');
    expect(gain.cardChoices.map((choice) => choice.card.name).sort()).toEqual([
      'Duchy',
      'Estate',
      'Farm',
      'Mill',
      'Nobles',
      'Province',
    ]);
    await game.chooseCard('Nobles');

    expect(game.trash).toEqual(['Farm']);
    expect(game.alice.discard).toEqual(['Mill', 'Copper', 'Nobles']);
  });

  it('trashes a Mill (Action-Victory, $4) and gains a Victory card costing up to $7', async () => {
    const game = createGame({ kingdom: ['Rebuild', 'Farm', 'Mill'] });
    game.alice.setHand(['Rebuild', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Mill', ...COPPERS]);

    await game.start();
    await game.playAction('Rebuild');
    await game.chooseCard('Province');

    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(gain.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Duchy', 'Estate', 'Farm', 'Mill']);
    await game.chooseCard('Farm');

    expect(game.trash).toEqual(['Mill']);
    expect(game.alice.discard).toEqual(['Farm']);
  });

  it('floors the trashed card at $0: with three cost reductions an Estate upgrades to a $6 Farm (costing $3 now), not a Province', async () => {
    const game = createGame({ kingdom: ['Rebuild', 'Throne Room', 'Bridge', 'Highway', 'Farm', 'Village'] });
    game.alice.setHand(['Village', 'Throne Room', 'Bridge', 'Highway', 'Rebuild']);
    // Village and Highway each draw a Copper
    game.alice.setDeck(['Copper', 'Copper', 'Estate', ...COPPERS]);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Throne Room');
    await game.chooseCard('Bridge');
    await game.playAction('Highway');
    await game.playAction('Rebuild');
    await game.chooseCard('Province');

    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(gain.prompt).toBe('Gain a Victory card costing up to $3');
    expect(gain.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Duchy', 'Estate', 'Farm']);
    await game.chooseCard('Farm');

    expect(game.trash).toEqual(['Estate']);
    expect(game.alice.discard).toEqual(['Farm']);
  });

  it('can gain the last Province; the game ends only after the turn', async () => {
    const game = createGame({ kingdom: ['Rebuild'] });
    game.setPileSize('Province', 1);
    game.alice.setHand(['Rebuild', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Duchy', ...COPPERS]);

    await game.start();
    await game.playAction('Rebuild');
    await game.chooseCard('Estate');
    await game.chooseCard('Province', CardLocation.PILE);

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.pileSize('Province')).toBe(0);
    expect(game.isFinished).toBe(false);
    await game.playAllTreasures();
    await game.buy('Silver');

    expect(game.isFinished).toBe(true);
  });
});
