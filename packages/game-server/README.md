# Dominion Game Server

This is currently a minimal Node.js server using Express and WebSockets that runs the Dominion card game. While I have plans to expand this into a multi-user system with lobbies and tables, it currently is hard-coded to run a two-player game between a Web client and a rule-based bot.

**Running the game server:**

You should be able to start the server by running

```bash
npm run dev
```

The server will start on `http://localhost:3000` and serve the Angular app.
