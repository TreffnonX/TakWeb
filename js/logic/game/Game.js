/**
 * A game of tak, either currently played, or completed.
 */
function Game (gameInfo, player_1, player_2)
{
  // set up basic game parameters.
  this.gameInfo = gameInfo;
  this.gameInfo.player_1 = player_1;
  this.gameInfo.player_2 = player_2;

  // whether this game is still actively running or not. A game actively
  // running is not open for post game analysis.
  this.active = false;

  // whether this client is a spectator in the game or not.
  this.spectator = false;

  // game number.
  this.gameNo = -1;
}