import { describe, expect, it } from 'vitest';

import { createGame, GameHarness } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

const offeredNames = (game: GameHarness): string[] =>
  game.expectDecision('chooseCard', 'Alice').cardChoices.map((choice) => choice.card.name);

describe('Replace', () => {
  it('gives each other player a Curse when the gained card is a Victory card, and leaves it in the discard', async () => {
    const game = createGame({ kingdom: ['Replace'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Replace', 'Silver', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));

    await game.start();
    await game.playAction('Replace');
    await game.chooseCard('Silver');
    await game.chooseCard('Duchy');

    expect(game.trash).toEqual(['Silver']);
    expect(game.alice.discard).toEqual(['Duchy']);
    expect(game.alice.deck[0]).toBe('Copper');
    expect(game.bob.discard).toEqual(['Curse']);
    expect(game.player('Cara').discard).toEqual(['Curse']);
  });

  it('both topdecks an Action-Victory card and gives out Curses', async () => {
    const game = createGame({ kingdom: ['Replace', 'Mill'] });
    game.alice.setHand(['Replace', 'Estate', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));

    await game.start();
    await game.playAction('Replace');
    await game.chooseCard('Estate');
    await game.chooseCard('Mill');

    expect(game.alice.deck[0]).toBe('Mill');
    expect(game.alice.discard).toEqual([]);
    expect(game.bob.discard).toEqual(['Curse']);
  });

  it('topdecks a gained Treasure without giving out Curses', async () => {
    const game = createGame({ kingdom: ['Replace'] });
    game.alice.setHand(['Replace', 'Estate', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));
    const cursesBefore = game.pileSize('Curse');

    await game.start();
    await game.playAction('Replace');
    await game.chooseCard('Estate');
    await game.chooseCard('Silver');

    expect(game.alice.deck[0]).toBe('Silver');
    expect(game.bob.discard).toEqual([]);
    expect(game.pileSize('Curse')).toBe(cursesBefore);
  });

  it('gives the last Curse to the next player in turn order and nothing to the rest', async () => {
    const game = createGame({ kingdom: ['Replace'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Replace', 'Estate', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));
    game.setPileSize('Curse', 1);

    await game.start();
    await game.playAction('Replace');
    await game.chooseCard('Estate');
    await game.chooseCard('Estate');

    expect(game.bob.discard).toEqual(['Curse']);
    expect(game.player('Cara').discard).toEqual([]);
    game.expectDecision(['treasurePhase', 'buyPhase'], 'Alice');
  });

  it('offers cards costing up to $2 more than the trashed card, with costs reduced by Bridge', async () => {
    const game = createGame({ kingdom: ['Replace', 'Bridge'] });
    game.alice.setHand(['Village', 'Bridge', 'Replace', 'Estate', 'Copper']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Bridge');
    await game.playAction('Replace');
    await game.chooseCard('Estate');

    // Estate costs $1 this turn, so cards costing up to $3 now (up to $4 printed) are offered
    const offered = game.expectDecision('chooseCard', 'Alice').cardChoices.map((choice) => choice.card.name);
    expect(offered).toContain('Smithy');
    expect(offered).toContain('Silver');
    expect(offered).not.toContain('Market');
    expect(offered).not.toContain('Duchy');
    await game.chooseCard('Smithy');
    expect(game.alice.deck[0]).toBe('Smithy');
  });

  it('still gains a Victory card when the Curse pile is empty, and gives out nothing', async () => {
    const game = createGame({ kingdom: ['Replace'] });
    game.alice.setHand(['Replace', 'Silver', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.setPileSize('Curse', 0);

    await game.start();
    await game.playAction('Replace');
    await game.chooseCard('Silver');
    await game.chooseCard('Duchy');

    expect(game.alice.discard).toEqual(['Duchy']);
    expect(game.bob.discard).toEqual([]);
    game.expectDecision(['treasurePhase', 'buyPhase'], 'Alice');
  });

  it('both topdecks a Treasure-Victory card (Farm) and gives out Curses', async () => {
    const game = createGame({ kingdom: ['Replace', 'Farm'] });
    game.alice.setHand(['Replace', 'Gold', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Replace');
    await game.chooseCard('Gold');
    await game.chooseCard('Farm');

    expect(game.alice.deck[0]).toBe('Farm');
    expect(game.alice.discard).toEqual([]);
    expect(game.bob.discard).toEqual(['Curse']);
  });

  it('trashes and gains twice when played by Throne Room, attacking only when a Victory card is gained', async () => {
    const game = createGame({ kingdom: ['Replace', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Replace', 'Estate', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Replace');
    await game.chooseCard('Estate');
    await game.chooseCard('Silver');
    expect(game.alice.deck[0]).toBe('Silver');
    expect(game.bob.discard).toEqual([]);

    await game.chooseCard('Copper');
    await game.chooseCard('Estate');

    expect(game.trash).toEqual(['Estate', 'Copper']);
    expect(game.alice.discard).toEqual(['Estate']);
    expect(game.alice.deck[0]).toBe('Silver');
    expect(game.bob.discard).toEqual(['Curse']);
  });

  it('gives no Curse to a player who revealed Moat when it was played', async () => {
    const game = createGame({ kingdom: ['Replace', 'Moat'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Replace', 'Silver', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Moat', 'Copper', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Replace');
    // Replace is an Attack, so Moat is revealed when it is played, before anything is gained
    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Moat');
    await game.chooseCard('Silver');
    await game.chooseCard('Duchy');

    expect(game.bob.discard).toEqual([]);
    expect(game.player('Cara').discard).toEqual(['Curse']);
  });

  it('gives out Curses for a gained Action-Victory card even after Watchtower trashed it, and cannot topdeck it', async () => {
    const game = createGame({ kingdom: ['Replace', 'Nobles', 'Watchtower'] });
    game.alice.setHand(['Replace', 'Gold', 'Watchtower', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Replace');
    await game.chooseCard('Gold');
    await game.chooseCard('Nobles');
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Trash it');

    expect(game.alice.log).toContain('Alice has lost track of Nobles');
    expect(game.trash).toEqual(['Gold', 'Nobles']);
    expect(game.alice.deck).toEqual(coppers(10));
    expect(game.bob.discard).toEqual(['Curse']);
  });

  it('has lost track of a gained Silver that Watchtower already put onto the deck, and does not move it again', async () => {
    const game = createGame({ kingdom: ['Replace', 'Watchtower'] });
    game.alice.setHand(['Replace', 'Estate', 'Watchtower', 'Copper', 'Copper']);
    game.alice.setDeck(['Gold', ...coppers(10)]);

    await game.start();
    await game.playAction('Replace');
    await game.chooseCard('Estate');
    await game.chooseCard('Silver');
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Put it onto your deck');

    // The Silver is on the deck, but it moved there after it was gained, so Replace has lost track of it
    expect(game.alice.log).toContain('Alice has lost track of Silver');
    expect(game.alice.deck.slice(0, 2)).toEqual(['Silver', 'Gold']);
    expect(game.alice.log.filter((line) => line === 'Alice puts Silver on the deck')).toHaveLength(1);
    expect(game.trash).toEqual(['Estate']);
    expect(game.bob.discard).toEqual([]);
    game.expectDecision(['treasurePhase', 'buyPhase'], 'Alice');
  });

  it('still gives out Curses after losing track of a gained Farm that Watchtower put onto the deck', async () => {
    const game = createGame({ kingdom: ['Replace', 'Watchtower', 'Farm'] });
    game.alice.setHand(['Replace', 'Gold', 'Watchtower', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Replace');
    await game.chooseCard('Gold');
    await game.chooseCard('Farm');
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Put it onto your deck');

    expect(game.alice.log).toContain('Alice has lost track of Farm');
    expect(game.alice.deck[0]).toBe('Farm');
    expect(game.alice.deck.slice(1)).toEqual(coppers(10));
    expect(game.bob.discard).toEqual(['Curse']);
  });

  it('offers cards up to $2 more including the Potion cost of the trashed card', async () => {
    const game = createGame({ kingdom: ['Replace', 'Familiar', 'Golem'] });
    game.alice.setHand(['Replace', 'Familiar', 'Silver', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Replace');
    await game.chooseCard('Familiar');

    // Up to $5P: $5 cards, Potion, Familiar and Golem
    const offered = offeredNames(game);
    expect(offered).toContain('Golem');
    expect(offered).toContain('Familiar');
    expect(offered).toContain('Duchy');
    expect(offered).toContain('Potion');
    expect(offered).not.toContain('Gold');
    await game.chooseCard('Golem');
    expect(game.alice.deck[0]).toBe('Golem');
  });

  it('does not offer Potion-cost cards when the trashed card has no Potion in its cost', async () => {
    const game = createGame({ kingdom: ['Replace', 'Familiar', 'Golem'] });
    game.alice.setHand(['Replace', 'Gold', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Replace');
    await game.chooseCard('Gold');

    const offered = offeredNames(game);
    expect(offered).toContain('Gold');
    expect(offered).toContain('Potion');
    expect(offered).not.toContain('Golem');
    expect(offered).not.toContain('Familiar');
  });

  it('cannot topdeck a gained Action that Trader exchanged, and does not topdeck the Silver instead', async () => {
    const game = createGame({ kingdom: ['Replace', 'Trader'] });
    game.alice.setHand(['Replace', 'Silver', 'Trader', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    const villages = game.pileSize('Village');

    await game.start();
    await game.playAction('Replace');
    await game.chooseCard('Silver');
    await game.chooseCard('Village');
    await game.chooseEffect('Trader');

    expect(game.alice.log).toContain('Alice has lost track of Village');
    expect(game.pileSize('Village')).toBe(villages);
    expect(game.alice.discard).toEqual(['Silver']);
    expect(game.alice.deck).toEqual(coppers(10));
  });

  it('still gives out Curses for a gained Victory card that Trader exchanged', async () => {
    const game = createGame({ kingdom: ['Replace', 'Trader'] });
    game.alice.setHand(['Replace', 'Silver', 'Trader', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Replace');
    await game.chooseCard('Silver');
    await game.chooseCard('Duchy');
    await game.chooseEffect('Trader');

    // Official FAQ (Trader): you still "gained" the card you gained, not the Silver
    expect(game.alice.discard).toEqual(['Silver']);
    expect(game.bob.discard).toEqual(['Curse']);
  });

  it('fails to topdeck a gained Trail that its when-gain ability played', async () => {
    const game = createGame({ kingdom: ['Replace', 'Trail'] });
    game.alice.setHand(['Replace', 'Silver', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Gold', ...coppers(10)]);

    await game.start();
    await game.playAction('Replace');
    await game.chooseCard('Silver');
    await game.chooseCard('Trail');
    await game.chooseEffect('Trail');

    // Wiki rules clarification (Replace): if an on-gain effect moves the card first, Replace can't topdeck it
    expect(game.alice.log).toContain('Alice has lost track of Trail');
    expect(game.alice.inPlay).toEqual(['Replace', 'Trail']);
    expect(game.alice.hand).toContain('Gold');
    expect(game.alice.deck[0]).toBe('Copper');
    expect(game.bob.discard).toEqual([]);
  });

  it('topdecks Dame Josephine (Action-Victory Knight) and gives out Curses', async () => {
    const game = createGame({ kingdom: ['Replace', 'Knights'] });
    game.alice.setHand(['Replace', 'Silver', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.setPile('Knights', ['Dame Josephine', 'Sir Martin']);

    await game.start();
    await game.playAction('Replace');
    await game.chooseCard('Silver');
    await game.chooseCard('Dame Josephine');

    expect(game.alice.deck[0]).toBe('Dame Josephine');
    expect(game.bob.discard).toEqual(['Curse']);
  });

  it('floors stacked Bridge reductions at $0: an Estate becomes a card costing up to $2 (printed $4)', async () => {
    const game = createGame({ kingdom: ['Replace', 'Bridge', 'Market'] });
    game.alice.setHand(['Village', 'Bridge', 'Bridge', 'Replace', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start(() => {
      game.alice.player.getStatistics().addActions(1);
    });
    await game.playAction('Village');
    await game.playAction('Bridge');
    await game.playAction('Bridge');
    await game.playAction('Replace');
    await game.chooseCard('Estate');

    const offered = offeredNames(game);
    expect(offered).toContain('Smithy');
    expect(offered).toContain('Silver');
    expect(offered).not.toContain('Market');
    expect(offered).not.toContain('Duchy');
  });

  it('uses Highway-reduced costs', async () => {
    const game = createGame({ kingdom: ['Replace', 'Highway', 'Market'] });
    game.alice.setHand(['Highway', 'Replace', 'Silver', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Highway');
    await game.playAction('Replace');
    await game.chooseCard('Silver');

    // Silver costs $2, so cards costing up to $4 now (printed $5) are offered
    const offered = offeredNames(game);
    expect(offered).toContain('Market');
    expect(offered).toContain('Duchy');
    expect(offered).not.toContain('Gold');
  });

  it("uses Quarry's reduction on Action cards when played by Coronet in the Buy phase", async () => {
    const game = createGame({ kingdom: ['Replace', 'Quarry', 'Market', 'Village'] });
    game.alice.setHand(['Quarry', 'Coronet', 'Replace', 'Village']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Quarry');
    await game.playTreasure('Coronet');
    await game.chooseCard('Replace');
    await game.chooseCard('Village');

    // Village costs $1, so up to $3: Silver, and Action cards up to printed $5
    const offered = offeredNames(game);
    expect(offered).toContain('Silver');
    expect(offered).toContain('Market');
    expect(offered).not.toContain('Duchy');
    expect(offered).not.toContain('Gold');
  });

  it("uses Peddler's full $8 cost when it is trashed in the Action phase", async () => {
    const game = createGame({ kingdom: ['Replace', 'Peddler'] });
    game.alice.setHand(['Replace', 'Peddler', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Replace');
    await game.chooseCard('Peddler');

    expect(offeredNames(game)).toContain('Province');
    await game.chooseCard('Province');
    expect(game.alice.discard).toEqual(['Province']);
    expect(game.bob.discard).toEqual(['Curse']);
  });

  it('does not offer non-Supply cards ($0* Rewards, Madman, Mercenary, Spoils)', async () => {
    const game = createGame({ kingdom: ['Replace', 'Joust', 'Hermit', 'Urchin', 'Bandit Camp'] });
    game.alice.setHand(['Replace', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Replace');
    await game.chooseCard('Copper');

    const offered = offeredNames(game);
    expect(offered).toContain('Estate');
    for (const name of [
      'Coronet',
      'Courser',
      'Demesne',
      'Housecarl',
      'Huge Turnip',
      'Renown',
      'Madman',
      'Mercenary',
      'Spoils',
    ]) {
      expect(offered).not.toContain(name);
    }
  });
});
