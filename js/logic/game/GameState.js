/**
 * Game state within a game.
 */
function GameState(parentState, ply, size)
{
  // create from a parent state and ply by applying the ply to the parent state.
  if (parentState && ply)
  {
    this.size = parentState.size;
    this.fields = cloneFields(parentState.fields);
    // TODO implement ply application.
  }
  // otherwise create an empty state from a game size.
  else if (size)
  {
    // create fields.
    this.size = size;
    this.fields = [];
    for (var column = 0; column < size; ++column)
    {
      var inner = [];
      for (var row = 0; row < size; ++row)
      {
        inner.push([]);
      }
      this.fields.push(inner);
    }
  }
}

// clone a single field stack.
function cloneStack(fieldStack)
{
  var clone = [];
  for (var i = 0; i < fieldStack.length; ++i)
  {
    clone.push(fieldStack[i]);
  }
  return clone;
}

// clone the fields of a game state.
function cloneFields(fields)
{
  var size = fields[].length;
  var fields = [];
  for (var column = 0; column < size; ++column)
  {
    var inner = [];
    for (var row = 0; row < size; ++row)
    {
      var clonedStack = cloneStack(fields[column][row]);
      inner.push(clonedStack);
    }
    this.fields.push(inner);
  }
  return fields;
}