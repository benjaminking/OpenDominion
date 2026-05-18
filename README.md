# OpenDominion

OpenDominion is an open-source TypeScript implementation of the Dominion card game.
It includes:

- A game engine
- A Node.js game server (HTTP + WebSocket)
- An Angular web client
- A text-based client for lightweight use
- A simple rule-based bot client

This code is still in a very early stage. Many aspects of it are currently hard-coded. Be aware of:

- The game server doesn't have a lobby
- The only supported game configuration is between a human player and a bot
- The name of the human player is hard-coded
- There is only one bot, a simple rule-based Militia big-money bot

## Running the server and web client

1. Build the Angular client once:

   ```bash
   npm --workspace @dominion/web-client run build
   ```

2. Start the game server in watch mode:

   ```bash
   npm --workspace @dominion/game-server run dev
   ```

3. Open:

   ```text
   http://localhost:3000
   ```

## License and IP note

This repository is licensed under MIT (see `LICENSE`).

OpenDominion does not include copyrighted Dominion artwork; assets in this repo are generated or original to this project.

Practical note: Rio Grande Games has official licensed digital Dominion products, both for app-based play and online play. There may be legal ramifications for certain uses of this code that the license is permissive of. Carefully consider your uses before you distribute any derivate code. Here are some recommended uses for this code:

- Creating and testing fan cards
- Simulating and evaluating strategies
- Developing your own AI bots
- Honing your skills against existing bots
