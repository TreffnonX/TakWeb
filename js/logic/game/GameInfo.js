/**
 * GameInfo object containing information on the game type,
 * protocol level and general meta information.
 */
function GameInfo (protocol, size, time, increment, rules)
{
  // protocol level string (original / tak_v2).
  this.protocol = protocol;

  // game size (int 3 - 8)
  this.size = size;

  // time in minutes per player.
  this. time = time;

  // increment per ply in seconds.
  this.increment = increment;

  // rules played string (beta / 3pfk / no_edge ...)
  this.rules = rules;
}