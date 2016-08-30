/**
 * Tak Style Serialization script.
 *
 * This script enables the client to handle TSS definitions and TSS files. A TSS definition defines the structure
 * expected in TSS files. If that structure is violated, the TSS will not be parsed. If a TSS is parsed, it will modify
 * the tree structure accordingly and the browser page's cache will be updated to store the respective changes.
 * The TSS tree is similar to a DOM tree and can be accessed in a similar fashion.
 * As the TSS affects the style of the 3D environment, changes are applied, if an element is affected.
 */

// flag that tss.js is loaded.
const tssJSLoaded = true;

// global TSS related objects.
var tssDefinition;
var tss;

/**
 * Initialize TSS definition and TSS by loading the default.tss and the user defined tss.
 */
function initTSS ()
{
  // get definition.tss and default.tss from the dom.
  var definitionTSS = $("meta[property='definition.tss']").attr('content');
  var defaultTSS = $("meta[property='default.tss']").attr('content');
  if (definitionTSS == null || defaultTSS == null)
  {
    throw ('Could not find tss files.');
  }

  // load tss definition.
  tssDefinition = objectifyDefinitionTree(parseTSS(definitionTSS));

  // load default tss.
  tss = objectifyTSSTree(parseTSS(defaultTSS), tssDefinition);

  // Report loaded TSS.
  console.log('TSS loaded.')
}

/**
 * Parse a given TSS definition string and return a tss definition object.
 */
function parseTSS (tssString)
{
  // prepare general operations.
  const str = completeTrim(tssString);
  const root =
  {
    rep: '',
    children: [],
    parent: null
  }
  var cursor = root;

  // parse iteratively, character by character.
  for (var i = 0; i < str.length; ++i)
  {
    const currentChar = str.charAt(i);
    // if a new element is opened, push it onto the root.
    if (currentChar == '<')
    {
      const newRootElement =
      {
        rep: '',
        children: [],
        parent: cursor
      }
      cursor.children.push(newRootElement);
      cursor = newRootElement;
    }
    // else, if an old element is closed, return to the previous stack level.
    else if (currentChar == '>')
    {
      if (cursor.parent == null)
      {
        // error in TSS definition.
        throw 'Error in TSS definition. Found more \'>\' than \'<\'.';
      }
      cursor = cursor.parent;
    }
    // otherwise add the character to the content.
    else
    {
      cursor.rep += currentChar;
    }
  }

  // check, if all elements were closed.
  if (cursor != root)
  {
    // error in TSS definition.
    throw 'Error in TSS definition. Not all elements were closed.';
  }

  // finally, return stack.
  return root;
}

/**
 * Objectify the string definition tree, by interpreting the content of the tree node for node.
 */
function objectifyDefinitionTree (rawTree)
{
  // check for unique tss root element.
  if (rawTree.children.length != 1)
  {
    throw 'Unable to objectify definition tree. Only one root element expected.';
  }
  else if (rawTree.children[0].rep != 'tss')
  {
    throw 'Unable to objectify definition tree. Root element was not a \'tss\' node.';
  }

  // get tss root element.
  const tss = rawTree.children[0];

  // interpret raw definition tree.
  return objectifyDefinitionNode(tss, null);
}

/**
 * Objectify a raw definition node.
 */
function objectifyDefinitionNode(rawNode, parentEntityDefinition)
{
  // identify node type.
  const representation = rawNode.rep;
  var result;

  if (representation.includes(':'))
  {
    // validate representation syntax.
    if (!/^[A-z0-9_\-]*\??:.+$/.exec(representation))
    {
      throw 'Unable to objectify definition tree. Faulty value representation syntax: ' + representation;
    }

    // dissect value definition.
    const valueDefinition =
    {
      name: /^[A-z0-9_\-]*/.exec(representation).toString(),
      parent: parentEntityDefinition,
      type: 'def_value',
      data: /:([^,$]*)/.exec(representation)[1].toString(),
      optional: (/\?/.exec(representation) ? true : false)
    }
    result = valueDefinition;
  }
  else
  {
    // validate representation syntax.
    if (!/^[A-z0-9_\-]*[\+\*\?]?(?:=[A-z0-9]*)?$/.exec(representation))
    {
      throw 'Unable to objectify definition tree. Faulty value representation syntax: ' + representation;
    }

    // dissect entity definition.
    const entityDefinition =
    {
      name: /^[A-z0-9_\-]*/.exec(representation).toString(),
      parent: parentEntityDefinition,
      subnodes: [],
      type: 'def_entity',
      multi: /[\+\*\?]/.exec(representation),
    };
    if (entityDefinition.multi == null)
    {
      entityDefinition.multi = '1';
    }
    else
    {
      entityDefinition.multi = entityDefinition.multi.toString();
    }

    // recurse to child nodes.
    for (var i = 0; i < rawNode.children.length; ++i)
    {
      const subnode = objectifyDefinitionNode(rawNode.children[i], entityDefinition);
      entityDefinition.subnodes.push(subnode);
    }

    // conclude node objectification.
    result = entityDefinition;
  }

  // return resulting objectified node.
  return result;
}

/**
 * Parse a raw TSS tree and validate it with a tss definition tree.
 */
function objectifyTSSTree (rawTree, tssDefinition)
{
  // check for unique tss root element.
  if (rawTree.children.length != 1)
  {
    throw 'Unable to objectify TSS tree. Only one root element expected.';
  }
  else if (rawTree.children[0].rep != 'tss')
  {
    throw 'Unable to objectify TSS tree. Root element was not a \'tss\' node.';
  }

  // get tss root element.
  const tss = rawTree.children[0];

  // interpret raw definition tree.
  return objectifyTSSNode(tss, tssDefinition);
}

/**
 * Translate a raw TSS node into an object.
 */
function objectifyTSSNode(rawNode, definitionNode)
{
  // prepare result.
  const representation = rawNode.rep;
  var result;

  // ensure that the raw node matches the defined node.
  if (/^[^:=]+(?=(?:[:=].*)?$)/.exec(representation).toString() != definitionNode.name)
  {
    throw 'Unable to objectify TSS tree. The name of the raw node did not match the defined node\'s name: '
        + /^[^:=]+(?=(?:[:=].*)?$)/.exec(representation).toString() + " != " + definitionNode.name;
    return;
  }

  if (representation.includes(':'))
  {
    // ensure correct node type.
    if (definitionNode.type != 'def_value')
    {
      throw 'Unable to objectify TSS tree. Value node expected, but entity node found.';
    }

    // dissect raw value node.
    var value = /:(.*)$/.exec(representation);
    if (value == null)
    {
      throw 'Unable to objectify TSS tree. Value badly defined: ' + representation;
    }
    value = value[1].toString();

    // validate data type.
    switch (definitionNode.data)
    {
      case 's':
        // automatically valid.
        break;
      case 'i':
        // arbitrary integer.
        if (/^\d*$/.exec(value) == null)
        {
          throw 'Unable to objectify TSS tree. Integer value expected. found: ' + value;
        }
        break;
      case 'i1':
        // boolean integer (0 - 1).
        if (value != '0' && value != '1')
        {
          throw 'Unable to objectify TSS tree. Expected \'0\' or \'1\'. found: ' + value;
        }
        break;
      case 'i255':
        // byte integer (0 - 255).
        if (/^\d*$/.exec(value) == null || parseInt(value) < 0 || parseInt(value) > 255)
        {
          throw 'Unable to objectify TSS tree. Expected integer between 0 and 255. found: ' + value;
        }
        break;
      case 'f':
        // floating point.
        if (!/^\d*\.?\d*$/.exec(value))
        {
          throw 'Unable to objectify TSS tree. Expected floating point value. found: ' + value;
        }
        break;
      case 'f1':
        if (!/^\d*\.?\d*$/.exec(value) || parseFloat(value) < 0 || parseFloat(value) > 1)
        {
          throw 'Unable to objectify TSS tree. Expected floating point value between 0 and 1. found: ' + value;
        }
        break;
      default:
        throw 'Unable to objectify TSS tree. Valid data type definition expected. found: ' + definitionNode.data;
    }
    result = value;
  }
  else
  {
    // ensure correct node type.
    if (definitionNode.type != 'def_entity')
    {
      throw 'Unable to objectify TSS tree. Entity node expected, but value node found.';
    }

    // create entity.
    const entity =
    {
      type: 'entity'
    };

    // iterate and recurse over child nodes.
    for (var i = 0; i < rawNode.children.length; ++i)
    {
      const name = /^[^:=]+(?=(?:[:=].*)?$)/.exec(rawNode.children[i].rep).toString();

      // look for matching defined node.
      var matchedNode = null;
      for (var j = 0; j < definitionNode.subnodes.length; ++j)
      {
        const definedName = definitionNode.subnodes[j].name;
        if (definedName == name)
        {
          matchedNode = definitionNode.subnodes[j];
        }
      }
      if (matchedNode == null)
      {
        throw 'Unable to objectify TSS tree. Node ' + name + ' is undefined for entity ' + rawNode.rep + '.';
      }

      // recurse.
      const recursionResult = objectifyTSSNode(rawNode.children[i], matchedNode);
      if (recursionResult == null)
      {
        // break function. Error should have already been thrown.
        return;
      }

      // add attribute.
      var attributeName = name;
      if (matchedNode.multi == '+' || matchedNode.multi == '*')
      {
        // add array or named attribute.
        const specificName = /=(.*)$/.exec(rawNode.children[i].rep);
        if (specificName)
        {
          attributeName += '_' + specificName[1].toString();
          if (entity[attributeName])
          {
            throw 'Unable to objectify TSS tree. Attribute ' + attributeName + ' is defined more than once.';
          }
          entity[attributeName] = recursionResult;
        }
        else
        {
          if (!entity[attributeName])
          {
            entity[attributeName] = [];
            entity[attributeName].type = 'entity_array';
          }

          entity[attributeName].push(recursionResult);
        }
      }
      else
      {
        // add optional or singleton attribute.
        if (entity[attributeName])
        {
          throw 'Unable to objectify TSS tree. Attribute ' + attributeName + ' is defined more than once.';
        }
        entity[attributeName] = recursionResult;
      }
    }

    // ensure multiplicities.
    for (var i = 0; i < definitionNode.subnodes.length; ++i)
    {
      const current = definitionNode.subnodes[i];
      if (current.multi == '1' && !(current.name in entity))
      {
        var found = false;
        for (var property in entity)
        {
          if (property.startsWith(currentName + '_'))
          {
            found = true;
            break;
          }
        }
        if (!found)
        {
          throw 'Unable to objectify TSS tree. Attribute ' + current.name + ' was expected, but not found.';
        }
      }
    }
    result = entity;
  }

  // return resulting objectified node.
  return result;
}

/**
 * Merges a source TSS tree into a target TSS tree. Preexisting values are overwritten.
 */
function mergeTSSTrees (target, source)
{
  const clone = cloneTSSNode(target);
  mergeTSSNode(clone, source);
  return clone;
}

/**
 * Merge a source TSS node into a target TSS node.
 */
function mergeTSSNode (target, source)
{
  // if the target doesn't exist, take the entire source.
  if (target == null)
  {
    target = source;
  }
  else
  {
    // recurse through entities.
    if (source.type === 'entity')
    {
      for (var property in source)
      {
        target[property] = mergeTSSNode(target[property], source[property]);
      }
    }
    // recurse through entity arrays.
    else if (source.type === 'entity_array')
    {
      target = [];
      for (var i = 0; i < source.length; ++i)
      {
        target.push(mergeTSSNode(null, source[i]));
      }
    }
    // else overwrite value.
    else
    {
      target = source;
    }
  }

  // finally return result;
  return target;
}

/**
 * Clones a tssNode. The clone is semi deep, meaning that changes applied to the clone won't affect the original and
 * vice versa. This will go all the way through the entity nodes. Value objects are not cloned but referenced.
 */
function cloneTSSNode (tssTree)
{
  const original = tssTree;
  const clone = {};

  // clone one by one.
  for (var property in original)
  {
    if (original[property].type === 'entity')
    {
      const childClone = cloneTSSNode(original[property]);
      clone[property] = childClone;
    }
    else if (original[property].type === 'entity_array')
    {
      clone[property] = [];
      for (var i = 0; i < original[property].length; ++i)
      {
        clone[property].push(cloneTSSNode(original[property][i]));
      }
    }
    else
    {
      clone[property] = original[property];
    }
  }

  // return resulting clone.
  return clone;
}

/**
 * Remove all occurrences of unseen characters.
 */
function completeTrim (str)
{
  return str.replace(/\s/g, '').toString();
}