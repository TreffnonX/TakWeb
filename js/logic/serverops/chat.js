var chat_time;
var chatMode = 'all';
var lastWhisper = '';

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
      printChatMessage('private-msg private-' + match[1], server.myname, match[2]);
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
  var chatMessage = $('<span>').addClass(types);
  chatMessage.append('<span class="' + cls + '">[' + getZero(hours) + ':' + getZero(mins) + '] </span>');
  chatMessage.append('<span class="' + clsname + '">' + user + ': </span>');
  var options = {/* ... */};
  message = message.linkify(options);

  // highlight own name.
  if(message.indexOf(this.myname) > -1) {
    var tmp = message.split(this.myname);
    message = tmp[0] + '<span class="chatmyname">' + this.myname + '</span>' + tmp[1];
  }
  chatMessage.append(message + '<br>');

  // append message to chat.
  var $cs = $('#chat-server');
  $cs.append(chatMessage);
  $cs.scrollTop($cs[0].scrollHeight);

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
  if (mode == 'global')
  {
    document.getElementById('global-badge').style.opacity = 0;
  }
  if (mode.startsWith('private-'))
  {
    document.getElementById(mode + '-badge').style.opacity = 0;
    var allPrivateClosed = true;
    var allPrivates = document.getElementsByClassName('private-chat-badge');
    for (var i = 0; i < allPrivates.length; ++i)
    {
      if (allPrivates[i].style.opacity != 0)
      {
        allPrivateClosed = false;
        break;
      }
    }
    if (allPrivateClosed)
    {
      document.getElementById('private-badge').style.opacity = 0;
    }
  }

  // select chat.
  document.getElementById('chat-me').focus();
}

/**
 * Provides a chat room, if required.
 */
function provideChatRoom(room, player1, player2)
{
  // test, if room already exists.
  if (document.getElementById(room))
  {
    return;
  }

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
  var badge = document.createElement('div');
  badge.style = "opacity:" + (chatMode == room || chatMode == 'all' ? 0 : 1) + ";";
  badge.id = room + '-badge';
  badge.className = 'chat-badge ' + type + '-chat-badge';

  // assemble.
  var listItem = document.createElement('li');
  listItem.id = room;
  listItem.appendChild(badge);
  listItem.appendChild(name);
  listItem.appendChild(button);
  listItem.className = 'chat-list-item';
  var list = document.getElementById(type + '-chat-list');
  list.appendChild(listItem);
}