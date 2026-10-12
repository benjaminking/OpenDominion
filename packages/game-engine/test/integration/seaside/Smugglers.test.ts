import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { coppers, offered, resolveEffects } from './seasideHelpers';

const threePlayerGame = (kingdom: string[]) => {
  const game = createGame({ kingdom: ['Smugglers', ...kingdom], players: ['Alice', 'Bob', 'Cara'] });
  game.alice.setHand(coppers(5));
  game.alice.setDeck(['Smugglers', ...coppers(20)]);
  game.bob.setDeck(coppers(10));
  game.player('Cara').setDeck(coppers(10));
  return game;
};

describe('Smugglers', () => {
  it('offers only cards costing up to $6 that the player to the right gained on their last turn', async () => {
    const game = threePlayerGame(['Market']);
    game.bob.setHand(['Gold', 'Gold', 'Copper', 'Copper', 'Copper']);
    game.player('Cara').setHand(['Market', 'Gold', 'Gold', 'Gold', 'Silver']);

    await game.start();
    await game.endTurn();

    // Bob (to Alice's left) gains a Gold
    await game.playAllTreasures();
    await game.buy('Gold');

    // Cara (to Alice's right) gains a Province and a Silver
    expect(game.currentPlayerName).toBe('Cara');
    await game.playAction('Market');
    await game.playAllTreasures();
    await game.buy('Province');
    await game.buy('Silver');

    expect(game.currentPlayerName).toBe('Alice');
    const silvers = game.pileSize('Silver');
    await game.playAction('Smugglers');
    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(offered(gain)).toEqual(['Silver']);
    await game.chooseCard('Silver');
    expect(game.alice.discard).toContain('Silver');
    expect(game.pileSize('Silver')).toBe(silvers - 1);
  });

  it('gains nothing when the player to the right gained nothing on their last turn', async () => {
    const game = threePlayerGame([]);
    game.bob.setHand(coppers(5));
    game.player('Cara').setHand(coppers(5));

    await game.start();
    await game.endTurn();
    await game.playAllTreasures();
    await game.buy('Silver');
    expect(game.currentPlayerName).toBe('Cara');
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    await game.playAction('Smugglers');

    expect(game.pending.kind).not.toBe('chooseCard');
    // Only the Coppers from Alice's first turn
    expect(game.alice.discard).toEqual(coppers(5));
  });

  it("ignores cards the player to the right gained during another player's turn", async () => {
    const game = threePlayerGame(['Sea Witch', 'Village']);
    game.alice.setDeck(['Village', 'Sea Witch', 'Smugglers', 'Copper', 'Copper', ...coppers(20)]);
    game.bob.setHand(coppers(5));
    game.player('Cara').setHand(coppers(5));

    await game.start();
    await game.endTurn();
    await game.endTurn();
    expect(game.currentPlayerName).toBe('Cara');
    await game.playAllTreasures();
    await game.buy('Silver');

    expect(game.currentPlayerName).toBe('Alice');
    await game.playAction('Village');
    await game.playAction('Sea Witch');
    expect(game.player('Cara').discard).toContain('Curse');
    await game.playAction('Smugglers');

    expect(offered(game.expectDecision('chooseCard', 'Alice'))).toEqual(['Silver']);
  });

  it('looks at the last turn of the player to the right even on an extra turn', async () => {
    const game = createGame({ kingdom: ['Smugglers', 'Outpost'] });
    game.alice.setHand(coppers(5));
    game.alice.setDeck(['Outpost', ...coppers(4), 'Smugglers', ...coppers(20)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.endTurn();
    await game.playAllTreasures();
    await game.buy('Silver');

    expect(game.currentPlayerName).toBe('Alice');
    await game.playAction('Outpost');
    await game.endTurn();
    await game.chooseExtraTurn('Outpost');

    expect(game.currentPlayerName).toBe('Alice');
    await game.playAction('Smugglers');
    expect(offered(game.expectDecision('chooseCard', 'Alice'))).toEqual(['Silver']);
  });

  it('looks only at the extra turn when the player to the right took an Outpost turn after their normal turn', async () => {
    const game = createGame({ kingdom: ['Smugglers', 'Outpost'] });
    game.alice.setHand(coppers(5));
    game.alice.setDeck(['Smugglers', ...coppers(20)]);
    game.bob.setHand(['Outpost', 'Gold', 'Gold', 'Copper', 'Copper']);
    game.bob.setDeck(['Silver', 'Copper', 'Copper', ...coppers(10)]);

    await game.start();
    await game.endTurn();

    await game.playAction('Outpost');
    await game.playAllTreasures();
    await game.buy('Gold');
    await game.chooseExtraTurn('Outpost');
    await resolveEffects(game);
    expect(game.currentPlayerName).toBe('Bob');
    await game.playAllTreasures();
    await game.buy('Silver');

    expect(game.currentPlayerName).toBe('Alice');
    await game.playAction('Smugglers');
    expect(offered(game.expectDecision('chooseCard', 'Alice'))).toEqual(['Silver']);
  });

  it('never offers a card with a Potion in its cost', async () => {
    const game = createGame({ kingdom: ['Smugglers', 'Golem', 'Market'] });
    game.alice.setHand(coppers(5));
    game.alice.setDeck(['Smugglers', ...coppers(20)]);
    game.bob.setHand(['Market', 'Potion', 'Gold', 'Gold', 'Copper']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.endTurn();

    await game.playAction('Market');
    await game.playAllTreasures();
    await game.buy('Golem');
    await game.buy('Silver');
    expect(game.bob.discard).toEqual(expect.arrayContaining(['Golem', 'Silver']));

    expect(game.currentPlayerName).toBe('Alice');
    await game.playAction('Smugglers');
    expect(offered(game.expectDecision('chooseCard', 'Alice'))).toEqual(['Silver']);
  });

  it('gains nothing when the pile of the card the player to the right gained is now empty', async () => {
    const game = createGame({ kingdom: ['Smugglers'] });
    game.alice.setHand(coppers(5));
    game.alice.setDeck(['Smugglers', ...coppers(20)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));
    game.setPileSize('Silver', 1);

    await game.start();
    await game.endTurn();
    await game.playAllTreasures();
    await game.buy('Silver');
    expect(game.pileSize('Silver')).toBe(0);

    expect(game.currentPlayerName).toBe('Alice');
    await game.playAction('Smugglers');

    expect(game.pending.kind).toBe('treasurePhase');
    expect(game.alice.discard).not.toContain('Silver');
  });

  it('can gain a card that cost more than $6 when gained but costs $6 now, e.g. with two Highways in play', async () => {
    const game = createGame({ kingdom: ['Smugglers', 'Highway'] });
    game.alice.setHand(coppers(5));
    game.alice.setDeck(['Highway', 'Highway', 'Smugglers', 'Copper', 'Copper', ...coppers(20)]);
    game.bob.setHand(['Gold', 'Gold', 'Gold', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.endTurn();
    await game.playAllTreasures();
    await game.buy('Province');

    expect(game.currentPlayerName).toBe('Alice');
    await game.playAction('Highway');
    await game.playAction('Highway');
    await game.playAction('Smugglers');
    expect(offered(game.expectDecision('chooseCard', 'Alice'))).toEqual(['Province']);
    await game.chooseCard('Province');
    expect(game.alice.discard).toContain('Province');
  });
  it('never offers a non-Supply card such as Spoils that the player to the right gained', async () => {
    const game = createGame({ kingdom: ['Smugglers', 'Bandit Camp'] });
    game.alice.setHand(coppers(5));
    game.alice.setDeck(['Smugglers', ...coppers(20)]);
    game.bob.setHand(['Bandit Camp', 'Silver', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.endTurn();
    await game.playAction('Bandit Camp');
    await game.playAllTreasures();
    await game.buy('Silver');
    expect(game.bob.discard).toEqual(expect.arrayContaining(['Spoils', 'Silver']));

    expect(game.currentPlayerName).toBe('Alice');
    await game.playAction('Smugglers');
    expect(offered(game.expectDecision('chooseCard', 'Alice'))).toEqual(['Silver']);
  });

  it('offers a gained Ruins or Knight only if the top card of its pile has the same name', async () => {
    const game = createGame({ kingdom: ['Smugglers', 'Marauder', 'Knights', 'Market'] });
    game.alice.setHand(coppers(5));
    game.alice.setDeck(['Smugglers', ...coppers(20)]);
    game.bob.setHand(['Market', 'Silver', 'Silver', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));
    game.setPile('Ruins', ['Ruined Village', 'Ruined Village', 'Survivors']);
    game.setPile('Knights', ['Sir Martin', 'Dame Anna']);

    await game.start();
    await game.endTurn();
    await game.playAction('Market');
    await game.playAllTreasures();
    await game.buy('Sir Martin');
    await game.buy('Ruined Village');
    expect(game.bob.discard).toEqual(expect.arrayContaining(['Sir Martin', 'Ruined Village']));

    // Another Ruined Village is on top of the Ruins, but Dame Anna is on top of the Knights
    expect(game.currentPlayerName).toBe('Alice');
    await game.playAction('Smugglers');
    expect(offered(game.expectDecision('chooseCard', 'Alice'))).toEqual(['Ruined Village']);
    await game.chooseCard('Ruined Village');
    expect(game.pileCards('Ruins')).toEqual(['Survivors']);
  });

  it('does not offer a card that cost $6 or less when gained but costs more now, e.g. Peddler', async () => {
    const game = createGame({ kingdom: ['Smugglers', 'Peddler', 'Village'] });
    game.alice.setHand(coppers(5));
    game.alice.setDeck(['Smugglers', ...coppers(20)]);
    game.bob.setHand(['Village', 'Village', 'Silver', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.endTurn();
    await game.playAction('Village');
    await game.playAction('Village');
    await game.playAllTreasures();
    // Two Actions in play: Peddler costs $4 in Bob's Buy phase
    expect(game.costOf('Peddler').coins).toBe(4);
    await game.buy('Peddler');

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.costOf('Peddler').coins).toBe(8);
    await game.playAction('Smugglers');
    expect(game.pending.kind).not.toBe('chooseCard');
    expect(game.alice.discard).not.toContain('Peddler');
  });

  it('gains a copy on each play when played twice by Coronet, with Quarry making an Action costing $7 cost $5', async () => {
    const game = createGame({ kingdom: ['Smugglers', 'Quarry', "King's Court"] });
    game.alice.setHand(coppers(5));
    game.alice.setDeck(['Quarry', 'Coronet', 'Smugglers', 'Copper', 'Copper', ...coppers(20)]);
    game.bob.setHand(['Gold', 'Gold', 'Copper', 'Copper', 'Estate']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.endTurn();
    await game.playAllTreasures();
    await game.buy("King's Court");

    expect(game.currentPlayerName).toBe('Alice');
    await game.endActionPhase();
    await game.playTreasure('Quarry');
    await game.playTreasure('Coronet');
    await game.chooseCard('Smugglers');
    expect(offered(game.expectDecision('chooseCard', 'Alice'))).toEqual(["King's Court"]);
    await game.chooseCard("King's Court");
    expect(offered(game.expectDecision('chooseCard', 'Alice'))).toEqual(["King's Court"]);
    await game.chooseCard("King's Court");

    expect(game.alice.discard.filter((name) => name === "King's Court")).toHaveLength(2);
  });
});
