/**
 * A game of Tak.
 */
function Game(parameters)
{
  // set type.
  this.type = 'Game';

  // ensure parameters.
  if (!parameters)
  {
    parameters = {};
  }

  // set attributes.
  this.gameInfo = (parameters.gameInfo ? parameters.gameInfo : new GameInfo());
  this.gameStateHistory = (parameters.gameStateHistory ? parameters.gameStateHistory : []);
  for (var gameState in parameters.gameStateHistory)
  {
    this.gameStateHistory.push(gameState);
  }
  this.moveHistory = (parameters.moveHistory ? parameters.moveHistory : []);
  for (var move in parameters.moveHistory)
  {
    this.moveHistory.push(move);
  }
  this.active = (parameters.active === true);

  // add functions.
}

/**
 * GameInfo. Meta information on a Game of Tak.
 */
function GameInfo(parameters)
{
  // set type.
  this.type = 'GameInfo';

  // ensure parameters object.
  if (!parameters)
  {
    parameters = {};
  }

  // assemble parameters.
  this.size = (parameters.size ? parameters.size : 5);
  this.players = [];
  this.players.push(parameters.players && parameters.players[0] ? parameters.players[0] : 'You');
  this.players.push(parameters.players && parameters.players[1] ? parameters.players[1] : 'You');
  this.timeIncrement = (parameters.timeIncrement ? parameters.timeIncrement : 0);
  this.startingTime = (parameters.startingTime ? parameters.startingTime : 600);
}

/**
 * GameState. A single state of the board and pieces.
 */
function GameState (object, move)
{
  // set type.
  this.type = 'GameState';

  // validate object.
  if (!object)
  {
    throw 'Can\'t initialize GameState. Nullary object passed.';
  }
  else if (!object.type)
  {
    throw 'Can\'t initialize GameState. Unknown object type passed.';
  }
  else if (object.type != 'GameState' && object.type != 'GameInfo');
  {
    throw 'Can\'t initialize GameState. Unexpected object type.';
  }

  // if a parent GameState is passed.
  if (object.type == 'GameState')
  {
    if (!move)
    {
      throw 'Can\'t initialize GameState based on parent GameState and nullary move.';
    }
    this.parent = object;
    this.gameInfo = object.gameInfo;
    this.move = move;
    this.boardConfiguration = object.boardConfiguration.clone();
    this.boardConfiguration.applyMove(move);
  }
  else
  {
    this.parent = null;
    this.gameInfo = object;
    this.move = null;
    this.boardConfiguration = new BoardConfiguration(size);
  }
}

/**
 * Board configuration object.
 */
function BoardConfiguration(size)
{
  // set up empty arrays.
  this.grid = [];
  for (var rank = 0; rank < size; ++rank)
  {
    this.grid.push([]);
    for (var file = 0; file < size; ++file)
    {
      this.grid[rank].push([]);
    }
  }

  // clone function.
  this.clone = function()
  {
    var clone = new BoardConfiguration(this.size);
    for (var rank = 0; rank < size; ++rank)
    {
      for (var file = 0; file < size; ++file)
      {
        var stack = this.grid[rank][file];
        var numPieces = stack.length;
        for (var piece = 0; piece < numPieces; ++piece)
        {
          clone.grid[rank][file].push(stack[piece]);
        }
      }
    }
  }

  // apply move function.
  this.applyMove(move)
  {
    // validate the move's validity.
    if (move.type === 'stackMove')
    {

    }
    else if (move.type === 'placementMove')
    {

    }
    else
    {
      throw 'Couldn\'t apply move to board configuration. Invalid move object.';
    }
  }
}

/**
 * Move object parsed from a PTN move representation string.
 */
function Move(representation)
{
  var segmented;

  // if stack move:
  if (representation.includes('<')
      || representation.includes('>')
      || representation.includes('+')
      || representation.includes('-'))
  {
    // segment stack move representation.
    segmented = /^(\d?)([a-h])([1-8])([\<\>\+\-])(\d*)$/.exec(representation);

    // validate representation.
    if (!segmented)
    {
      throw 'Unable to parse move. Move representation invalid: ' + representation;
    }

    // get number of picked up pieces.
    var numPieces = segmented[1];
    if (!numPieces)
    {
      numPieces = 1;
    }
    else
    {
      numPieces = parseInt(numPieces);
    }

    // get field of origin.
    var file = segmented[2];
    var rank = segmented[3];

    // get direction.
    var rawDirection = segmented[4];

    // get path sequence.
    var rawSequence = segmented[5];
    var sequence = [];
    var sum = 0;
    if (!rawSequence)
    {
      sequence.push(numPieces);
      sum = numPieces;
    }
    else
    {
      for (var i = 0; i < rawSequence.length; ++i)
      {
        var pathItem = parseInt(rawSequence.charAt(i));
        sequence.push(pathItem);
        sum += pathItem;
      }
    }

    // validate move completion.
    if (sum != numPieces)
    {
      throw 'The number of pieces picked up did not match the number of pieces put down: ' + representation;
    }

    // set move information.
    this.numPieces = numPieces;
    this.direction = rawDirection;
    this.sequence = sequence;
    this.type = 'stackMove';
  }
  // else it's a placement move:
  else
  {
    // segment placement move.
    segmented = /^([SCF]?)([a-h])([1-8])$/.exec(representation);

    // validate representation.
    if (!segmented)
    {
      throw 'Unable to parse move. Move representation invalid: ' + representation;
    }

    // if wall, capstone or explicit flat.
    if (segmented[1] === 'S' || segmented[1] === 'C' || segmented[1] === 'F')
    {
      this.piece = segmented[1];
    }
    // else, it's a flat placement.
    else
    {
      this.piece = 'F';
    }
    this.type = 'placementMove';
  }

  // get field of origin.
  var file = segmented[2];
  var rank = segmented[3];
  this.rankIndex = parseInt(rank) - 1;
  this.fileIndex = file.charCodeAt(0) - 'a'.charCodeAt(0);

  // print function.
  this.toString = function()
  {
    var result = '';
    if (this.type === 'stackMove')
    {
      result += (this.numPieces > 1 ? this.numPieces : '');
      result += String.fromCharCode(this.fileIndex + 'a'.charCodeAt(0));
      result += this.rankIndex + 1;
      result += this.direction;
      if (this.sequence.length > 1)
      {
        for (var i = 0; i < this.sequence.length; ++i)
        {
          result += this.sequence[i];
        }
      }
    }
    else if (this.type === 'placementMove')
    {
      result += (this.piece === 'S' || this.piece === 'C' ? this.piece : '');
      result += String.fromCharCode(this.fileIndex + 'a'.charCodeAt(0));
      result += this.rankIndex + 1;
    }
    else
    {
      throw 'Could not print Move object. Move type unknown.';
    }

    return result;
  }
}