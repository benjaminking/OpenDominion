import { CardType } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { Card } from '../../../src/card/Card';
import { CardCollection } from '../../../src/card/CardCollection';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Knights } from '../../../src/cards/dark_ages/Knights';
import { SirBailey } from '../../../src/cards/dark_ages/SirBailey';
import { SirDestry } from '../../../src/cards/dark_ages/SirDestry';
import { SirMartin } from '../../../src/cards/dark_ages/SirMartin';
import { SirMichael } from '../../../src/cards/dark_ages/SirMichael';
import { SirVander } from '../../../src/cards/dark_ages/SirVander';
import { Forge } from '../../../src/cards/prosperity/Forge';
import { InstructionExecutor } from '../../../src/players/InstructionExecutor';
import { CardHarness, createCardHarness } from '../testHarness';

// Minimal Knight whose only effect is the shared Knight attack.
class TestKnight extends Knights {
  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.performAttack(this, this.knightAttack.bind(this));
  }
}

const withId = <T extends Card>(card: T, id: string): T => {
  card.setId(id);
  return card;
};

const idsOf = (cards: CardCollection): string[] => cards.asCardArray().map((card) => card.getId());

// Cards are listed top-first.
const stackDeck = (harness: CardHarness, cards: Card[]): void => {
  for (const card of [...cards].reverse()) {
    harness.addToDeck(card);
  }
};

const setUpAttack = () => {
  const testHarness = createCardHarness();
  const targetHarness = createCardHarness();
  const knight = withId(new TestKnight(testHarness.sharedGameState), 'knight-in-play');
  testHarness.addToInPlay(knight);
  testHarness.routeAttacksTo(targetHarness);
  return { testHarness, targetHarness, knight };
};

describe('Knights', () => {
  it('every Sir is an Action-Attack-Knight from the Knights pile', () => {
    const testHarness = createCardHarness();
    const sirs = [
      new SirBailey(testHarness.sharedGameState),
      new SirDestry(testHarness.sharedGameState),
      new SirMartin(testHarness.sharedGameState),
      new SirMichael(testHarness.sharedGameState),
      new SirVander(testHarness.sharedGameState),
    ];

    for (const sir of sirs) {
      expect(sir.hasType(CardType.ACTION)).toBe(true);
      expect(sir.hasType(CardType.ATTACK)).toBe(true);
      expect(sir.hasType(CardType.KNIGHT)).toBe(true);
      expect(sir.getPileName()).toBe('Knights');
    }
  });

  it('attack reveals the top 2 cards and trashes the only one costing $3-$6', async () => {
    const { testHarness, targetHarness, knight } = setUpAttack();
    const silver = withId(new Silver(targetHarness.sharedGameState), 'silver-target-deck');
    const copper = withId(new Copper(targetHarness.sharedGameState), 'copper-target-deck');
    const estate = withId(new Estate(targetHarness.sharedGameState), 'estate-target-deck');
    stackDeck(targetHarness, [silver, copper, estate]);

    await knight.play(testHarness.executor);

    expect(idsOf(targetHarness.sharedTrash)).toEqual(['silver-target-deck']);
    expect(idsOf(targetHarness.deck)).toEqual(['estate-target-deck']);
    expect(idsOf(testHarness.inPlay)).toEqual(['knight-in-play']);
    expect(testHarness.sharedTrash.size()).toBe(0);
  });

  it('attack discards the revealed card that is not trashed', async () => {
    const { testHarness, targetHarness, knight } = setUpAttack();
    const silver = withId(new Silver(targetHarness.sharedGameState), 'silver-target-deck');
    const copper = withId(new Copper(targetHarness.sharedGameState), 'copper-target-deck');
    stackDeck(targetHarness, [silver, copper]);

    await knight.play(testHarness.executor);

    expect(idsOf(targetHarness.discard)).toEqual(['copper-target-deck']);
  });

  it('attack lets the target choose which eligible card to trash ($3 and $6 are both eligible)', async () => {
    const { testHarness, targetHarness, knight } = setUpAttack();
    const silver = withId(new Silver(targetHarness.sharedGameState), 'silver-target-deck');
    const gold = withId(new Gold(targetHarness.sharedGameState), 'gold-target-deck');
    stackDeck(targetHarness, [silver, gold]);

    targetHarness.pickCard(gold);
    await knight.play(testHarness.executor);

    expect(idsOf(targetHarness.sharedTrash)).toEqual(['gold-target-deck']);
    expect(targetHarness.deck.size()).toBe(0);
  });

  it('attack trashes nothing when no revealed card costs $3-$6 ($2 and $7 are not eligible)', async () => {
    const { testHarness, targetHarness, knight } = setUpAttack();
    const estate = withId(new Estate(targetHarness.sharedGameState), 'estate-target-deck');
    const forge = withId(new Forge(targetHarness.sharedGameState), 'forge-target-deck');
    stackDeck(targetHarness, [estate, forge]);

    await knight.play(testHarness.executor);

    expect(targetHarness.sharedTrash.size()).toBe(0);
    expect(targetHarness.deck.size()).toBe(0);
    expect(targetHarness.decisionService.chooseCard).not.toHaveBeenCalled();
  });

  it('attack discards both revealed cards when neither costs $3-$6', async () => {
    const { testHarness, targetHarness, knight } = setUpAttack();
    const estate = withId(new Estate(targetHarness.sharedGameState), 'estate-target-deck');
    const forge = withId(new Forge(targetHarness.sharedGameState), 'forge-target-deck');
    stackDeck(targetHarness, [estate, forge]);

    await knight.play(testHarness.executor);

    expect(idsOf(targetHarness.discard).sort()).toEqual(['estate-target-deck', 'forge-target-deck']);
  });

  it('attack trashes one of two identical eligible cards without asking', async () => {
    const { testHarness, targetHarness, knight } = setUpAttack();
    const silverA = withId(new Silver(targetHarness.sharedGameState), 'silver-target-deck-a');
    const silverB = withId(new Silver(targetHarness.sharedGameState), 'silver-target-deck-b');
    stackDeck(targetHarness, [silverA, silverB]);

    await knight.play(testHarness.executor);

    expect(targetHarness.sharedTrash.size()).toBe(1);
    expect(targetHarness.sharedTrash.asCardArray()[0].getName()).toBe('Silver');
    expect(targetHarness.decisionService.chooseCard).not.toHaveBeenCalled();
  });

  it('attacking Knight trashes itself when its attack trashes a Knight', async () => {
    const { testHarness, targetHarness, knight } = setUpAttack();
    const targetKnight = withId(new SirMartin(targetHarness.sharedGameState), 'sir-martin-target-deck');
    const copper = withId(new Copper(targetHarness.sharedGameState), 'copper-target-deck');
    stackDeck(targetHarness, [targetKnight, copper]);

    await knight.play(testHarness.executor);

    expect(idsOf(targetHarness.sharedTrash)).toEqual(['sir-martin-target-deck']);
    expect(testHarness.inPlay.size()).toBe(0);
    expect(idsOf(testHarness.sharedTrash)).toEqual(['knight-in-play']);
  });

  it('attacking Knight stays in play when a revealed Knight is not the card trashed', async () => {
    const { testHarness, targetHarness, knight } = setUpAttack();
    const targetKnight = withId(new SirMartin(targetHarness.sharedGameState), 'sir-martin-target-deck');
    const gold = withId(new Gold(targetHarness.sharedGameState), 'gold-target-deck');
    stackDeck(targetHarness, [targetKnight, gold]);

    targetHarness.pickCard(gold);
    await knight.play(testHarness.executor);

    expect(idsOf(targetHarness.sharedTrash)).toEqual(['gold-target-deck']);
    expect(idsOf(testHarness.inPlay)).toEqual(['knight-in-play']);
    expect(testHarness.sharedTrash.size()).toBe(0);
  });

  it('attack reshuffles the target discard pile when the deck has fewer than 2 cards', async () => {
    const { testHarness, targetHarness, knight } = setUpAttack();
    const copper = withId(new Copper(targetHarness.sharedGameState), 'copper-target-deck');
    const silver = withId(new Silver(targetHarness.sharedGameState), 'silver-target-discard');
    targetHarness.addToDeck(copper);
    targetHarness.addToDiscard(silver);

    await knight.play(testHarness.executor);

    expect(idsOf(targetHarness.sharedTrash)).toEqual(['silver-target-discard']);
    expect(targetHarness.deck.size()).toBe(0);
  });

  it('attack does nothing to a target with no cards in deck or discard', async () => {
    const { testHarness, targetHarness, knight } = setUpAttack();

    await knight.play(testHarness.executor);

    expect(targetHarness.sharedTrash.size()).toBe(0);
    expect(targetHarness.discard.size()).toBe(0);
    expect(idsOf(testHarness.inPlay)).toEqual(['knight-in-play']);
  });

  it('attack hits each other player', async () => {
    const testHarness = createCardHarness();
    const firstTarget = createCardHarness();
    const secondTarget = createCardHarness();
    const knight = withId(new TestKnight(testHarness.sharedGameState), 'knight-in-play');
    testHarness.addToInPlay(knight);
    testHarness.routeAttacksTo(firstTarget, secondTarget);
    firstTarget.addToDeck(withId(new Silver(firstTarget.sharedGameState), 'silver-first-target'));
    secondTarget.addToDeck(withId(new Gold(secondTarget.sharedGameState), 'gold-second-target'));

    await knight.play(testHarness.executor);

    expect(idsOf(firstTarget.sharedTrash)).toEqual(['silver-first-target']);
    expect(idsOf(secondTarget.sharedTrash)).toEqual(['gold-second-target']);
  });
});
