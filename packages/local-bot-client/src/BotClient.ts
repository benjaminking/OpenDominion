import { Client, ClientGameState, EmptyLogTransmitter } from '@dominion/client-common';
import { DecisionService } from '@dominion/common';

import { BotDecisionService } from './BotDecisionService';
import { BotFactory } from './BotFactory';

export class BotClient extends Client {
  public constructor() {
    const botClientGameState: ClientGameState = new ClientGameState();
    const bot = BotFactory.createRuleBasedBot('MilitiaBMBot');
    const botDecisionService: DecisionService = new BotDecisionService(botClientGameState, bot);
    super(botDecisionService, new EmptyLogTransmitter(), botClientGameState);
  }
}
