var chat_time;
var chatMode = 'all';
var lastWhisper = '';
var lastOutgoingWhisper = '';

/**
 * Handle incoming chat message. If the message is not a chat message, false is returned.
 */
function handleChatMessage (message)
{
  // dismember message.
  switch (/^\S*/.exec(message).toString())
  {
    case 'Shout':
      var match = /^Shout <(\S*)> (.*)$/.exec(message);
      if (!match) throw 'Malformed shout message received: ' + message;
      printChatMessage('global-msg', match[1], match[2]);
    break;
    case 'ShoutRoom':
      var match = /^ShoutRoom (\S*) <(\S*)> (.*)$/.exec(message);
      if (!match) throw 'Malformed game message received: ' + message;
      printChatMessage('game-msg ' + match[1], match[2], match[3]);
    break;
    case 'Tell':
      var match = /^Tell <(\S*)> (.*)$/.exec(message);
      if (!match) throw 'Malformed private message received: ' + message;
      lastWhisper = match[1];
      printChatMessage('private-msg private-' + match[1], match[1], match[2]);
    break;
    case 'Told':
      var match = /^Told <(\S*)> (.*)$/.exec(message);
      if (!match) throw 'Malformed private message confirmation received: ' + message;
      printChatMessage('private-msg private-' + match[1], '&#10149; ' + match[1], match[2]);
    break;
    case 'CmdReply':
      var match = /^CmdReply (.*)$/.exec(message);
      if (!match) throw 'Malformed server message received: ' + message;
      printChatMessage('', '', match[1]);
    break;
    default:
      return false;
  }

  return true;
}

/**
 * Dispatch a chat message to the server.
 */
function sendChatMessage () {
  var msg = $('#chat-me').val();

  // redirected chat message.
  if (msg.startsWith('.'))
  {
    // segment message.
    var match = /^\.(\S*) (.*)/.exec(msg);
    if (!match) return;
    var type = match[1];
    var inner = match[2];
    var msg = null;

    // go through message assemblers and find the right one.
    (msg = sendWhisper(type, inner))
    || (msg = sendRepeatedWhisper(type, inner))
    || (msg = sendResponse(type, inner))
    || (msg = sendGlobal(type, inner))
    || (msg = sendMatch(type, inner))
    || (msg = sendSpectators(type, inner))
    || (msg = sendOpponent(type, inner));

    // if the message is faulty or null, abort.
    if (!msg || msg == 1) return;
  }
  else if (chatMode == 'global' || chatMode == 'all')
  {
    msg = 'Shout ' + msg;
  }
  else if (chatMode.startsWith('Game'))
  {
    var gameNo = /^(Game\d*)/.exec(chatMode)[1].toString();
    msg = 'ShoutRoom ' + gameNo + ' ' + msg;
  }
  else if (chatMode.startsWith('private-'))
  {
    var other = /^private-(.*)/.exec(chatMode)[1].toString();
    msg = 'Tell ' + other + ' ' + msg;
  }
  console.log('Sent to Server: ' + msg);
  server.send(msg);

  // clear chat field.
  $('#chat-me').val('');
}

/**
 * Message redirect functions.
 */
function sendWhisper(type, inner)
{
  if (type != 'w' && type != 'whisper') return null;
  var match = /^([\w\d]*) (.*)/.exec(inner);
  if (!match) return 1;
  toUser = match[1];
  body = match[2];
  lastOutgoingWhisper = toUser;
  return 'Tell ' + toUser + ' ' + body;
}
function sendRepeatedWhisper(type, inner)
{
  if (type != 'ww') return null;
  if (!lastOutgoingWhisper) return 1;
  return 'Tell ' + lastOutgoingWhisper + ' ' + inner;
}
function sendResponse(type, inner)
{
  if (type != 'r' && type != 'respond') return null;
  if (!lastWhisper) return 1;
  lastOutgoingWhisper = lastWhisper;
  return 'Tell ' + lastWhisper + ' ' + inner;
}
function sendGlobal(type, inner)
{
  if (type != 'a' && type != 'all' && type != 'g' && type != 'global') return null;
  return 'Shout ' + inner;
}
function sendMatch(type, inner)
{
  if (type != 'm' && type != 'match') return null;
  if (!board.gameno) return 1;
  if (board.observing)
  {
    return 'ShoutRoom Game' + board.gameno + ' ' + inner;
  }
  else
  {
    var opponent = document.getElementById('player-opp-name').innerHTML;
    lastOutgoingWhisper = opponent;
    return 'Tell ' + opponent + ' ' + inner;
  }
}
function sendSpectators(type, inner)
{
  if (type != 's' && type != 'spectator' && type != 'spectators') return null;
  if (!board.gameno || !board.observing) return 1;
  return 'ShoutRoom Game' + board.gameno + ' ' + inner;
}
function sendOpponent(type, inner)
{
  if (type != 'o' && type != 'opponent') return null;
  if (!board.gameno || board.observing) return 1;
  var opponent = document.getElementById('player-opp-name').innerHTML;
  lastOutgoingWhisper = opponent;
  return 'Tell ' + opponent + ' ' + inner;
}

/**
 * Print received chat messages.
 */
function printChatMessage (types, user, message)
{
  // dismember message.
  var clsname = 'chatname';

  // extract IRC relay leftovers.
  if (user=='IRC') {
    user = /^\<(\w*)\>/.exec(message)[1].toString();
    message = /^\<\w*\>\s?(.*)$/.exec(message)[1];
    clsname = clsname + ' ircname';
  }

  // chat time.
  var now = new Date();
  var hours = now.getHours();
  var mins = now.getMinutes();
  var cls = 'chattime'
  if (localStorage.getItem('hide-chat-time') === 'true') {
    cls = cls + ' hidden';
  }

  // assemble message.
  var chatMessage = $('<span>').addClass(types + ' chat-msg');
  chatMessage.append('<span class="' + cls + '">[' + getZero(hours) + ':' + getZero(mins) + '] </span>');
  chatMessage.append('<span class="' + clsname + '">' + user + ': </span>');
  chatMessage.append('<span class="time-label-box"><span class="time-label">'
      + getZero(hours) + ':' + getZero(mins) + '</span></span>');

  // employ linkify to highlight links.
  var options = {/* ... */};
  message = message.linkify(options);

  // highlight own name.
  message = ' ' + message + ' ';
  message = message.replace(new RegExp('((?:[^\\w\\d\\<\\>]|(?:\\<[^\\>]*\\>))*)('
      + server.myname + ')(?=[^\\w\\d])', 'gi'),
      '$1<span class="chatmyname">$2</span>');

  console.log(message);

  chatMessage.append(message + '<br>');

  // append message to chat.
  var $cs = $('#chat-server');
  var scrolledDown = ($cs[0].scrollHeight - $cs[0].scrollTop - $cs.innerHeight()) == 0;
  console.log($cs[0].scrollHeight + ' ' + $cs[0].scrollTop + ' ' + $cs.innerHeight());
  $cs.append(chatMessage);
  if (scrolledDown)
  {
    $cs.scrollTop($cs[0].scrollHeight);
  }

  // attach context menu to player names.
  var playerName = chatMessage.children()[1];
  playerName.target = /\S*$/.exec(playerName.innerHTML.toString().trim()).toString();
  playerName.addEventListener('click', function (event) {
    openContextMenu(this, event);
  }, false);

  playerName.oncontextmenu = function (event) {
    event.preventDefault();
    openContextMenu(this, event);
  };

  // if private chat message, ensure dropdown entry.
  var match = / (private-|Game)(.*)$/.exec(types);
  if (match)
  {
    var room = match[1] + match[2];
    provideChatRoom(room);

    // private or game badge.
    if (chatMode != room && chatMode != 'all')
    {
      document.getElementById(room.startsWith('private-') ? 'private-badge' : 'game-badge').style.opacity = 1;
      document.getElementById(room + '-badge').style.opacity = 1;
    }
  }

  // activate badge for global and game chat.
  if (types == 'global-msg' && chatMode != 'all' && chatMode != 'global')
  {
    document.getElementById('global-badge').style.opacity = 1;
  }
}

function chatModeChange(chatTab, mode)
{
  // change UI.
  var oldChatTabs = document.getElementsByClassName('selected-chat-tab');
  for (var i = 0; i < oldChatTabs.length; ++i)
  {
    oldChatTabs[i].className = oldChatTabs[i].className.replace(/selected-chat-tab/g, '').trim();
  }
  chatTab.className = chatTab.className + ' selected-chat-tab';

  // prepare dynamic change.

  chatMode = mode;
  console.log('Chat mode: ' + chatMode);
  var style = document.getElementById('chat-mode-css');

  // dynamically create style element.
  style.innerHTML =
      // global visibility.
      '.global-msg {display:' + (/^(global|all)$/.exec(mode) ? 'block' : 'none') + ';}\n'
    + '.game-msg {display:' + (/^all$/.exec(mode) ? 'block' : 'none') + ';}\n'
    + '.private-msg {display:' + (/^all$/.exec(mode) ? 'block' : 'none') + ';}\n'

      // room or private chat visibility.
    + (!/^(global|all)$/.exec(mode) ? '.' + mode + ' {display:block;}\n' : '');

  var $cs = $('#chat-server');
  $cs.scrollTop($cs[0].scrollHeight);

  // deactivate badge.
  if (mode == 'all')
  {
    var badges = document.getElementsByClassName('chat-badge');
    for (var i = 0; i < badges.length; ++i)
    {
      badges[i].style.opacity = 0;
    }
  }
  else if (mode == 'global')
  {
    document.getElementById('global-badge').style.opacity = 0;
  }
  else if (mode.startsWith('private-') || mode.startsWith('Game'))
  {
    document.getElementById(mode + '-badge').style.opacity = 0;
    var type = (mode.startsWith('private') ? 'private' : 'game');
    var allClosed = true;
    var allRooms = document.getElementsByClassName(type + '-chat-badge');
    for (var i = 0; i < allRooms.length; ++i)
    {
      if (allRooms[i].style.opacity != 0)
      {
        allClosed = false;
        break;
      }
    }
    if (allClosed)
    {
      document.getElementById(type + '-badge').style.opacity = 0;
    }
  }

  // select chat.
  document.getElementById('chat-me').focus();
}

/**
 * Provides a chat room, if required.
 */
function provideChatRoom(room, player1, player2, hideBadge)
{
  // test, if room already exists.
  if (document.getElementById(room))
  {
    return;
  }

  // prepare list item.
  var listItem = document.createElement('li');

  // determine room type.
  var type = room.startsWith('private-') ? 'private' : 'game';

  // chat room name.
  var name = document.createElement('div');
  var label;
  if (type == 'game')
  {
    label = '<span class="playername'
        + (player1.toLowerCase().endsWith('bot') ? '' : ' nonbot') + '">' + player1 + '</span>'
        + '<span style="display:block;font-size:12px;color:#888;text-align:center;height:12px;line-height:1;">'
        + 'vs</span><span class="playername'
        + (player2.toLowerCase().endsWith('bot') ? '' : ' nonbot') + '" style="float:right;">' + player2
        + '</span>';
    listItem.title = room;
  }
  name.innerHTML = type == 'private' ? /private-(.*)/.exec(room)[1].toString() : label;
  name.className = 'chat-name' + (type == 'private' ?
      ' playername' + (room.toLowerCase().endsWith('bot') ? '' : ' nonbot') : '');
  name.onclick = function() {
    chatModeChange(document.getElementById(type + '-chat-tab'), room);
  };

  // close button.
  var button = document.createElement('div');
  button.className = 'chat-close';
  button.target = room;
  button.innerHTML = '&#215;&#160;';
  button.onclick = function () {
    var target = document.getElementById(this.target);
    if (chatMode == this.target)
    {
      chatModeChange(document.getElementById('all-chat-tab'), 'all');
    }
    target.parentNode.removeChild(target);
  };

  // new message badge.
  var showBadge = !(hideBadge || chatMode == room || chatMode == 'all');
  var badge = document.createElement('div');
  badge.style = "opacity:" + (showBadge ? 1 : 0) + ";";
  badge.id = room + '-badge';
  badge.className = 'chat-badge ' + type + '-chat-badge';

  // assemble.
  listItem.id = room;
  listItem.appendChild(badge);
  listItem.appendChild(name);
  listItem.appendChild(button);
  listItem.className = 'chat-list-item';
  var list = document.getElementById(type + '-chat-list');
  list.appendChild(listItem);
}

/**
 * Open the context menu on a chat name.
 */
function openContextMenu (target, event)
{
  var player = target.target;
  var contextMenu = document.getElementById('context-menu');
  contextMenu.open(player, event);
}
