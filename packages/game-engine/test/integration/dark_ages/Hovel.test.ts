import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const COPPERS = Array<string>(20).fill('Copper');

describe('Hovel', () => {
  it('can be dealt in a starting deck when Shelters are used', () => {
    expect(() => createGame({ useShelters: true })).not.toThrow();
  });

  it('may be trashed from hand when you buy a Victory card', async () => {
    const game = createGame();
    game.alice.setHand(['Hovel', 'Copper', 'Copper', 'Estate', 'Estate']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAllTreasures();
    await game.buy('Estate');

    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(game.pending.optionalEffects.map((effect) => effect.effectName)).toEqual(['Hovel']);
    await game.chooseEffect('Hovel');

    expect(game.trash).toEqual(['Hovel']);
    expect(game.alice.discard).not.toContain('Hovel');
    expect(game.currentPlayerName).toBe('Bob');
  });

  it('may be kept when you buy a Victory card', async () => {
    const game = createGame();
    game.alice.setHand(['Hovel', 'Copper', 'Copper', 'Estate', 'Estate']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAllTreasures();
    await game.buy('Estate');
    await game.declineEffects();

    expect(game.trash).toEqual([]);
    expect(game.alice.discard).toContain('Hovel');
  });

  it('is offered when you gain a Victory card without buying it', async () => {
    const game = createGame({ kingdom: ['Workshop'] });
    game.alice.setHand(['Workshop', 'Hovel', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Workshop');
    await game.chooseCard('Estate', CardLocation.PILE);

    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Hovel');
    expect(game.trash).toEqual(['Hovel']);
  });

  it('is not offered when you buy a card that is not a Victory card', async () => {
    const game = createGame();
    game.alice.setHand(['Hovel', 'Copper', 'Copper', 'Copper', 'Estate']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAllTreasures();
    await game.buy('Silver');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.trash).toEqual([]);
  });

  it("is offered when another player's Swindler makes you gain a Victory card on their turn", async () => {
    const game = createGame({ players: ['Bob', 'Alice'], kingdom: ['Swindler'] });
    game.bob.setHand(['Swindler', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(COPPERS);
    game.alice.setHand(['Hovel', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', ...COPPERS]);

    await game.start();
    await game.playAction('Swindler');
    // Alice trashes her top card (an Estate); Bob picks a $2 card for her to gain
    game.expectDecision('chooseCard', 'Bob');
    await game.chooseCard('Estate', CardLocation.PILE);

    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Hovel');
    expect(game.trash).toEqual(['Estate', 'Hovel']);
    expect(game.alice.discard).toEqual(['Estate']);
    expect(game.currentPlayerName).toBe('Bob');
  });
});

describe('Hovel: interactions', () => {
  it('lets each Hovel in hand be trashed when one Victory card is gained', async () => {
    const game = createGame();
    game.alice.setHand(['Hovel', 'Hovel', 'Copper', 'Copper', 'Estate']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAllTreasures();
    await game.buy('Estate');

    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(game.pending.optionalEffects.map((effect) => effect.effectName)).toEqual(['Hovel', 'Hovel']);
    await game.chooseEffect('Hovel');
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Hovel');

    expect(game.trash).toEqual(['Hovel', 'Hovel']);
    expect(game.currentPlayerName).toBe('Bob');
  });

  it('can be trashed when buying the last Province, before the game ends', async () => {
    const game = createGame();
    game.alice.setHand(['Hovel', 'Gold', 'Gold', 'Silver', 'Estate']);
    game.alice.setDeck(COPPERS);
    game.setPileSize('Province', 1);

    await game.start();
    await game.playAllTreasures();
    await game.buy('Province');
    await game.chooseEffect('Hovel');

    expect(game.trash).toEqual(['Hovel']);
    expect(game.isFinished).toBe(true);
    const aliceResult = game.gameResult?.playerResults.find((result) => result.playerName === 'Alice');
    // Province (6) + Estate (1)
    expect(aliceResult?.scoreReport.total).toBe(7);
  });

  it('is offered only once when Hunting Grounds gains 3 Estates and it is trashed on the first', async () => {
    const game = createGame({ kingdom: ['Hunting Grounds', 'Junk Dealer'] });
    game.alice.setHand(['Junk Dealer', 'Hunting Grounds', 'Hovel', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Junk Dealer');
    await game.chooseCard('Hunting Grounds');
    await game.chooseOption('Gain 3 Estates');
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Hovel');

    expect(game.trash).toEqual(['Hunting Grounds', 'Hovel']);
    expect(game.alice.discard).toEqual(['Estate', 'Estate', 'Estate']);
    game.expectDecision('treasurePhase', 'Alice');
  });

  it('is offered when gaining an Action-Victory card (Mill) or a Treasure-Victory card (Farm)', async () => {
    const game = createGame({ kingdom: ['Mill', 'Farm', 'Workshop'] });
    game.alice.setHand(['Workshop', 'Hovel', 'Hovel', 'Gold', 'Gold']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Workshop');
    await game.chooseCard('Mill', CardLocation.PILE);
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Hovel');
    // Keep the other Hovel for now
    await game.declineEffects();
    expect(game.trash).toEqual(['Hovel']);

    await game.playAllTreasures();
    await game.buy('Farm');
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Hovel');

    expect(game.trash).toEqual(['Hovel', 'Hovel']);
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Mill', 'Farm']));
  });

  it("is not offered when another player's Attacks make you gain a Curse or a Ruins", async () => {
    const game = createGame({ kingdom: ['Witch', 'Marauder'] });
    game.alice.setHand(['Witch', 'Marauder', 'Village', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Hovel', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Witch');
    await game.playAction('Marauder');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.bob.hand).toContain('Hovel');
    expect(game.bob.discard).toContain('Curse');
    expect(game.trash).toEqual([]);
  });

  it('can still be trashed after Watchtower trashes the Victory card that was gained', async () => {
    const game = createGame({ kingdom: ['Watchtower'] });
    game.alice.setHand(['Watchtower', 'Hovel', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.endActionPhase();
    await game.playAllTreasures();
    await game.buy('Estate');

    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(game.pending.optionalEffects.map((effect) => effect.effectName).sort()).toEqual(['Hovel', 'Watchtower']);
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Trash it');
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Hovel');

    expect(game.trash).toEqual(['Estate', 'Hovel']);
  });
});
