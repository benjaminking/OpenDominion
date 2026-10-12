import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { limbo, offered, revealMoat } from './baseGameHelpers';

const coppers = (n: number): string[] => Array<string>(n).fill('Copper');

describe('Bandit', () => {
  it('lets each target choose which non-Copper Treasure to trash, in turn order', async () => {
    const game = createGame({ kingdom: ['Bandit'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Bandit', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(['Silver', 'Gold', 'Estate']);
    const cara = game.player('Cara');
    cara.setDeck(['Copper', 'Estate', 'Silver']);

    await game.start();
    await game.playAction('Bandit');

    const decision = game.expectDecision('chooseCard', 'Bob');
    expect(decision.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Gold', 'Silver']);
    expect(decision.noneAllowed).toBe(false);
    await game.chooseCard('Gold');

    // Cara revealed no Treasure other than Copper: she discards both and trashes nothing
    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual(['Gold']);
    expect(game.bob.discard).toEqual(['Silver']);
    expect(game.bob.deck).toEqual(['Estate']);
    expect(cara.discard.sort()).toEqual(['Copper', 'Estate']);
    expect(cara.deck).toEqual(['Silver']);
    expect(game.alice.discard).toEqual(['Gold']);
  });

  it('trashes one of two identical Treasures and discards the other', async () => {
    const game = createGame({ kingdom: ['Bandit'] });
    game.alice.setHand(['Bandit', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(['Gold', 'Gold']);

    await game.start();
    await game.playAction('Bandit');
    if (game.pending.kind === 'chooseCard') {
      await game.chooseCard('Gold');
    }

    expect(game.trash).toEqual(['Gold']);
    expect(game.bob.discard).toEqual(['Gold']);
    expect(game.bob.deck).toEqual([]);
  });

  it('reveals only what the target has when they have fewer than 2 cards in deck and discard', async () => {
    const game = createGame({ kingdom: ['Bandit'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Bandit', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(['Silver']);
    const cara = game.player('Cara');
    cara.setHand(['Copper']);

    await game.start();
    await game.playAction('Bandit');

    // Bob's single Silver is trashed; Cara has nothing to reveal
    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual(['Silver']);
    expect(game.bob.deck).toEqual([]);
    expect(game.bob.discard).toEqual([]);
    expect(cara.hand).toEqual(['Copper']);
    expect(cara.discard).toEqual([]);
  });

  it('shuffles the discard pile in the middle of revealing', async () => {
    const game = createGame({ kingdom: ['Bandit'] });
    game.alice.setHand(['Bandit', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(['Copper']);
    game.bob.setDiscard(['Silver']);

    await game.start();
    await game.playAction('Bandit');

    expect(game.trash).toEqual(['Silver']);
    expect(game.bob.discard).toEqual(['Copper']);
    expect(game.bob.deck).toEqual([]);
  });

  it('still attacks when the Gold pile is empty', async () => {
    const game = createGame({ kingdom: ['Bandit'] });
    game.alice.setHand(['Bandit', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(['Silver', 'Estate']);
    game.setPileSize('Gold', 0);

    await game.start();
    await game.playAction('Bandit');

    expect(game.alice.discard).toEqual([]);
    expect(game.trash).toEqual(['Silver']);
    expect(game.bob.discard).toEqual(['Estate']);
  });

  it('trashes the Silver and discards the Copper when it reveals both', async () => {
    const game = createGame({ kingdom: ['Bandit'] });
    game.alice.setHand(['Bandit', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Estate']);
    game.bob.setDeck(['Copper', 'Silver', 'Gold']);

    await game.start();
    await game.playAction('Bandit');

    // No choice to make: Copper can't be trashed
    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual(['Silver']);
    expect(game.bob.discard).toEqual(['Copper']);
    expect(game.bob.deck).toEqual(['Gold']);
  });

  it("leaves no revealed card behind in the target's reveal zone, so each is counted once for scoring", async () => {
    const game = createGame({ kingdom: ['Bandit'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Bandit', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    // Bob: one non-Copper Treasure; Cara: two
    game.bob.setHand([]);
    game.bob.setDeck(['Estate', 'Silver']);
    const cara = game.player('Cara');
    cara.setHand([]);
    cara.setDeck(['Gold', 'Silver']);

    await game.start();
    await game.playAction('Bandit');
    await game.chooseCard('Gold');

    expect(game.trash.sort()).toEqual(['Gold', 'Silver']);
    expect(game.bob.discard).toEqual(['Estate']);
    expect(cara.discard).toEqual(['Silver']);
    expect(limbo(game.bob)).toEqual([]);
    expect(limbo(cara)).toEqual([]);
    expect(game.bob.score).toBe(1);
  });

  it('can trash a Treasure that is also a Victory card (Farm)', async () => {
    const game = createGame({ kingdom: ['Bandit', 'Farm'] });
    game.alice.setHand(['Bandit', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(['Farm', 'Estate']);

    await game.start();
    await game.playAction('Bandit');

    expect(game.trash).toEqual(['Farm']);
    expect(game.bob.discard).toEqual(['Estate']);
  });

  it('lets the target respond to the trashing of their Treasure with Market Square', async () => {
    const game = createGame({ kingdom: ['Bandit', 'Market Square'] });
    game.alice.setHand(['Bandit', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Market Square', 'Copper', 'Copper']);
    game.bob.setDeck(['Silver', 'Estate']);

    await game.start();
    await game.playAction('Bandit');
    // Market Square: when one of your cards is trashed, you may discard this from your hand to gain a Gold
    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Market Square');

    expect(game.trash).toEqual(['Silver']);
    expect(game.bob.hand).toEqual(['Copper', 'Copper']);
    expect(game.bob.discard.sort()).toEqual(['Estate', 'Gold', 'Market Square']);
  });

  it('attacks each target once per play when played twice by Throne Room, revealing 2 new cards each time', async () => {
    const game = createGame({ kingdom: ['Bandit', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Bandit', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(['Silver', 'Estate', 'Copper', 'Gold', 'Duchy']);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Bandit');

    expect(game.alice.discard).toEqual(['Gold', 'Gold']);
    expect(game.trash.sort()).toEqual(['Gold', 'Silver']);
    expect(game.bob.discard.sort()).toEqual(['Copper', 'Estate']);
    expect(game.bob.deck).toEqual(['Duchy']);
  });

  it('attacks a player who revealed Moat for its first play but not for its second, when played by Throne Room', async () => {
    const game = createGame({ kingdom: ['Bandit', 'Throne Room', 'Moat'] });
    game.alice.setHand(['Throne Room', 'Bandit', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Moat', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(['Silver', 'Estate', 'Gold']);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Bandit');
    await revealMoat(game, 'Bob');
    // Second play: Bob may reveal Moat again, but declines
    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.declineEffects();

    expect(game.trash).toEqual(['Silver']);
    expect(game.bob.discard).toEqual(['Estate']);
    expect(game.bob.deck).toEqual(['Gold']);
  });

  it('trashes any revealed Treasure other than Copper, whatever its other types, with 4 players', async () => {
    const game = createGame({
      kingdom: ['Bandit', 'Marauder', "Fool's Gold", 'Mill'],
      players: ['Alice', 'Bob', 'Cara', 'Dave'],
    });
    game.alice.setHand(['Bandit', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    // Coronet is an Action-Treasure, Fool's Gold a Treasure-Reaction, Mill an Action-Victory
    game.bob.setDeck(['Coronet', "Fool's Gold"]);
    const cara = game.player('Cara');
    cara.setDeck(['Spoils', 'Copper']);
    const dave = game.player('Dave');
    dave.setDeck(['Mill', 'Potion']);
    const spoilsBefore = game.pileSize('Spoils');

    await game.start();
    await game.playAction('Bandit');
    const decision = game.expectDecision('chooseCard', 'Bob');
    expect(offered(decision).sort()).toEqual(['Coronet', "Fool's Gold"]);
    await game.chooseCard("Fool's Gold");

    game.expectDecision('treasurePhase', 'Alice');
    // The trashed Spoils goes to the trash, not back to its pile
    expect(game.trash.sort()).toEqual(["Fool's Gold", 'Potion', 'Spoils']);
    expect(game.bob.discard).toEqual(['Coronet']);
    expect(cara.discard).toEqual(['Copper']);
    expect(dave.discard).toEqual(['Mill']);
    expect(game.pileSize('Spoils')).toBe(spoilsBefore);
  });

  it('gains its Gold before the Attack: Watchtower can trash it before anyone reveals', async () => {
    const game = createGame({ kingdom: ['Bandit', 'Watchtower'] });
    game.alice.setHand(['Bandit', 'Watchtower', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(['Silver', 'Estate']);

    await game.start();
    await game.playAction('Bandit');
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(game.bob.deck).toEqual(['Silver', 'Estate']);
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Trash it');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash.sort()).toEqual(['Gold', 'Silver']);
    expect(game.alice.discard).toEqual([]);
    expect(game.bob.discard).toEqual(['Estate']);
  });
});
