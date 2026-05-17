import { Client, ClientGameState, EmptyLogTransmitter } from '@dominion/client-common';
import { DecisionService } from '@dominion/common';
import { PlayerSpecification } from '@dominion/game-engine';
import { GameInitializer } from '@dominion/game-engine';
import { BotDecisionService, BotFactory } from '@dominion/local-bot-client';
import { ConsoleLogPrinter, TextBasedDecisionService } from '@dominion/local-text-client';

export class TextBasedGameRunner {
  public async runGame(): Promise<void> {
    const textPlayerClientGameState: ClientGameState = new ClientGameState();
    const textPlayerDecisionService: DecisionService = new TextBasedDecisionService(textPlayerClientGameState);

    const textPlayer: PlayerSpecification = new PlayerSpecification(
      'ben',
      new Client(textPlayerDecisionService, new ConsoleLogPrinter(), textPlayerClientGameState),
    );

    const botClientGameState: ClientGameState = new ClientGameState();
    const bot = BotFactory.createRuleBasedBot('MilitiaBMBot');
    const botDecisionService: DecisionService = new BotDecisionService(botClientGameState, bot);
    const botPlayer: PlayerSpecification = new PlayerSpecification(
      'MilitiaBMBot',
      new Client(botDecisionService, new EmptyLogTransmitter(), botClientGameState),
    );

    const requiredCardNames: string[] = [];
    for (const cardName of bot.requiredCardNames) {
      requiredCardNames.push(cardName);
    }

    const gameInitializer: GameInitializer = new GameInitializer([textPlayer, botPlayer], requiredCardNames);
    await gameInitializer.startGame();
  }
}
