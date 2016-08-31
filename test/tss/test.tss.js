var expect = require('chai').expect;
var rewire = require('rewire');
var tssJs = rewire('../../js/tss/tss.js');


describe ('Tak Style Serialization', function()
{
  /**
   * Test, if tss.js was loaded and is accessible.
   */
  it ('should be loaded.', function()
  {
    expect(tssJs.__get__('tssJSLoaded')).to.be.true;
  });

  /**
   * Does the trimming work as expected?
   */
  it ('should remove all white spaces from a given string.', function()
  {
    var testString = '<tss\n  <pieces\n<models <capstone <name:s>>>\n  >\n>';
    var completeTrim = tssJs.__get__('completeTrim');
    expect(completeTrim(testString) == '<tss<pieces<models<capstone<name:s>>>>>').to.be.true;
  });

  /**
   * Does the TSS definition parser return an object, and is that object a raw tss definition tree.
   */
  it ('should parse a TSS definition string.', function()
  {
    var tssDef = '<tss <pieces <models <capstone <name:s>>'
        + '<flatstone <name:s>>>>>';
    var parseTSS = tssJs.__get__('parseTSS');
    var resultTree = parseTSS(tssDef);
    var cursor = resultTree;

    // evaluate result.
    expect(cursor).to.not.be.null;
    expect(cursor.rep == '').to.be.true;
    expect(cursor.children.length == 1).to.be.true;
    expect(cursor.parent).to.be.null;

    cursor = cursor.children[0];
    expect(cursor).to.not.be.null;
    expect(cursor.rep == 'tss').to.be.true;
    expect(cursor.children.length == 1).to.be.true;
    expect(cursor.parent == resultTree).to.be.true;

    cursor = cursor.children[0];
    expect(cursor).to.not.be.null;
    expect(cursor.rep == 'pieces').to.be.true;
    expect(cursor.children.length == 1).to.be.true;

    cursor = cursor.children[0];
    expect(cursor).to.not.be.null;
    expect(cursor.rep == 'models').to.be.true;
    expect(cursor.children.length == 2).to.be.true;

    cursor = cursor.children[0];
    expect(cursor).to.not.be.null;
    expect(cursor.rep == 'capstone').to.be.true;
    expect(cursor.children.length == 1).to.be.true;

    cursor = cursor.children[0];
    expect(cursor).to.not.be.null;
    expect(cursor.rep == 'name:s').to.be.true;
    expect(cursor.children.length == 0).to.be.true;

    cursor = cursor.parent.parent.children[1];
    expect(cursor).to.not.be.null;
    expect(cursor.rep == 'flatstone').to.be.true;
    expect(cursor.children.length == 1).to.be.true;

    cursor = cursor.children[0];
    expect(cursor).to.not.be.null;
    expect(cursor.rep == 'name:s').to.be.true;
    expect(cursor.children.length == 0).to.be.true;
  });

  /**
   * Does the objectified TSS definition match the raw TSS definition?
   */
  it ('should objectify a raw TSS definition tree.', function()
  {
    var tssDef = '<tss <pieces? <models? <capstone* <name:s> <opt?:f>>'
        + '<flatstone <name:s>>>>>';
    var parseTSS = tssJs.__get__('parseTSS');
    var objectifyDefinitionTree = tssJs.__get__('objectifyDefinitionTree');
    var rawTree = parseTSS(tssDef);
    var resultTree = objectifyDefinitionTree(rawTree);
    var cursor = resultTree;

    // evaluate result.
    expect(cursor).to.not.be.null;
    expect(cursor.parent).to.be.null;
    expect(cursor.name == 'tss').to.be.true;
    expect(cursor.type == 'def_entity').to.be.true;
    expect(cursor.multi == '1').to.be.true;
    expect(cursor.subnodes.length == 1).to.be.true;

    cursor = cursor.subnodes[0];
    expect(cursor.parent == resultTree).to.be.true;
    expect(cursor.name == 'pieces').to.be.true;
    expect(cursor.type == 'def_entity').to.be.true;
    expect(cursor.multi == '?').to.be.true;
    expect(cursor.subnodes.length == 1).to.be.true;

    cursor = cursor.subnodes[0];
    expect(cursor.parent == resultTree.subnodes[0]).to.be.true;
    expect(cursor.name == 'models').to.be.true;
    expect(cursor.type == 'def_entity').to.be.true;
    expect(cursor.multi == '?').to.be.true;
    expect(cursor.subnodes.length == 2).to.be.true;

    cursor = cursor.subnodes[0];
    expect(cursor.name == 'capstone').to.be.true;
    expect(cursor.type == 'def_entity').to.be.true;
    expect(cursor.multi == '*').to.be.true;
    expect(cursor.subnodes.length == 2).to.be.true;

    expect(cursor.subnodes[1].name == 'opt').to.be.true;
    expect(cursor.subnodes[1].type == 'def_value').to.be.true;
    expect(cursor.subnodes[1].data == 'f').to.be.true;
    expect(cursor.subnodes[1].optional).to.be.true;

    cursor = cursor.subnodes[0];
    expect(cursor.name == 'name').to.be.true;
    expect(cursor.type == 'def_value').to.be.true;
    expect(cursor.data == 's').to.be.true;

    cursor = cursor.parent.parent.subnodes[1];
    expect(cursor.name == 'flatstone').to.be.true;
    expect(cursor.type == 'def_entity').to.be.true;
    expect(cursor.multi == '1').to.be.true;
    expect(cursor.subnodes.length == 1).to.be.true;

    cursor = cursor.subnodes[0];
    expect(cursor.name == 'name').to.be.true;
    expect(cursor.type == 'def_value').to.be.true;
    expect(cursor.data == 's').to.be.true;
  });

  /**
   * Is the TSS tree loaded when given a raw tree and a definition tree?
   */
  it ('should parse and objectify a TSS tree.', function()
  {
    var tssDef = '<tss'
               +   '<pieces?'
               +     '<models?'
               +       '<capstone*=s'
               +         '<spline'
               +           '<node* <x:f1> <y:f1>>'
               +         '>'
               +       '>'
               +     '>'
               +   '>'
               + '>';
    var tssStr = '<tss'
               +   '<pieces'
               +     '<models'
               +       '<capstone=example'
               +         '<spline'
               +           '<node <x:0.98> <y:0>>'
               +           '<node <x:1> <y:0.02>>'
               +           '<node <x:1> <y:0.08>>'
               +           '<node <x:0.98> <y:0.1>>'
               +         '>'
               +       '>'
               +       '<capstone=example2'
               +         '<spline'
               +           '<node <x:0.95> <y:0>>'
               +           '<node <x:1> <y:0.02>>'
               +           '<node <x:1> <y:0.08>>'
               +           '<node <x:0.98> <y:0.1>>'
               +         '>'
               +       '>'
               +     '>'
               +   '>'
               + '>';

    var parseTSS = tssJs.__get__('parseTSS');
    var objectifyDefinitionTree = tssJs.__get__('objectifyDefinitionTree');
    var objectifyTSSTree = tssJs.__get__('objectifyTSSTree');
    var rawDefinition = parseTSS(tssDef);
    var definition = objectifyDefinitionTree(rawDefinition);
    var rawTSS = parseTSS(tssStr);
    var tss = objectifyTSSTree(rawTSS, definition);

    expect(tss).to.not.be.null;
    expect(tss.pieces).to.not.be.null;
    expect(tss.pieces.models).to.not.be.null;
    expect(tss.pieces.models.capstone_example).to.not.be.null;
    expect(tss.pieces.models.capstone_example.spline).to.not.be.null;
    expect(tss.pieces.models.capstone_example.spline.node).to.not.be.null;
    expect(tss.pieces.models.capstone_example.spline.node.length == 4).to.be.true;
    expect(tss.pieces.models.capstone_example.spline.node[0]).to.not.be.null;
    expect(tss.pieces.models.capstone_example.spline.node[0].x).to.not.be.null;
    expect(tss.pieces.models.capstone_example.spline.node[0].x == 0.98).to.be.true;
    expect(tss.pieces.models.capstone_example.spline.node[0].y).to.not.be.null;
    expect(tss.pieces.models.capstone_example.spline.node[0].y == 0).to.be.true;

    expect(tss.pieces.models.capstone_example.spline.node[1]).to.not.be.null;
    expect(tss.pieces.models.capstone_example.spline.node[1].x).to.not.be.null;
    expect(tss.pieces.models.capstone_example.spline.node[1].x == 1).to.be.true;
    expect(tss.pieces.models.capstone_example.spline.node[1].y).to.not.be.null;
    expect(tss.pieces.models.capstone_example.spline.node[1].y == 0.02).to.be.true;

    expect(tss.pieces.models.capstone_example.spline.node[2]).to.not.be.null;
    expect(tss.pieces.models.capstone_example.spline.node[2].x).to.not.be.null;
    expect(tss.pieces.models.capstone_example.spline.node[2].x == 1).to.be.true;
    expect(tss.pieces.models.capstone_example.spline.node[2].y).to.not.be.null;
    expect(tss.pieces.models.capstone_example.spline.node[2].y == 0.08).to.be.true;

    expect(tss.pieces.models.capstone_example.spline.node[3]).to.not.be.null;
    expect(tss.pieces.models.capstone_example.spline.node[3].x).to.not.be.null;
    expect(tss.pieces.models.capstone_example.spline.node[3].x == 0.98).to.be.true;
    expect(tss.pieces.models.capstone_example.spline.node[3].y).to.not.be.null;
    expect(tss.pieces.models.capstone_example.spline.node[3].y == 0.1).to.be.true;

    expect(tss.pieces.models.capstone_example2).to.not.be.null;
    expect(tss.pieces.models.capstone_example2.spline).to.not.be.null;
    expect(tss.pieces.models.capstone_example2.spline.node).to.not.be.null;
    expect(tss.pieces.models.capstone_example2.spline.node.length == 4).to.be.true;
    expect(tss.pieces.models.capstone_example2.spline.node[0]).to.not.be.null;
    expect(tss.pieces.models.capstone_example2.spline.node[0].x).to.not.be.null;
    expect(tss.pieces.models.capstone_example2.spline.node[0].x == 0.95).to.be.true;
    expect(tss.pieces.models.capstone_example2.spline.node[0].y).to.not.be.null;
    expect(tss.pieces.models.capstone_example2.spline.node[0].y == 0).to.be.true;
  });

  /**
   * Is the clone identical to the original? Are all the entities deep copies?
   */
  it ('should clone an existing TSS tree.', function()
  {
    var tssDef = '<tss'
               +   '<pieces?'
               +     '<models?'
               +       '<capstone*=s'
               +         '<spline'
               +           '<node* <x:f1> <y:f1>>'
               +         '>'
               +       '>'
               +     '>'
               +   '>'
               + '>';
    var tssStr = '<tss'
               +   '<pieces'
               +     '<models'
               +       '<capstone=example'
               +         '<spline'
               +           '<node <x:0.98> <y:0>>'
               +           '<node <x:1> <y:0.02>>'
               +           '<node <x:1> <y:0.08>>'
               +           '<node <x:0.98> <y:0.1>>'
               +         '>'
               +       '>'
               +       '<capstone=example2'
               +         '<spline'
               +           '<node <x:0.95> <y:0>>'
               +           '<node <x:1> <y:0.02>>'
               +           '<node <x:1> <y:0.08>>'
               +           '<node <x:0.98> <y:0.1>>'
               +         '>'
               +       '>'
               +     '>'
               +   '>'
               + '>';

    var parseTSS = tssJs.__get__('parseTSS');
    var objectifyDefinitionTree = tssJs.__get__('objectifyDefinitionTree');
    var objectifyTSSTree = tssJs.__get__('objectifyTSSTree');
    var cloneTSSNode = tssJs.__get__('cloneTSSNode');
    var rawDefinition = parseTSS(tssDef);
    var definition = objectifyDefinitionTree(rawDefinition);
    var rawTSS = parseTSS(tssStr);
    var tss = objectifyTSSTree(rawTSS, definition);
    var clone = cloneTSSNode(tss);

    expect(clone).to.not.be.null;
    expect(clone.pieces).to.not.be.null;
    expect(clone.pieces.models).to.not.be.null;
    expect(clone.pieces.models.capstone_example).to.not.be.null;
    expect(clone.pieces.models.capstone_example.spline).to.not.be.null;
    expect(clone.pieces.models.capstone_example.spline.node).to.not.be.null;
    expect(clone.pieces.models.capstone_example.spline.node.length == 4).to.be.true;
    expect(clone.pieces.models.capstone_example.spline.node[0]).to.not.be.null;
    expect(clone.pieces.models.capstone_example.spline.node[0].x).to.not.be.null;
    expect(clone.pieces.models.capstone_example.spline.node[0].x == 0.98).to.be.true;
    expect(clone.pieces.models.capstone_example.spline.node[0].y).to.not.be.null;
    expect(clone.pieces.models.capstone_example.spline.node[0].y == 0).to.be.true;

    expect(clone.pieces.models.capstone_example.spline.node[1]).to.not.be.null;
    expect(clone.pieces.models.capstone_example.spline.node[1].x).to.not.be.null;
    expect(clone.pieces.models.capstone_example.spline.node[1].x == 1).to.be.true;
    expect(clone.pieces.models.capstone_example.spline.node[1].y).to.not.be.null;
    expect(clone.pieces.models.capstone_example.spline.node[1].y == 0.02).to.be.true;

    expect(clone.pieces.models.capstone_example.spline.node[2]).to.not.be.null;
    expect(clone.pieces.models.capstone_example.spline.node[2].x).to.not.be.null;
    expect(clone.pieces.models.capstone_example.spline.node[2].x == 1).to.be.true;
    expect(clone.pieces.models.capstone_example.spline.node[2].y).to.not.be.null;
    expect(clone.pieces.models.capstone_example.spline.node[2].y == 0.08).to.be.true;

    expect(clone.pieces.models.capstone_example.spline.node[3]).to.not.be.null;
    expect(clone.pieces.models.capstone_example.spline.node[3].x).to.not.be.null;
    expect(clone.pieces.models.capstone_example.spline.node[3].x == 0.98).to.be.true;
    expect(clone.pieces.models.capstone_example.spline.node[3].y).to.not.be.null;
    expect(clone.pieces.models.capstone_example.spline.node[3].y == 0.1).to.be.true;

    expect(clone.pieces.models.capstone_example2).to.not.be.null;
    expect(clone.pieces.models.capstone_example2.spline).to.not.be.null;
    expect(clone.pieces.models.capstone_example2.spline.node).to.not.be.null;
    expect(clone.pieces.models.capstone_example2.spline.node.length == 4).to.be.true;
    expect(clone.pieces.models.capstone_example2.spline.node[0]).to.not.be.null;
    expect(clone.pieces.models.capstone_example2.spline.node[0].x).to.not.be.null;
    expect(clone.pieces.models.capstone_example2.spline.node[0].x == 0.95).to.be.true;
    expect(clone.pieces.models.capstone_example2.spline.node[0].y).to.not.be.null;
    expect(clone.pieces.models.capstone_example2.spline.node[0].y == 0).to.be.true;

    // ensure deep copy of entities.
    expect(clone == tss).to.be.false;
    expect(clone.pieces == tss.pieces).to.be.false;
    expect(clone.pieces.models == tss.pieces.models).to.be.false;
    expect(clone.pieces.models.capstone_example == tss.pieces.models.capstone_example).to.be.false;
    expect(clone.pieces.models.capstone_example.spline == tss.pieces.models.capstone_example.spline).to.be.false;
    expect(clone.pieces.models.capstone_example.spline.node
        == tss.pieces.models.capstone_example.spline.node).to.be.false;
    for (var i = 0; i < 4; ++i)
    {
      expect(clone.pieces.models.capstone_example.spline.node[i]
          == tss.pieces.models.capstone_example.spline.node[i]).to.be.false;
      expect(clone.pieces.models.capstone_example.spline.node[i].x
          == tss.pieces.models.capstone_example.spline.node[i].x).to.be.true;
    }
  });

  /**
   * Does the merge operation work as expected?
   */
  it ('should merge two TSS trees correctly.', function()
  {
    var tssDef = '<tss'
               +   '<pieces?'
               +     '<models?'
               +       '<capstone*=s'
               +         '<spline'
               +           '<node* <x:f1> <y:f1>>'
               +         '>'
               +       '>'
               +     '>'
               +   '>'
               + '>';
    var tssStr = '<tss'
               +   '<pieces'
               +     '<models'
               +       '<capstone=example'
               +         '<spline'
               +           '<node <x:0.98> <y:0>>'
               +           '<node <x:1> <y:0.02>>'
               +           '<node <x:1> <y:0.08>>'
               +           '<node <x:0.98> <y:0.1>>'
               +         '>'
               +       '>'
               +       '<capstone=example2'
               +         '<spline'
               +           '<node <x:0.95> <y:0>>'
               +           '<node <x:1> <y:0.02>>'
               +           '<node <x:1> <y:0.08>>'
               +           '<node <x:0.98> <y:0.1>>'
               +         '>'
               +       '>'
               +     '>'
               +   '>'
               + '>';
    var tssStr2 = '<tss'
               +   '<pieces'
               +     '<models'
               +       '<capstone=example'
               +         '<spline'
               +           '<node <x:0.95> <y:0>>'
               +           '<node <x:1> <y:0.05>>'
               +         '>'
               +       '>'
               +       '<capstone=example3'
               +         '<spline'
               +           '<node <x:0.9> <y:0>>'
               +           '<node <x:1> <y:0.1>>'
               +         '>'
               +       '>'
               +     '>'
               +   '>'
               + '>';

    var parseTSS = tssJs.__get__('parseTSS');
    var objectifyDefinitionTree = tssJs.__get__('objectifyDefinitionTree');
    var objectifyTSSTree = tssJs.__get__('objectifyTSSTree');
    var mergeTSSTrees = tssJs.__get__('mergeTSSTrees');
    var rawDefinition = parseTSS(tssDef);
    var definition = objectifyDefinitionTree(rawDefinition);
    var rawTSS = parseTSS(tssStr);
    var tss = objectifyTSSTree(rawTSS, definition);
    var rawTSS2 = parseTSS(tssStr2);
    var tss2 = objectifyTSSTree(rawTSS2, definition);
    var mergedTSS = mergeTSSTrees(tss, tss2);

    expect(mergedTSS).to.not.be.null;
    expect(mergedTSS.pieces).to.not.be.null;
    expect(mergedTSS.pieces.models).to.not.be.null;
    expect(mergedTSS.pieces.models.capstone_example).to.not.be.null;
    expect(mergedTSS.pieces.models.capstone_example2).to.not.be.null;
    expect(mergedTSS.pieces.models.capstone_example3).to.not.be.null;
    expect(mergedTSS.pieces.models.capstone_example.spline.node.length == 2).to.be.true;
    expect(mergedTSS.pieces.models.capstone_example2.spline.node.length == 4).to.be.true;
    expect(mergedTSS.pieces.models.capstone_example3.spline.node.length == 2).to.be.true;
    expect(mergedTSS.pieces.models.capstone_example.spline.node[0].x == 0.95).to.be.true;
  });

  /**
   * Are tss trees correctly regressed into raw TSS?
   */
  it ('should translate a TSS tree back to raw TSS correctly.', function()
  {
        var tssDef = '<tss'
                   +   '<pieces?'
                   +     '<models?'
                   +       '<capstone*=s'
                   +         '<spline'
                   +           '<node* <x:f1> <y:f1>>'
                   +         '>'
                   +       '>'
                   +     '>'
                   +   '>'
                   + '>';
        var tssStr = '<tss'
                   +   '<pieces'
                   +     '<models'
                   +       '<capstone=example'
                   +         '<spline'
                   +           '<node <x:0.98> <y:0>>'
                   +           '<node <x:1> <y:0.02>>'
                   +           '<node <x:1> <y:0.08>>'
                   +           '<node <x:0.98> <y:0.1>>'
                   +         '>'
                   +       '>'
                   +       '<capstone=example2'
                   +         '<spline'
                   +           '<node <x:0.95> <y:0>>'
                   +           '<node <x:1> <y:0.02>>'
                   +           '<node <x:1> <y:0.08>>'
                   +           '<node <x:0.98> <y:0.1>>'
                   +         '>'
                   +       '>'
                   +     '>'
                   +   '>'
                   + '>';
    var parseTSS = tssJs.__get__('parseTSS');
    var objectifyDefinitionTree = tssJs.__get__('objectifyDefinitionTree');
    var objectifyTSSTree = tssJs.__get__('objectifyTSSTree');
    var toString = tssJs.__get__('toString');
    var completeTrim = tssJs.__get__('completeTrim');
    var mergeTSSTrees = tssJs.__get__('mergeTSSTrees');
    var rawDefinition = parseTSS(tssDef);
    var definition = objectifyDefinitionTree(rawDefinition);
    var rawTSS = parseTSS(tssStr);
    var tss = objectifyTSSTree(rawTSS, definition);

    var regressed = toString(tss, 'tss');
    var rawTSS = parseTSS(regressed);
    var tss2 = objectifyTSSTree(rawTSS, definition);
    var trimmedOriginal = completeTrim(tssStr);
    expect(trimmedOriginal == regressed).to.be.true;

    tss = mergeTSSTrees(tss, tss);
    regressed = toString(tss, 'tss');
    expect(trimmedOriginal == regressed).to.be.true;
  });
});