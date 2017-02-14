/**
 * Container for all game objects currently held by the client.
 */
function GameContainer()
{
  // Active games currently played by this client.
  this.activePlayedGames = [];

  // Active games currently spectated by this client.
  this.activeSpectatedGames = [];

  // Final games previously played by this client.
  this.finalPlayedGames = [];

  // Final games spectated by this client.
  this.finalSpectatedGames = [];
}

// Finalize parameter game.
GameContainer.prototype.finalizeGame(gameNo)
{
  // move game to finalized.
  var game;
  for (var i = 0; i < this.activePlayedGames.length; ++i)
  {
    if (this.activePlayedGames[i].gameNo == gameNo)
    {
      game = this.activePlayedGames.splice(i, 1)[0];
      this.finalPlayedGames[i] = game;
      break;
    }
  }
  if (game == null)
  {
    for (var i = 0; i < this.activePlayedGames.length; ++i)
    {
      if (this.activePlayedGames[i].gameNo == gameNo)
      {
        game = this.activePlayedGames.splice(i, 1)[0];
        this.finalPlayedGames[i] = game;
        break;
      }
    }
  }

  // update UI.
  // TODO implement update ui
}