import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

const offeredNames = (game: ReturnType<typeof createGame>): string[] =>
  game.expectDecision('chooseCard', 'Alice').cardChoices.map((choice) => choice.card.name);

describe('Ironworks', () => {
  it('gives both +1 Action and +1 Card for an Action-Victory card', async () => {
    const game = createGame({ kingdom: ['Ironworks', 'Mill'] });
    game.alice.setHand(['Ironworks', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Gold', ...Array<string>(10).fill('Copper')]);

    await game.start();
    await game.playAction('Ironworks');
    expect(game.expectDecision('chooseCard', 'Alice').noneAllowed).toBe(false);
    await game.chooseCard('Mill');

    expect(game.alice.discard).toEqual(['Mill']);
    expect(game.alice.actions).toBe(1);
    expect(game.alice.hand).toContain('Gold');
    expect(game.alice.coins).toBe(0);
  });

  it('can gain a card costing up to $4 after Bridge reduces it, such as a Duchy', async () => {
    const game = createGame({ kingdom: ['Ironworks', 'Bridge'] });
    game.alice.setHand(['Village', 'Bridge', 'Ironworks', 'Copper', 'Copper']);
    game.alice.setDeck(['Gold', 'Copper', ...Array<string>(10).fill('Copper')]);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Bridge');
    await game.playAction('Ironworks');

    const offered = offeredNames(game);
    expect(offered).toContain('Duchy');
    expect(offered).toContain('Market');
    expect(offered).not.toContain('Gold');
    expect(offered).not.toContain('Province');
    await game.chooseCard('Duchy');
    expect(game.alice.discard).toEqual(['Duchy']);
    expect(game.alice.hand).toContain('Copper');
    expect(game.alice.hand).toHaveLength(4);
  });

  it('does not offer cards from empty piles', async () => {
    const game = createGame({ kingdom: ['Ironworks'] });
    game.alice.setHand(['Ironworks', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));
    game.setPileSize('Silver', 0);

    await game.start();
    await game.playAction('Ironworks');

    expect(offeredNames(game)).not.toContain('Silver');
  });

  it('gives +$1 and +1 Card for a Treasure-Victory card (Farm)', async () => {
    const game = createGame({ kingdom: ['Ironworks', 'Bridge', 'Farm', 'Throne Room'] });
    game.alice.setHand(['Village', 'Throne Room', 'Bridge', 'Ironworks', 'Copper']);
    game.alice.setDeck(['Gold', 'Gold', ...Array<string>(10).fill('Copper')]);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Throne Room');
    await game.chooseCard('Bridge');
    await game.playAction('Ironworks');
    await game.chooseCard('Farm');

    expect(game.alice.discard).toEqual(['Farm']);
    expect(game.alice.coins).toBe(3);
    expect(game.alice.actions).toBe(0);
    expect(game.alice.hand.filter((name) => name === 'Gold')).toHaveLength(2);
  });

  it('gives no bonus for gaining a Curse', async () => {
    const game = createGame({ kingdom: ['Ironworks'] });
    game.alice.setHand(['Ironworks', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Ironworks');
    await game.chooseCard('Curse');

    expect(game.alice.discard).toEqual(['Curse']);
    expect(game.alice.actions).toBe(0);
    expect(game.alice.coins).toBe(0);
    expect(game.alice.hand).toHaveLength(4);
  });

  it('still gives the bonus when Watchtower trashes the gained card', async () => {
    const game = createGame({ kingdom: ['Ironworks', 'Watchtower'] });
    game.alice.setHand(['Ironworks', 'Watchtower', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Ironworks');
    await game.chooseCard('Silver');
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Trash it');

    // Rules clarification: a gained card trashed or returned to its pile still gives Ironworks' bonus
    expect(game.trash).toEqual(['Silver']);
    expect(game.alice.coins).toBe(1);
  });

  it('gives the bonus for the gained card, not the Silver, when Trader exchanges it', async () => {
    const game = createGame({ kingdom: ['Ironworks', 'Trader', 'Village'] });
    game.alice.setHand(['Ironworks', 'Trader', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    const villages = game.pileSize('Village');

    await game.start();
    await game.playAction('Ironworks');
    await game.chooseCard('Village');
    await game.chooseEffect('Trader');

    expect(game.alice.discard).toEqual(['Silver']);
    expect(game.pileSize('Village')).toBe(villages);
    expect(game.alice.actions).toBe(1);
    expect(game.alice.coins).toBe(0);
  });

  it('gives +1 Action and +1 Card for Nobles reduced to $4 by two Bridges', async () => {
    const game = createGame({ kingdom: ['Ironworks', 'Bridge', 'Nobles'] });
    game.alice.setHand(['Village', 'Village', 'Bridge', 'Bridge', 'Ironworks']);
    game.alice.setDeck(['Copper', 'Copper', 'Gold', ...coppers(10)]);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Village');
    await game.playAction('Bridge');
    await game.playAction('Bridge');
    await game.playAction('Ironworks');
    expect(offeredNames(game)).toContain('Nobles');
    await game.chooseCard('Nobles');

    expect(game.alice.discard).toEqual(['Nobles']);
    expect(game.alice.actions).toBe(1);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Gold']);
  });

  it('does not offer Potion-cost cards, even those costing $0P', async () => {
    const game = createGame({ kingdom: ['Ironworks', 'Vineyard', 'Familiar'] });
    game.alice.setHand(['Ironworks', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Ironworks');

    const offered = offeredNames(game);
    expect(offered).toContain('Potion');
    expect(offered).not.toContain('Vineyard');
    expect(offered).not.toContain('Familiar');
  });

  it('draws a gained Victory card that Watchtower put onto the deck, since when-gain abilities resolve first', async () => {
    const game = createGame({ kingdom: ['Ironworks', 'Watchtower'] });
    game.alice.setHand(['Ironworks', 'Watchtower', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Gold', ...coppers(10)]);

    await game.start();
    await game.playAction('Ironworks');
    await game.chooseCard('Estate');
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Put it onto your deck');

    expect(game.alice.hand).toContain('Estate');
    expect(game.alice.hand).not.toContain('Gold');
    expect(game.alice.deck[0]).toBe('Gold');
  });

  it('gives both +1 Action and +1 Card for Island (Action-Victory)', async () => {
    const game = createGame({ kingdom: ['Ironworks', 'Island'] });
    game.alice.setHand(['Ironworks', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Gold', ...coppers(10)]);

    await game.start();
    await game.playAction('Ironworks');
    await game.chooseCard('Island');

    expect(game.alice.discard).toEqual(['Island']);
    expect(game.alice.actions).toBe(1);
    expect(game.alice.coins).toBe(0);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Gold']);
  });

  it("gives only +$1 for Fool's Gold (Treasure-Reaction)", async () => {
    const game = createGame({ kingdom: ['Ironworks', "Fool's Gold"] });
    game.alice.setHand(['Ironworks', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Gold', ...coppers(10)]);

    await game.start();
    await game.playAction('Ironworks');
    await game.chooseCard("Fool's Gold");

    expect(game.alice.discard).toEqual(["Fool's Gold"]);
    expect(game.alice.coins).toBe(1);
    expect(game.alice.actions).toBe(0);
    expect(game.alice.hand).toHaveLength(4);
  });

  it('gives only +1 Card for Tunnel (Victory-Reaction)', async () => {
    const game = createGame({ kingdom: ['Ironworks', 'Tunnel'] });
    game.alice.setHand(['Ironworks', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Gold', ...coppers(10)]);

    await game.start();
    await game.playAction('Ironworks');
    await game.chooseCard('Tunnel');

    expect(game.alice.discard).toEqual(['Tunnel']);
    expect(game.alice.coins).toBe(0);
    expect(game.alice.actions).toBe(0);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Gold']);
  });

  it('gives +$1 for a Curse when Charlatan makes Curses Treasures too', async () => {
    const game = createGame({ kingdom: ['Ironworks', 'Charlatan'] });
    game.alice.setHand(['Ironworks', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Ironworks');
    await game.chooseCard('Curse');

    expect(game.alice.discard).toEqual(['Charlatan Curse']);
    expect(game.alice.coins).toBe(1);
    expect(game.alice.actions).toBe(0);
    expect(game.alice.hand).toHaveLength(4);
  });

  it('gives +$1 for a Potion', async () => {
    const game = createGame({ kingdom: ['Ironworks', 'Familiar'] });
    game.alice.setHand(['Ironworks', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Ironworks');
    await game.chooseCard('Potion');

    expect(game.alice.discard).toEqual(['Potion']);
    expect(game.alice.coins).toBe(1);
    expect(game.alice.actions).toBe(0);
  });

  it('can gain only the top Knight, and gives +1 Action and +1 Card for Dame Josephine reduced to $4 by Bridge', async () => {
    const game = createGame({ kingdom: ['Ironworks', 'Bridge', 'Knights'] });
    game.alice.setHand(['Village', 'Bridge', 'Ironworks', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Gold', ...coppers(10)]);
    game.setPile('Knights', ['Dame Josephine', 'Sir Martin']);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Bridge');
    await game.playAction('Ironworks');

    // Dame Josephine is Action-Attack-Knight-Victory; Sir Martin (printed $4) is underneath and can't be gained
    const offered = offeredNames(game);
    expect(offered).toContain('Dame Josephine');
    expect(offered).not.toContain('Sir Martin');
    await game.chooseCard('Dame Josephine');

    expect(game.alice.discard).toEqual(['Dame Josephine']);
    expect(game.pileCards('Knights')).toEqual(['Sir Martin']);
    expect(game.alice.actions).toBe(1);
    expect(game.alice.coins).toBe(1);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Gold']);
  });

  it('can gain only the top Ruins card, which gives +1 Action', async () => {
    const game = createGame({ kingdom: ['Ironworks', 'Cultist'] });
    game.alice.setHand(['Ironworks', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.setPile('Ruins', ['Survivors', 'Ruined Village']);

    await game.start();
    await game.playAction('Ironworks');

    const offered = offeredNames(game);
    expect(offered).toContain('Survivors');
    expect(offered).not.toContain('Ruined Village');
    await game.chooseCard('Survivors');

    expect(game.alice.discard).toEqual(['Survivors']);
    expect(game.pileCards('Ruins')).toEqual(['Ruined Village']);
    expect(game.alice.actions).toBe(1);
    expect(game.alice.hand).toHaveLength(4);
  });

  it('does not offer non-Supply cards: Rewards (such as the Action-Treasure Coronet), Madman, Mercenary or Spoils', async () => {
    const game = createGame({ kingdom: ['Ironworks', 'Joust', 'Hermit', 'Urchin', 'Bandit Camp'] });
    game.alice.setHand(['Ironworks', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Ironworks');

    const offered = offeredNames(game);
    expect(offered).toContain('Hermit');
    expect(offered).toContain('Urchin');
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

  it('gives only the Death Cart bonus, not one for the Ruins its when-gain ability gains', async () => {
    const game = createGame({ kingdom: ['Ironworks', 'Death Cart'] });
    game.alice.setHand(['Ironworks', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.setPile('Ruins', ['Survivors', 'Ruined Village', 'Ruined Market']);

    await game.start();
    await game.playAction('Ironworks');
    await game.chooseCard('Death Cart');
    while (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.chooseEffect('Death Cart');
    }

    expect([...game.alice.discard].sort()).toEqual(['Death Cart', 'Ruined Village', 'Survivors']);
    expect(game.alice.actions).toBe(1);
    expect(game.alice.hand).toHaveLength(4);
  });

  it('gives the bonus after a gained Trail is played by its when-gain ability', async () => {
    const game = createGame({ kingdom: ['Ironworks', 'Trail'] });
    game.alice.setHand(['Ironworks', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Gold', ...coppers(10)]);

    await game.start();
    await game.playAction('Ironworks');
    await game.chooseCard('Trail');
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Trail');

    // Official FAQ (Ironworks): when-gain abilities happen before the bonus; Trail (Action-Reaction) gives +1 Action
    expect(game.alice.inPlay).toEqual(['Ironworks', 'Trail']);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Gold']);
    // 1 - 1 (Ironworks) + 1 (Trail) + 1 (Ironworks bonus)
    expect(game.alice.actions).toBe(2);
    expect(game.alice.coins).toBe(0);
  });

  it('gains and gives a bonus for each play by Throne Room', async () => {
    const game = createGame({ kingdom: ['Ironworks', 'Throne Room', 'Mill'] });
    game.alice.setHand(['Throne Room', 'Ironworks', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Gold', ...coppers(10)]);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Ironworks');
    await game.chooseCard('Mill');
    await game.chooseCard('Silver');

    expect(game.alice.discard).toEqual(['Mill', 'Silver']);
    expect(game.alice.actions).toBe(1);
    expect(game.alice.coins).toBe(1);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Gold']);
  });

  it('stacks Bridge and Highway: a Gold costs $4 and gives +$1', async () => {
    const game = createGame({ kingdom: ['Ironworks', 'Bridge', 'Highway'] });
    game.alice.setHand(['Village', 'Highway', 'Bridge', 'Ironworks', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Highway');
    await game.playAction('Bridge');
    await game.playAction('Ironworks');

    const offered = offeredNames(game);
    expect(offered).toContain('Gold');
    expect(offered).not.toContain('Province');
    await game.chooseCard('Gold');
    expect(game.alice.discard).toEqual(['Gold']);
    // Bridge $1 + Ironworks $1
    expect(game.alice.coins).toBe(2);
  });

  it("uses Quarry's reduction for Action cards only when played by Coronet in the Buy phase", async () => {
    const game = createGame({ kingdom: ['Ironworks', 'Quarry', 'Nobles'] });
    game.alice.setHand(['Quarry', 'Coronet', 'Ironworks']);
    game.alice.setDeck(['Gold', ...coppers(10)]);

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Quarry');
    await game.playTreasure('Coronet');
    await game.chooseCard('Ironworks');

    // Nobles (Action-Victory, printed $6) costs $4; Gold (a Treasure) still costs $6
    const offered = offeredNames(game);
    expect(offered).toContain('Nobles');
    expect(offered).not.toContain('Gold');
    await game.chooseCard('Nobles');
    expect(game.alice.hand).toEqual(['Gold']);
    await game.chooseCard('Silver');
    if (game.pending.kind === 'chooseCard') {
      await game.chooseNone();
    }

    expect([...game.alice.discard].sort()).toEqual(['Nobles', 'Silver']);
    // Quarry $1 + Ironworks $1 for the Silver
    expect(game.alice.coins).toBe(2);
  });

  it('can gain a Peddler in the Buy phase, when it costs $2 less per Action in play', async () => {
    const game = createGame({ kingdom: ['Ironworks', 'Peddler'] });
    game.alice.setHand(['Coronet', 'Ironworks']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Coronet');
    await game.chooseCard('Ironworks');

    // Coronet and Ironworks are in play: Peddler costs $8 - $4
    expect(offeredNames(game)).toContain('Peddler');
    await game.chooseCard('Peddler');
    await game.chooseCard('Silver');
    if (game.pending.kind === 'chooseCard') {
      await game.chooseNone();
    }

    expect([...game.alice.discard].sort()).toEqual(['Peddler', 'Silver']);
    expect(game.alice.coins).toBe(1);
  });

  it('can gain the last card of a third Supply pile, which ends the game after the turn', async () => {
    const game = createGame({ kingdom: ['Ironworks', 'Village', 'Smithy', 'Market'] });
    game.alice.setHand(['Ironworks', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(coppers(10));
    game.setPileSize('Smithy', 0);
    game.setPileSize('Market', 0);
    game.setPileSize('Village', 1);

    await game.start();
    await game.playAction('Ironworks');
    await game.chooseCard('Village');

    expect(game.pileSize('Village')).toBe(0);
    expect(game.alice.actions).toBe(1);
    expect(game.isFinished).toBe(false);
    await game.endTurn();
    expect(game.isFinished).toBe(true);
  });
});
