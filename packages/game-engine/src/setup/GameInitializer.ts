import { CardInfoLookup } from '@dominion/card-info';
import { CardType, Expansion, GameResult, Mechanic, PileCategory } from '@dominion/common';

import { Card } from '../card/Card';
import { CardFactory } from '../card/CardFactory';
import { Game } from '../Game';
import { PileFactory } from '../piles/PileFactory';
import { PlayerSpecification } from '../players';
import { KingdomChooser } from './KingdomChooser';
import { StartingDeckConfigurationBuilder } from './StartingDeckConfigurationBuilder';
import { PileSpecification } from './PileSpecification';
import { Pile } from '../piles/Pile';
import { anyKingdomPileSpecification } from './StandardPileSpecifications';
import { SpecialPileLookup, SpecialPileType } from '../piles/SpecialPiles';

export interface GameInitializerOptions {
  useColoniesPlatinum?: boolean;
  useShelters?: boolean;
}

export class GameInitializer {
  private static readonly DEFAULT_COPPER_PILE_SIZE: number = 56;
  private static readonly DEFAULT_SILVER_PILE_SIZE: number = 40;
  private static readonly DEFAULT_GOLD_PILE_SIZE: number = 30;
  private static readonly DEFAULT_PLATINUM_PILE_SIZE: number = 12;
  private static readonly DEFAULT_POTION_PILE_SIZE: number = 16;
  private static readonly DEFAULT_TWO_PLAYER_VICTORY_PILE_SIZE: number = 8;
  private static readonly DEFAULT_THREE_PLAYER_VICTORY_PILE_SIZE: number = 12;
  private static readonly DEFAULT_KINGDOM_PILE_SIZE: number = 10;

  private readonly game: Game;
  private readonly startingDeckConfigurationBuilder: StartingDeckConfigurationBuilder =
    new StartingDeckConfigurationBuilder();
  private readonly pileFactory: PileFactory;
  private readonly kingdomChooser: KingdomChooser;
  private readonly specialPileLookup: SpecialPileLookup = new SpecialPileLookup();

  public constructor(
    private readonly players: PlayerSpecification[],
    private readonly requiredCardNames: string[],
    private readonly options: GameInitializerOptions = {},
  ) {
    this.game = new Game(this.players);
    this.game.choosePlayerOrder();
    this.initializeGameState();
    this.pileFactory = new PileFactory(this.game.getGameState(), this.game.getMessageBroadcaster());
    this.kingdomChooser = new KingdomChooser(new CardFactory(this.game.getGameState()), this.requiredCardNames);
  }

  protected initializeGameState(): void {
    this.generateKingdomCards();
    this.addBasicTreasuresToSupply();
    this.addBasicVictoryCardsToSupply();
    for (const player of this.game.getPlayers()) {
      player.calculateScore();
    }
    this.createInitialDecks();
  }

  protected generateKingdomCards(): void {
    while (this.kingdomChooser.hasMoreKingdomCards()) {
      const randomizer = this.kingdomChooser.selectMatchingRandomizer(anyKingdomPileSpecification);
      if (randomizer === undefined) {
        break;
      }
      const pileSize = this.determineKingdomPileSize(randomizer);
      this.addKingdomPile(randomizer, pileSize);
    }
    this.performKingdomLevelSetup();
  }

  public addPile(pileSpecification: PileSpecification): Pile | undefined {
    const randomizer: Card | undefined = this.kingdomChooser.selectMatchingRandomizer(pileSpecification);
    if (randomizer === undefined) {
      return undefined;
    }
    const pileSize = this.determineKingdomPileSize(randomizer);

    this.addKingdomPile(randomizer, pileSize);
    this.handleCardMechanics(randomizer);
    this.handleInitializationSetupRules(randomizer);
  }

  private determineKingdomPileSize(randomizer: Card): number {
    if (!randomizer.hasType(CardType.VICTORY)) {
      return GameInitializer.DEFAULT_KINGDOM_PILE_SIZE;
    }

    return this.determineVictoryPileSize();
  }

  private determineVictoryPileSize(): number {
    if (this.players.length >= 3) {
      return GameInitializer.DEFAULT_THREE_PLAYER_VICTORY_PILE_SIZE;
    }
    return GameInitializer.DEFAULT_TWO_PLAYER_VICTORY_PILE_SIZE;
  }

  private determineCursePileSize(): number {
    return (this.players.length - 1) * 10;
  }

  private addKingdomPile(randomizer: Card, pileSize: number): Pile {
    const pile: Pile = this.pileFactory.createPile(
      CardInfoLookup.lookUpCardInfo(randomizer.getPileName()),
      pileSize,
      new Set<PileCategory>([PileCategory.KINGDOM, PileCategory.SUPPLY]),
    );
    this.game
      .getGameState()
      .piles.addKingdomPile(
        pile
    );
    return pile;
  }

  // move the details of standard initialization to Piles
  protected addBasicTreasuresToSupply(): void {
    const pileFactory: PileFactory = new PileFactory(this.game.getGameState(), this.game.getMessageBroadcaster());
    this.game
      .getGameState()
      .piles.addBasicTreasurePile(
        pileFactory.createPile(
          CardInfoLookup.lookUpCardInfo('Copper'),
          GameInitializer.DEFAULT_COPPER_PILE_SIZE,
          new Set<PileCategory>([PileCategory.BASIC_TREASURE, PileCategory.SUPPLY]),
        ),
      );
    this.game
      .getGameState()
      .piles.addBasicTreasurePile(
        pileFactory.createPile(
          CardInfoLookup.lookUpCardInfo('Silver'),
          GameInitializer.DEFAULT_SILVER_PILE_SIZE,
          new Set<PileCategory>([PileCategory.BASIC_TREASURE, PileCategory.SUPPLY]),
        ),
      );
    this.game
      .getGameState()
      .piles.addBasicTreasurePile(
        pileFactory.createPile(
          CardInfoLookup.lookUpCardInfo('Gold'),
          GameInitializer.DEFAULT_GOLD_PILE_SIZE,
          new Set<PileCategory>([PileCategory.BASIC_TREASURE, PileCategory.SUPPLY]),
        ),
      );
  }

  protected addBasicVictoryCardsToSupply(): void {
    const pileFactory: PileFactory = new PileFactory(this.game.getGameState(), this.game.getMessageBroadcaster());
    const victoryPileSize = this.determineVictoryPileSize();
    this.game
      .getGameState()
      .piles.addBasicVictoryPile(
        pileFactory.createPile(
          CardInfoLookup.lookUpCardInfo('Estate'),
          victoryPileSize,
          new Set<PileCategory>([PileCategory.BASIC_VICTORY, PileCategory.SUPPLY]),
        ),
      );
    this.game
      .getGameState()
      .piles.addBasicVictoryPile(
        pileFactory.createPile(
          CardInfoLookup.lookUpCardInfo('Duchy'),
          victoryPileSize,
          new Set<PileCategory>([PileCategory.BASIC_VICTORY, PileCategory.SUPPLY]),
        ),
      );
    this.game
      .getGameState()
      .piles.addBasicVictoryPile(
        pileFactory.createPile(
          CardInfoLookup.lookUpCardInfo('Province'),
          victoryPileSize,
          new Set<PileCategory>([PileCategory.BASIC_VICTORY, PileCategory.SUPPLY]),
        ),
      );

    const cursePileSize = this.determineCursePileSize();
    this.game
      .getGameState()
      .piles.addBasicVictoryPile(
        pileFactory.createPile(
          CardInfoLookup.lookUpCardInfo('Curse'),
          cursePileSize,
          new Set<PileCategory>([PileCategory.BASIC_VICTORY, PileCategory.SUPPLY]),
        ),
      );
  }

  private handleCardMechanics(randomizer: Card): void {
    this.game.getGameState().registerCardMechanics(randomizer);
    if (randomizer.usesMechanic(Mechanic.POTIONS)) {
      this.addPotionsToSupply();
    }
    if (randomizer.usesMechanic(Mechanic.REWARDS)) {
      this.addSpecialPile(SpecialPileType.REWARDS);
    }
  }

  private addSpecialPile(specialPileType: SpecialPileType) {
    const specialPileSpecification = this.specialPileLookup.lookUpSpecialPile(specialPileType);
    const specialPile: Pile = this.pileFactory.createSpecialPile(specialPileSpecification);
    if (specialPileSpecification.pileCategories.has(PileCategory.KINGDOM)) {
      this.game
        .getGameState()
        .piles.addKingdomPile(
          specialPile
      );
    }
    else if (specialPileSpecification.pileCategories.has(PileCategory.SUPPLY) {
      this.game
        .getGameState()
        .piles.addNonKingdomSupplyPile(
          specialPile
      );
    }
    else if (specialPileSpecification.pileCategories.has(PileCategory.NON_SUPPLY)) {
      this.game
        .getGameState()
        .piles.addNonSupplyPile(
          specialPile
      );
    }
  }

  private handleInitializationSetupRules(randomizer: Card): void {
    while (randomizer.getSetupRules().hasAnyGameInitializationSetupRules()) {
      randomizer.getSetupRules().getNextGameInitializationSetupRule().applySetupRule(this);
    }
  }

  public replaceCardsInPiles(cardName: string, replacementCardName: string): void {
    this.game.getGameState().replaceCardsInPiles(cardName, replacementCardName);
  }

  private addPotionsToSupply(): void {
    const pileFactory: PileFactory = new PileFactory(this.game.getGameState(), this.game.getMessageBroadcaster());
    this.game
      .getGameState()
      .piles.addBasicTreasurePile(
        pileFactory.createPile(
          CardInfoLookup.lookUpCardInfo('Potion'),
          GameInitializer.DEFAULT_POTION_PILE_SIZE,
          new Set<PileCategory>([PileCategory.BASIC_TREASURE, PileCategory.SUPPLY]),
        ),
      );
  }

  private performKingdomLevelSetup() {
    if (this.arePlatinumAndColonyRequired()) {
      this.addPlatinumAndColonyToSupply();
    }
    if (this.areSheltersRequired()) {
      this.addSheltersToStartingDecks();
    }
    this.kingdomChooser.applyGameStateSetupRules(this.game.getGameState());
  }

  private arePlatinumAndColonyRequired(): boolean {
    if (typeof this.options.useColoniesPlatinum === 'boolean') {
      return this.options.useColoniesPlatinum;
    }
    return Math.random() < this.kingdomChooser.getProportionFromExpansion(Expansion.PROSPERITY);
  }

  private addPlatinumAndColonyToSupply(): void {
    const pileFactory: PileFactory = new PileFactory(this.game.getGameState(), this.game.getMessageBroadcaster());
    const victoryPileSize = this.determineVictoryPileSize();
    this.game
      .getGameState()
      .piles.addBasicVictoryPile(
        pileFactory.createPile(
          CardInfoLookup.lookUpCardInfo('Colony'),
          victoryPileSize,
          new Set<PileCategory>([PileCategory.BASIC_VICTORY, PileCategory.SUPPLY]),
        ),
      );
    this.game
      .getGameState()
      .piles.addBasicTreasurePile(
        pileFactory.createPile(
          CardInfoLookup.lookUpCardInfo('Platinum'),
          GameInitializer.DEFAULT_PLATINUM_PILE_SIZE,
          new Set<PileCategory>([PileCategory.BASIC_TREASURE, PileCategory.SUPPLY]),
        ),
      );
  }

  private areSheltersRequired(): boolean {
    if (typeof this.options.useShelters === 'boolean') {
      return this.options.useShelters;
    }
    return Math.random() < this.kingdomChooser.getProportionFromExpansion(Expansion.DARK_AGES);
  }

  private addSheltersToStartingDecks(): void {
    this.startingDeckConfigurationBuilder.useShelters();
  }

  private createInitialDecks(): void {
    for (const player of this.game.getPlayers()) {
      player.getOwnedCards().initialize(this.startingDeckConfigurationBuilder.build());
    }
  }

  public async runGame(): Promise<GameResult> {
    return this.game.runGame();
  }
}
