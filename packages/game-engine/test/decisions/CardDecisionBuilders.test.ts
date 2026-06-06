import {
  CardChoice,
  CardInfo,
  CardLocation,
  CardSelectionPurpose,
  CardType,
  ChoiceType,
  Expansion,
} from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { Card } from '../../src/card/Card';
import { CardCollection } from '../../src/card/CardCollection';
import { Cost } from '../../src/card/Cost';
import { CardEligibilityFunction } from '../../src/CardEligibilityFunction';
import { CardChoiceBuilder } from '../../src/decisions/CardChoiceBuilder';
import { CardMultiChoiceBuilder } from '../../src/decisions/CardMultiChoiceBuilder';
import { CardSelectionLocation } from '../../src/decisions/CardSelectionLocation';
import { GameMessageBroadcaster } from '../../src/messaging/GameMessageBroadcaster';
import { InstructionExecutor } from '../../src/players/InstructionExecutor';
import { Player } from '../../src/players/Player';
import { SharedGameState } from '../../src/game-state/SharedGameState';
import { exactlyNChecked } from '../../src/StandardNumberEligibilityFunctions';

class TestCard extends Card {}

const createSharedGameStateMock = () => {
  return {
    cost: vi.fn((card) => card.getOriginalCost()),
    registerEffectTrigger: vi.fn(),
  } as unknown as SharedGameState;
};

const createCard = (overrides?: Partial<CardInfo>): Card => {
  const cardInfo: CardInfo = {
    name: 'Test Card',
    text: 'Test card text',
    font_size: 'small',
    cost: Cost.Simple(3).toCommonCost(),
    types: [CardType.ACTION],
    expansion: Expansion.TESTING,
    mechanics: [],
    ...overrides,
  };
  return new TestCard(createSharedGameStateMock(), cardInfo);
};

const createBuilderContext = (name = 'Alice') => {
  const sendStatus = vi.fn();
  const messageBroadcaster = {
    sendStatus,
  } as unknown as GameMessageBroadcaster;
  const instructionExecutor = {
    getEligibleSupplyChoices: vi.fn(),
    getEligibleCardChoices: vi.fn(),
    getCardByMetadata: vi.fn(),
    getCardsByMetadata: vi.fn(),
    getAllExtraCards: vi.fn(() => CardCollection.emptyCollection()),
    forceFullBroadcastOfDiscard: vi.fn(),
  } as unknown as InstructionExecutor;
  const decisionService = {
    chooseCard: vi.fn(),
    chooseCards: vi.fn(),
  };
  const player = {
    getName: vi.fn(() => name),
    getInstructionExecutor: vi.fn(() => instructionExecutor),
    getDecisionService: vi.fn(() => decisionService),
    getGame: vi.fn(() => ({
      getMessageBroadcaster: vi.fn(() => messageBroadcaster),
    })),
  } as unknown as Player;

  return { decisionService, instructionExecutor, player, sendStatus };
};

describe('CardChoiceBuilder', () => {
  it('chooses a supply card using the configured prompt, name, purpose, and none option', async () => {
    const { decisionService, instructionExecutor, player, sendStatus } = createBuilderContext();
    const selectedCard = createCard({ name: 'Silver', types: [CardType.TREASURE] });
    selectedCard.setId('silver-1');
    selectedCard.setLocation(CardLocation.PILE);
    const eligibility = new CardEligibilityFunction(() => true);
    const supplyChoices: CardChoice[] = [
      {
        type: ChoiceType.Card,
        card: selectedCard.getMetadata(),
      },
    ];
    vi.mocked(instructionExecutor.getEligibleSupplyChoices).mockReturnValue(supplyChoices);
    vi.mocked(decisionService.chooseCard).mockResolvedValue(supplyChoices[0]);
    vi.mocked(instructionExecutor.getCardByMetadata).mockReturnValue(selectedCard);
    const builder = new CardChoiceBuilder(player, 'Gain a treasure');

    const chosenCard = await builder
      .setName('gain-card')
      .to(CardSelectionPurpose.GAIN)
      .from(CardSelectionLocation.SUPPLY)
      .whereCardIs(eligibility)
      .allowNoneOption()
      .choose();

    expect(instructionExecutor.getEligibleSupplyChoices).toHaveBeenCalledWith(eligibility);
    expect(decisionService.chooseCard).toHaveBeenCalledWith(
      'Gain a treasure',
      CardSelectionPurpose.GAIN,
      'gain-card',
      supplyChoices,
      { type: ChoiceType.None },
    );
    expect(chosenCard).toBe(selectedCard);
    expect(sendStatus).toHaveBeenCalledTimes(2);
  });

  it('chooses from non-supply locations and passes the aggregated eligible locations through', async () => {
    const { decisionService, instructionExecutor, player, sendStatus } = createBuilderContext();
    const selectedCard = createCard({ name: 'Village' });
    selectedCard.setId('village-1');
    selectedCard.setLocation(CardLocation.HAND);
    const eligibility = new CardEligibilityFunction((card) => card.hasType(CardType.ACTION));
    const areaChoices: CardChoice[] = [
      {
        type: ChoiceType.Card,
        card: selectedCard.getMetadata(),
      },
    ];
    vi.mocked(instructionExecutor.getEligibleCardChoices).mockReturnValue(areaChoices);
    vi.mocked(decisionService.chooseCard).mockResolvedValue(areaChoices[0]);
    vi.mocked(instructionExecutor.getCardByMetadata).mockReturnValue(selectedCard);
    const builder = new CardChoiceBuilder(player);

    const chosenCard = await builder
      .setPrompt('Choose an action card')
      .setName('action-card')
      .to(CardSelectionPurpose.TRASH)
      .from(CardLocation.HAND)
      .from(CardLocation.IN_PLAY)
      .whereCardIs(eligibility)
      .choose();

    expect(instructionExecutor.getEligibleCardChoices).toHaveBeenCalledWith(
      new Set([CardLocation.HAND, CardLocation.IN_PLAY]),
      eligibility,
    );
    expect(decisionService.chooseCard).toHaveBeenCalledWith(
      'Choose an action card',
      CardSelectionPurpose.TRASH,
      'action-card',
      areaChoices,
    );
    expect(chosenCard).toBe(selectedCard);
    expect(sendStatus).toHaveBeenCalledTimes(2);
  });

  it('returns none or impossible immediately when no choices are available', async () => {
    const noneContext = createBuilderContext();
    vi.mocked(noneContext.instructionExecutor.getEligibleSupplyChoices).mockReturnValue([]);

    const noneChoice = await new CardChoiceBuilder(noneContext.player)
      .from(CardSelectionLocation.SUPPLY)
      .allowNoneOption()
      .choose();

    expect(noneChoice).toEqual({ type: ChoiceType.None });
    expect(noneContext.decisionService.chooseCard).not.toHaveBeenCalled();

    const impossibleContext = createBuilderContext();
    vi.mocked(impossibleContext.instructionExecutor.getEligibleCardChoices).mockReturnValue([]);

    const impossibleChoice = await new CardChoiceBuilder(impossibleContext.player).from(CardLocation.HAND).choose();

    expect(impossibleChoice).toEqual({ type: ChoiceType.Impossible });
    expect(impossibleContext.decisionService.chooseCard).not.toHaveBeenCalled();
  });

  it('rejects a card choice response whose metadata cannot be resolved', async () => {
    const { decisionService, instructionExecutor, player } = createBuilderContext();
    const selectedCard = createCard({ name: 'Gold', types: [CardType.TREASURE] });
    selectedCard.setId('gold-1');
    const unresolvedChoice: CardChoice = {
      type: ChoiceType.Card,
      card: selectedCard.getMetadata(),
    };
    vi.mocked(instructionExecutor.getEligibleSupplyChoices).mockReturnValue([unresolvedChoice]);
    vi.mocked(decisionService.chooseCard).mockResolvedValue(unresolvedChoice);
    vi.mocked(instructionExecutor.getCardByMetadata).mockReturnValue(undefined);

    await expect(new CardChoiceBuilder(player).from(CardSelectionLocation.SUPPLY).choose()).rejects.toThrow(
      'Decision service returned an invalid card',
    );
  });

  it('auto-selects a single eligible card when choosing from a set and none is not allowed', async () => {
    const { decisionService, instructionExecutor, player } = createBuilderContext();
    const selectedCard = createCard({ name: 'Border Village' });
    selectedCard.setId('border-village-1');
    selectedCard.setLocation(CardLocation.REVEAL_LIMBO);
    const sourceSet = CardCollection.fromCards([selectedCard]);

    vi.mocked(instructionExecutor.getCardByMetadata).mockReturnValue(selectedCard);

    const chosenCard = await new CardChoiceBuilder(player).from(sourceSet).choose();

    expect(chosenCard).toBe(selectedCard);
    expect(decisionService.chooseCard).not.toHaveBeenCalled();
  });

  it('auto-selects when all eligible cards in a set share the same name and none is not allowed', async () => {
    const { decisionService, instructionExecutor, player } = createBuilderContext();
    const firstSilver = createCard({ name: 'Silver', types: [CardType.TREASURE] });
    const secondSilver = createCard({ name: 'Silver', types: [CardType.TREASURE] });
    firstSilver.setId('silver-1');
    secondSilver.setId('silver-2');
    firstSilver.setLocation(CardLocation.REVEAL_LIMBO);
    secondSilver.setLocation(CardLocation.REVEAL_LIMBO);
    const sourceSet = CardCollection.fromCards([firstSilver, secondSilver]);

    vi.mocked(instructionExecutor.getCardByMetadata).mockImplementation((metadata) =>
      metadata.id === firstSilver.getId() ? firstSilver : secondSilver,
    );

    const chosenCard = await new CardChoiceBuilder(player).from(sourceSet).choose();

    expect(chosenCard).toBe(firstSilver);
    expect(decisionService.chooseCard).not.toHaveBeenCalled();
  });

  it('forces a full discard broadcast before prompting for choices from discard', async () => {
    const { decisionService, instructionExecutor, player } = createBuilderContext();
    const discardCard = createCard({ name: 'Silver', types: [CardType.TREASURE] });
    discardCard.setId('silver-discard-1');
    discardCard.setLocation(CardLocation.DISCARD);
    const discardChoices: CardChoice[] = [
      {
        type: ChoiceType.Card,
        card: discardCard.getMetadata(),
      },
    ];
    vi.mocked(instructionExecutor.getEligibleCardChoices).mockReturnValue(discardChoices);
    vi.mocked(decisionService.chooseCard).mockResolvedValue(discardChoices[0]);
    vi.mocked(instructionExecutor.getCardByMetadata).mockReturnValue(discardCard);

    const chosenCard = await new CardChoiceBuilder(player)
      .from(CardLocation.DISCARD)
      .whereCardIs(new CardEligibilityFunction(() => true))
      .choose();

    expect(chosenCard).toBe(discardCard);
    expect(instructionExecutor.forceFullBroadcastOfDiscard).toHaveBeenCalledTimes(1);
  });
});

describe('CardMultiChoiceBuilder', () => {
  it('chooses multiple cards using the configured locations and allowed counts', async () => {
    const { decisionService, instructionExecutor, player, sendStatus } = createBuilderContext();
    const firstCard = createCard({ name: 'Village' });
    firstCard.setId('village-1');
    firstCard.setLocation(CardLocation.HAND);
    const secondCard = createCard({ name: 'Market' });
    secondCard.setId('market-1');
    secondCard.setLocation(CardLocation.IN_PLAY);
    const eligibility = new CardEligibilityFunction((card) => card.hasType(CardType.ACTION));
    const cardChoices: CardChoice[] = [
      {
        type: ChoiceType.Card,
        card: firstCard.getMetadata(),
      },
      {
        type: ChoiceType.Card,
        card: secondCard.getMetadata(),
      },
    ];
    const selectedCards = CardCollection.fromCards([firstCard, secondCard]);
    vi.mocked(instructionExecutor.getEligibleCardChoices).mockReturnValue(cardChoices);
    vi.mocked(decisionService.chooseCards).mockResolvedValue({
      type: ChoiceType.MultiCard,
      cards: [firstCard.getMetadata(), secondCard.getMetadata()],
    });
    vi.mocked(instructionExecutor.getCardsByMetadata).mockReturnValue(selectedCards);
    const builder = new CardMultiChoiceBuilder(player, 'Choose action cards');

    const chosenCards = await builder
      .setName('action-cards')
      .to(CardSelectionPurpose.DISCARD)
      .from(CardLocation.HAND)
      .from(CardLocation.IN_PLAY)
      .whereCardIs(eligibility)
      .whereNumCardsIs(exactlyNChecked(2))
      .choose();

    expect(instructionExecutor.getEligibleCardChoices).toHaveBeenCalledWith(
      new Set([CardLocation.HAND, CardLocation.IN_PLAY]),
      eligibility,
    );
    expect(decisionService.chooseCards).toHaveBeenCalledWith(
      'Choose action cards',
      CardSelectionPurpose.DISCARD,
      'action-cards',
      [2],
      cardChoices,
    );
    expect(chosenCards).toBe(selectedCards);
    expect(sendStatus).toHaveBeenCalledTimes(2);
  });

  it('uses the default prompt and any-number selection when no overrides are configured', async () => {
    const { decisionService, instructionExecutor, player } = createBuilderContext();
    vi.mocked(instructionExecutor.getEligibleCardChoices).mockReturnValue([]);
    const selectedCards = CardCollection.emptyCollection();
    vi.mocked(decisionService.chooseCards).mockResolvedValue({
      type: ChoiceType.MultiCard,
      cards: [],
    });
    vi.mocked(instructionExecutor.getCardsByMetadata).mockReturnValue(selectedCards);

    const chosenCards = await new CardMultiChoiceBuilder(player).from(CardLocation.HAND).choose();

    expect(decisionService.chooseCards).toHaveBeenCalledWith(
      'Choose a card',
      CardSelectionPurpose.GAIN,
      'name',
      Array.from({ length: 20 }, (_, index) => index),
      [],
    );
    expect(chosenCards).toBe(selectedCards);
  });
});
