var expect = require('chai').expect;
var rewire = require('rewire');
var gameJs = rewire('../../js/logic/game.js');

describe ('Tak Game Logic', function()
{
  /**
   * Test, if placement move representations are correctly parsed?
   */
  it ('should parse a placement move.', function()
  {
    var Move = gameJs.__get__('Move');
    var move = new Move('a1');
    expect(move).to.not.be.null;
    expect(move.type === 'placementMove').to.be.true;
    expect(move.rankIndex === 0).to.be.true;
    expect(move.fileIndex === 0).to.be.true;
    expect(move.piece === 'F').to.be.true;
    expect(move.toString() === 'a1').to.be.true;

    move = new Move('Fa1');
    expect(move).to.not.be.null;
    expect(move.type === 'placementMove').to.be.true;
    expect(move.rankIndex === 0).to.be.true;
    expect(move.fileIndex === 0).to.be.true;
    expect(move.piece === 'F').to.be.true;
    expect(move.toString() === 'a1').to.be.true;

    move = new Move('Sd6');
    expect(move).to.not.be.null;
    expect(move.type === 'placementMove').to.be.true;
    expect(move.rankIndex === 5).to.be.true;
    expect(move.fileIndex === 3).to.be.true;
    expect(move.piece === 'S').to.be.true;
    expect(move.toString() === 'Sd6').to.be.true;

    move = new Move('Ch8');
    expect(move).to.not.be.null;
    expect(move.type === 'placementMove').to.be.true;
    expect(move.rankIndex === 7).to.be.true;
    expect(move.fileIndex === 7).to.be.true;
    expect(move.piece === 'C').to.be.true;
    expect(move.toString() === 'Ch8').to.be.true;
  });

  /**
   * Test, if stack move representations are correctly parsed?
   */
  it ('should parse a stack move.', function()
  {
    var Move = gameJs.__get__('Move');
    var move = new Move('a1+');
    expect(move).to.not.be.null;
    expect(move.type === 'stackMove').to.be.true;
    expect(move.rankIndex === 0).to.be.true;
    expect(move.fileIndex === 0).to.be.true;
    expect(move.direction === '+').to.be.true;
    expect(move.numPieces === 1).to.be.true;
    expect(move.sequence.length === 1).to.be.true;
    expect(move.sequence[0] === 1).to.be.true;
    expect(move.toString() === 'a1+').to.be.true;

    move = new Move('2c3>');
    expect(move).to.not.be.null;
    expect(move.type === 'stackMove').to.be.true;
    expect(move.rankIndex === 2).to.be.true;
    expect(move.fileIndex === 2).to.be.true;
    expect(move.direction === '>').to.be.true;
    expect(move.numPieces === 2).to.be.true;
    expect(move.sequence.length === 1).to.be.true;
    expect(move.sequence[0] === 2).to.be.true;
    expect(move.toString() === '2c3>').to.be.true;

    move = new Move('4c4-121');
    expect(move).to.not.be.null;
    expect(move.type === 'stackMove').to.be.true;
    expect(move.rankIndex === 3).to.be.true;
    expect(move.fileIndex === 2).to.be.true;
    expect(move.direction === '-').to.be.true;
    expect(move.numPieces === 4).to.be.true;
    expect(move.sequence.length === 3).to.be.true;
    expect(move.sequence[0] === 1).to.be.true;
    expect(move.sequence[1] === 2).to.be.true;
    expect(move.sequence[2] === 1).to.be.true;
    expect(move.toString() === '4c4-121').to.be.true;
  });

  /**
   * Does it throw errors at the right time?
   */
  it ('should fail to parse invalid moves.', function()
  {
    var Move = gameJs.__get__('Move');

    // out of bounds.
    var error = false;
    try
    {
      var move = new Move('a0');
    }
    catch (err)
    {
      error = true;
    }
    expect(error).to.be.true;

    // out of bounds 2.
    error = false;
    try
    {
      var move = new Move('k5');
    }
    catch (err)
    {
      error = true;
    }
    expect(error).to.be.true;

    // stack move without direction.
    error = false;
    try
    {
      var move = new Move('4a2');
    }
    catch (err)
    {
      error = true;
    }
    expect(error).to.be.true;

    // capital file.
    error = false;
    try
    {
      var move = new Move('A1');
    }
    catch (err)
    {
      error = true;
    }
    expect(error).to.be.true;

    // wrong number of pieces.
    error = false;
    try
    {
      var move = new Move('4a1+111');
    }
    catch (err)
    {
      error = true;
    }
    expect(error).to.be.true;
  });
});