import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

describe('Patrol', () => {
  it('puts Victory cards (including Action-Victory cards) and Curses into hand and the rest back in the chosen order', async () => {
    const game = createGame({ kingdom: ['Patrol', 'Nobles'] });
    game.alice.setHand(['Patrol']);
    game.alice.setDeck(['Copper', 'Copper', 'Copper', 'Nobles', 'Silver', 'Curse', 'Gold', 'Estate']);

    await game.start();
    await game.playAction('Patrol');

    // Silver and Gold go back: the first one chosen goes on the deck first, so it ends up under the other
    await game.chooseCard('Silver');

    expect([...game.alice.hand].sort()).toEqual(['Copper', 'Copper', 'Copper', 'Curse', 'Nobles']);
    expect(game.alice.deck).toEqual(['Gold', 'Silver', 'Estate']);
  });

  it('shuffles the discard pile to reveal when the deck runs out, and reveals fewer when there are not enough cards', async () => {
    const game = createGame({ kingdom: ['Patrol'] });
    game.alice.setHand(['Patrol']);
    game.alice.setDeck(['Copper', 'Copper', 'Copper', 'Estate']);
    game.alice.setDiscard(['Duchy']);

    await game.start();
    await game.playAction('Patrol');

    // Revealed Estate, then shuffled to reveal Duchy; there is nothing else to reveal or put back
    expect([...game.alice.hand].sort()).toEqual(['Copper', 'Copper', 'Copper', 'Duchy', 'Estate']);
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.discard).toEqual([]);
    game.expectDecision(['treasurePhase', 'buyPhase'], 'Alice');
  });

  it('draws and reveals nothing with an empty deck and discard pile', async () => {
    const game = createGame({ kingdom: ['Patrol'] });
    game.alice.setHand(['Patrol', 'Copper']);

    await game.start();
    await game.playAction('Patrol');

    expect(game.alice.hand).toEqual(['Copper']);
    game.expectDecision(['treasurePhase', 'buyPhase'], 'Alice');
  });

  it('puts all 4 revealed cards into hand without asking when they are all Victory cards or Curses', async () => {
    const game = createGame({ kingdom: ['Patrol', 'Farm', 'Mill'] });
    game.alice.setHand(['Patrol']);
    game.alice.setDeck(['Copper', 'Copper', 'Copper', 'Farm', 'Mill', 'Curse', 'Duchy', 'Silver']);

    await game.start();
    await game.playAction('Patrol');

    // Farm (Treasure-Victory) and Mill (Action-Victory) count as Victory cards
    expect([...game.alice.hand].sort()).toEqual(['Copper', 'Copper', 'Copper', 'Curse', 'Duchy', 'Farm', 'Mill']);
    expect(game.alice.deck).toEqual(['Silver']);
    game.expectDecision(['actionPhase', 'treasurePhase', 'buyPhase'], 'Alice');
  });

  it('reveals from the reshuffled deck when its draw causes a reshuffle', async () => {
    const game = createGame({ kingdom: ['Patrol'] });
    game.alice.setHand(['Patrol']);
    game.alice.setDeck(['Copper', 'Copper']);
    game.alice.setDiscard(['Estate', 'Estate', 'Estate', 'Estate', 'Estate']);

    await game.start();
    await game.playAction('Patrol');

    // Drew 2 Coppers and an Estate after shuffling; then revealed the remaining 4 Estates
    expect([...game.alice.hand].sort()).toEqual(['Copper', 'Copper', 'Estate', 'Estate', 'Estate', 'Estate', 'Estate']);
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.discard).toEqual([]);
  });

  it('lets the second play by Throne Room draw the cards the first play put back', async () => {
    const game = createGame({ kingdom: ['Patrol', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Patrol']);
    game.alice.setDeck([
      'Copper',
      'Copper',
      'Copper',
      'Silver',
      'Estate',
      'Gold',
      'Silver',
      'Estate',
      'Copper',
      'Copper',
      'Copper',
      'Copper',
    ]);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Patrol');
    // First play: Silver, Gold, Silver go back; the last one chosen (Gold) ends up on top
    await game.chooseCard('Silver');
    await game.chooseCard('Silver');

    // Second play draws Gold, Silver, Silver and reveals Estate and 3 Coppers
    expect([...game.alice.hand].sort()).toEqual([
      'Copper',
      'Copper',
      'Copper',
      'Estate',
      'Estate',
      'Gold',
      'Silver',
      'Silver',
    ]);
  });

  it('does not shuffle the cards already revealed into the deck when it reshuffles mid-reveal', async () => {
    const game = createGame({ kingdom: ['Patrol'] });
    game.alice.setHand(['Patrol']);
    game.alice.setDeck(['Copper', 'Copper', 'Copper', 'Silver']);
    game.alice.setDiscard(['Gold', 'Estate']);

    await game.start();
    await game.playAction('Patrol');

    // Revealed Silver, then shuffled Gold and Estate to reveal them; Estate goes to hand
    expect(game.alice.hand).toContain('Estate');
    expect(game.alice.discard).toEqual([]);
    const decision = game.expectDecision('chooseCard', 'Alice');
    expect([...decision.cardChoices.map((choice) => choice.card.name)].sort()).toEqual(['Gold', 'Silver']);
    await game.chooseCard('Gold');

    expect(game.alice.deck).toEqual(['Silver', 'Gold']);
  });

  it('counts the Victory cards it puts into hand once each', async () => {
    const game = createGame({ kingdom: ['Patrol'] });
    game.alice.setHand(['Patrol']);
    game.alice.setDeck(['Copper', 'Copper', 'Copper', 'Duchy', 'Silver', 'Estate', 'Curse', 'Gold']);

    await game.start();
    await game.playAction('Patrol');

    expect([...game.alice.hand].sort()).toEqual(['Copper', 'Copper', 'Copper', 'Curse', 'Duchy', 'Estate']);
    expect(game.alice.deck).toEqual(['Silver', 'Gold']);
    expect(game.alice.score).toBe(3);
  });

  it('puts multi-type Victory cards (Dame Josephine, Tunnel) and Curse-Treasures into hand, but not Hovel', async () => {
    const game = createGame({ kingdom: ['Patrol', 'Knights', 'Tunnel', 'Charlatan'], useShelters: true });
    game.alice.setHand(['Patrol']);
    game.alice.setDeck(['Copper', 'Copper', 'Copper', 'Dame Josephine', 'Tunnel', 'Hovel', 'Charlatan Curse', 'Gold']);

    await game.start();
    await game.playAction('Patrol');

    expect([...game.alice.hand].sort()).toEqual([
      'Charlatan Curse',
      'Copper',
      'Copper',
      'Copper',
      'Dame Josephine',
      'Tunnel',
    ]);
    expect(game.alice.deck).toEqual(['Hovel', 'Gold']);
  });

  it('puts Overgrown Estate (Victory-Shelter) into hand, but not Necropolis (Action-Shelter)', async () => {
    const game = createGame({ kingdom: ['Patrol'], useShelters: true });
    game.alice.setHand(['Patrol']);
    game.alice.setDeck(['Copper', 'Copper', 'Copper', 'Overgrown Estate', 'Necropolis', 'Gold', 'Gold']);

    await game.start();
    await game.playAction('Patrol');

    expect(game.alice.hand).toContain('Overgrown Estate');
    expect(game.alice.hand).not.toContain('Necropolis');
    expect(
      [...game.expectDecision('chooseCard', 'Alice').cardChoices.map((choice) => choice.card.name)].sort(),
    ).toEqual(['Gold', 'Gold', 'Necropolis']);
  });
});
