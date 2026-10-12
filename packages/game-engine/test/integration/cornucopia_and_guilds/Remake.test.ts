import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { createGame, GameHarness } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

const offeredNames = (game: GameHarness): string[] => game.pending.cardChoices.map((choice) => choice.card.name);

describe('Remake', () => {
  it('must trash a card from hand and gain a card costing exactly $1 more', async () => {
    const game = createGame({ kingdom: ['Remake'] });
    game.alice.setHand(['Remake', 'Estate', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Remake');
    expect(game.pending.noneAllowed).toBe(false);
    await game.chooseCard('Estate');
    expect(game.pending.noneAllowed).toBe(false);
    await game.chooseCard('Silver');
    expect(game.pending.noneAllowed).toBe(false);
    await game.chooseCard('Copper');

    // Nothing costs exactly $1
    expect(game.trash).toEqual(['Estate', 'Copper']);
    expect(game.alice.discard).toEqual(['Silver']);
    game.expectDecision('buyPhase', 'Alice');
  });

  it('with only one card in hand, trashes it and gains a card for it, then does nothing more', async () => {
    const game = createGame({ kingdom: ['Remake'] });
    game.alice.setHand(['Remake', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Remake');
    await game.chooseCard('Estate');
    await game.chooseCard('Silver');

    expect(game.trash).toEqual(['Estate']);
    expect(game.alice.discard).toEqual(['Silver']);
    game.expectDecision('buyPhase', 'Alice');
  });

  it('played twice by Throne Room, trashes and gains until the hand runs out', async () => {
    const game = createGame({ kingdom: ['Remake', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Remake', 'Estate', 'Estate', 'Silver']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Remake');
    await game.chooseCard('Estate');
    await game.chooseCard('Silver');
    await game.chooseCard('Estate');
    await game.chooseCard('Silver');
    // Second play: the old Silver ($3) becomes a $4
    await game.chooseCard('Silver', CardLocation.HAND);
    await game.chooseCard('Smithy');

    // The hand is empty for the fourth trash
    game.expectDecision('buyPhase', 'Alice');
    expect(game.trash).toEqual(['Estate', 'Estate', 'Silver']);
    expect(game.alice.discard).toEqual(['Silver', 'Silver', 'Smithy']);
  });

  it('can trash the same Fortress twice, since it returns to hand after the first trash', async () => {
    const game = createGame({ kingdom: ['Remake', 'Fortress'] });
    game.alice.setHand(['Remake', 'Fortress']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Remake');
    await game.chooseCard('Fortress');
    await game.chooseCard('Market');
    expect(game.alice.hand).toEqual(['Fortress']);
    await game.chooseCard('Fortress');
    await game.chooseCard('Festival');

    expect(game.alice.hand).toEqual(['Fortress']);
    expect(game.trash).toEqual([]);
    expect(game.alice.discard).toEqual(['Market', 'Festival']);
  });

  it('with Bridge in play, compares the reduced costs: an Estate ($1) becomes a $3 card, which costs $2', async () => {
    const game = createGame({ kingdom: ['Remake', 'Bridge'] });
    game.alice.setHand(['Village', 'Bridge', 'Remake', 'Estate', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Bridge');
    await game.playAction('Remake');
    await game.chooseCard('Estate');
    expect(offeredNames(game)).toEqual(expect.arrayContaining(['Silver', 'Village', 'Workshop']));
    expect(offeredNames(game)).not.toContain('Estate');
    expect(offeredNames(game)).not.toContain('Smithy');
    await game.chooseCard('Silver');

    // Copper still costs $0, so it becomes a card costing $1: a $2 card
    await game.chooseCard('Copper');
    expect(offeredNames(game)).toEqual(expect.arrayContaining(['Estate', 'Cellar']));
    expect(offeredNames(game)).not.toContain('Copper');
    expect(offeredNames(game)).not.toContain('Silver');
    await game.chooseCard('Estate');

    expect(game.trash.sort()).toEqual(['Copper', 'Estate']);
    expect(game.alice.discard).toEqual(['Silver', 'Estate']);
  });

  it('with costs reduced below $0 by two Bridges, an Estate costs $0, so it becomes a card costing $1', async () => {
    const game = createGame({ kingdom: ['Remake', 'Bridge', 'Throne Room'] });
    game.alice.setHand(['Village', 'Throne Room', 'Bridge', 'Remake', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Throne Room');
    await game.chooseCard('Bridge');
    await game.playAction('Remake');
    await game.chooseCard('Estate');

    // Silver ($3) costs $1; Estate ($2) costs $0 like Copper; Smithy ($4) costs $2
    expect(offeredNames(game)).toEqual(expect.arrayContaining(['Silver', 'Village']));
    expect(offeredNames(game)).not.toContain('Estate');
    expect(offeredNames(game)).not.toContain('Copper');
    expect(offeredNames(game)).not.toContain('Smithy');
    await game.chooseCard('Silver');
    expect(game.alice.discard).toEqual(['Silver']);
  });

  it('with Highway in play, a Smithy ($3) becomes a $5 card, which costs $4', async () => {
    const game = createGame({ kingdom: ['Remake', 'Highway'] });
    game.alice.setHand(['Highway', 'Remake', 'Smithy']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Highway');
    await game.playAction('Remake');
    await game.chooseCard('Smithy');

    expect(offeredNames(game)).toEqual(expect.arrayContaining(['Market', 'Duchy', 'Laboratory']));
    expect(offeredNames(game)).not.toContain('Smithy');
    expect(offeredNames(game)).not.toContain('Gold');
    await game.chooseCard('Market');
    expect(game.alice.discard).toEqual(['Market']);
  });

  it("played in the Buy phase by Coronet, uses Quarry's reduction for Action cards and Peddler's Buy-phase cost", async () => {
    const game = createGame({ kingdom: ['Remake', 'Quarry', 'Peddler'] });
    game.alice.setHand(['Quarry', 'Coronet', 'Remake', 'Smithy', 'Silver']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Quarry');
    await game.playTreasure('Coronet');
    await game.chooseCard('Remake');
    // Smithy ($4) is an Action, so it costs $2: gain a card costing exactly $3
    await game.chooseCard('Smithy');
    expect(offeredNames(game)).toEqual(expect.arrayContaining(['Silver', 'Market', 'Laboratory']));
    expect(offeredNames(game)).not.toContain('Village');
    expect(offeredNames(game)).not.toContain('Smithy');
    await game.chooseCard('Market');

    // Silver ($3) isn't an Action: gain a card costing exactly $4, such as Quarry. Smithy costs $2, and Peddler
    // costs $8 - $2 per Action in play (Coronet and Remake) - $2 (Quarry) = $2
    await game.chooseCard('Silver');
    expect(offeredNames(game)).toContain('Quarry');
    expect(offeredNames(game)).not.toContain('Smithy');
    expect(offeredNames(game)).not.toContain('Peddler');
    await game.chooseCard('Quarry');

    expect(game.trash.sort()).toEqual(['Silver', 'Smithy']);
    expect(game.alice.discard).toEqual(['Market', 'Quarry']);
  });

  it('played in the Buy phase by Coronet, can turn a Silver into a Peddler at its Buy-phase cost', async () => {
    const game = createGame({ kingdom: ['Remake', 'Peddler'] });
    game.alice.setHand(['Coronet', 'Remake', 'Silver', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Coronet');
    await game.chooseCard('Remake');
    // Coronet and Remake are Actions in play: Peddler costs $4
    expect(game.costOf('Peddler').coins).toBe(4);
    await game.chooseCard('Silver');
    expect(offeredNames(game)).toEqual(expect.arrayContaining(['Peddler', 'Smithy']));
    await game.chooseCard('Peddler');
    await game.chooseCard('Estate');
    await game.chooseCard('Silver');

    expect(game.alice.discard).toEqual(['Peddler', 'Silver']);
  });

  it('compares Potion costs: a $2P card becomes a $3P card, and a $3 card cannot become a $3P or $4P card', async () => {
    const game = createGame({ kingdom: ['Remake', 'University', 'Alchemist', 'Golem'] });
    game.alice.setHand(['Remake', 'University', 'Silver']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Remake');
    await game.chooseCard('University');
    expect(game.pending.prompt).toBe('Gain a card costing exactly $3P');
    expect(offeredNames(game)).toContain('Alchemist');
    expect(offeredNames(game)).not.toContain('Silver');
    expect(offeredNames(game)).not.toContain('Smithy');
    await game.chooseCard('Alchemist');

    await game.chooseCard('Silver');
    expect(offeredNames(game)).toEqual(expect.arrayContaining(['Smithy', 'Potion']));
    expect(offeredNames(game)).not.toContain('Golem');
    expect(offeredNames(game)).not.toContain('Alchemist');
    await game.chooseCard('Potion');

    expect(game.alice.discard).toEqual(['Alchemist', 'Potion']);
  });

  it('gaining a card that empties the third Supply pile ends the game only after the turn', async () => {
    const game = createGame({ kingdom: ['Remake'] });
    game.alice.setHand(['Remake', 'Estate', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.setPileSize('Village', 0);
    game.setPileSize('Smithy', 0);
    game.setPileSize('Silver', 1);

    await game.start();
    await game.playAction('Remake');
    await game.chooseCard('Estate');
    await game.chooseCard('Silver');
    expect(game.pileSize('Silver')).toBe(0);
    // Nothing costs exactly $1
    await game.chooseCard('Copper');

    expect(game.isFinished).toBe(false);
    game.expectDecision('buyPhase', 'Alice');
    await game.endTurn();
    expect(game.isFinished).toBe(true);
  });
});
