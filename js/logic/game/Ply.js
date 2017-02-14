var plyConstants
{
  original : new RegExp('^(?:' // from the start of the passed notation, do either of n options.
                      + '(?:M\\s' // Either move a stack
                      + '([A-H])([1-8])\\s' // from $1, $2
                      + '([A-H])([1-8])\\s' // to $3, $4
                      + '(\\d\\s?)+)' // leaving behind... $5
                      // or
                      + '|(?:P\\s' // place a piece
                      + '([CW])?\\s' // of type $6
                      + '([A-H])([1-8]))' // at $7, $8
                      // or
                      + '|(?:Over\\s' // the game ended
                      + '(?:[RF1]-0)|(0-[RF1])|(1/2-1/2)))' // how $9, $10, $11
                      );
}

/**
 * A single action by a player. Usually one of two plies in a move.
 * There are special plies depending on the play mode.
 */
function Ply (protocol, plyNotation)
{
  switch (protocol)
  {
    case 'original':
      var dissection = plyConstants.original.exec(plyNotation);
      if (dissection)
      {
        var stackMoveFromColumn = dissection[1];
        var placeOnColumn = dissection[7];
        var winPlayerOne = dissection[9];
        var winPlayerTwo = dissection[10];
        var tie = dissection[11];
        if (stackMoveFromColumn)
        {
          var stackMoveFromRow = dissection[2];
          var stackMoveToColumn = dissection[3];
          var stackMoveToRow = dissection[4];
          var path = dissection[5].trim().split(' ');
        }
        else if (placeOnColumn)
        {
          var placeStone = dissection[6];
          var placeOnRow = dissection[8];
        }
        else if (winPlayerOne || winPlayerTwo || tie)
        {

        }
        else
        {
          console.error('Protocol violation. Bad move notation: ' + dissection[0]);
          return;
        }
      }
      else
      {
        console.error('Protocol did not match expected type.');
      }
    break;
    case 'tak_v2':

    break;
    default:
      console.error('Server protocol not known.');
      return;
  }
}

// Parse a TPS style ply notation.
Ply.prototype.parseOriginalPlyNotation = function (plyNotation)
{

  var regex = new RegExp(pattern);
  
}