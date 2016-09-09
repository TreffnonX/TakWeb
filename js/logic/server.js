// server greeting message.
var server_greeting = 'TreffnonX-08.09.16';
var icon_path = 'resources/images/icons/';

var server = {
  connection: null,
  timeoutvar: null,
  myname: null,
  tries:0,
  timervar: null,
  lastTimeUpdate: null,

  init: function () {
      console.log("called init");
      if (this.connection && this.connection.readyState === 2)//closing connection
          return;
      if (this.connection && this.connection.readyState === 3)//closed
          this.connection = null;
      if (this.connection) { //user clicked logout
          this.connection.close();
          alert("info", "Disconnnecting from server....");

          localStorage.removeItem('keeploggedin');
          localStorage.removeItem('usr');
          localStorage.removeItem('token');
          return;
      }
      var url = window.location.host;
      //if (url.indexOf("playtak") > -1)
          url = 'playtak.com:3000';
      var proto='ws://';
      if (window.location.protocol === "https:")
          proto='wss://';
      this.connection = new WebSocket(proto + url, "binary");
      board.server = this;
      this.connection.onerror = function (e) {
          output("Connection error: " + e);
          console.log(e);
      };
      this.connection.onmessage = function (e) {
          var blob = e.data;
          var reader = new FileReader();
          reader.onload = function (event) {
              var res = reader.result.split("\n");
              var i;
              for (i = 0; i < res.length - 1; i++) {
                  server.msg(res[i]);
              }
          };
          reader.readAsText(blob);
      };
      this.connection.onopen = function (e) {
      };
      this.connection.onclose = function (e) {
          document.getElementById('login-button').textContent = 'Sign up / Login';
          $('#onlineplayers').addClass('hidden');
          document.getElementById("onlineplayersbadge").innerHTML = "0";
          document.getElementById("seekcount").innerHTML =
              "<span class='nonbot'>0 </span>&#183;<span class='botcount'> 0</span>";
          document.getElementById("gamecount").innerHTML =
              "<span class='nonbot'>0 </span>&#183;<span class='botcount'> 0</span>";
          document.getElementById("scratchsize").disabled = false;
          board.scratch = true;
          board.observing = false;
          board.gameno = 0;
          document.title = "Tak";
          $('#seeklist').children().each(function() {
            if (!/(list-head-line|seeklist-botline)/.exec(this.className))
            {
              this.remove();
            }
          });
          $('#gamelist').children().each(function() {
            if (!/(list-head-line|gamelist-botline)/.exec(this.className))
            {
              this.remove();
            }
          });
          stopTime();
          alert("info", "You're disconnected from server");
      };
  },
  login: function () {
      var name = $('#login-username').val();
      var pass = $('#login-pwd').val();

      this.send("Login " + name + " " + pass);
  },
  guestlogin: function() {
      this.send("Login Guest");
  },
  register: function () {
      var name = $('#register-username').val();
      var email = $('#register-email').val();
      this.send("Register " + name + " " + email);
  },
  keepalive: function() {
      if(server.connection && server.connection.readyState === 1)//open connection
          server.send("PING");
  },
  msg: function (e) {
      output(e);
      e = e.trim();
      if (e.startsWith("Game Start")) {
          //Game Start no. size player_white vs player_black yourcolor time
          var spl = e.split(" ");
          board.newgame(Number(spl[3]), spl[7]);
          board.gameno = Number(spl[2]);
          console.log("gno "+board.gameno);
          document.getElementById("scratchsize").disabled = true;

          $('#player-me-name').removeClass('player1-name');
          $('#player-me-name').removeClass('player2-name');
          $('#player-opp-name').removeClass('player1-name');
          $('#player-opp-name').removeClass('player2-name');

          $('#player-me-time').removeClass('player1-time');
          $('#player-me-time').removeClass('player2-time');
          $('#player-opp-time').removeClass('player1-time');
          $('#player-opp-time').removeClass('player2-time');

          $('#player-me').removeClass('selectplayer');
          $('#player-opp').removeClass('selectplayer');

          if (spl[7] === "white") {//I am white
              $('#player-me-name').addClass('player1-name');
              $('#player-opp-name').addClass('player2-name');

              $('#player-me-time').addClass('player1-time');
              $('#player-opp-time').addClass('player2-time');

              $('#player-me-img').attr('src', icon_path + 'player-white.png');
              $('#player-opp-img').attr('src', icon_path + 'player-black.png');

              $('#player-me').addClass('selectplayer');
          } else {//I am black
              $('#player-me-name').addClass('player2-name');
              $('#player-opp-name').addClass('player1-name');

              $('#player-me-time').addClass('player2-time');
              $('#player-opp-time').addClass('player1-time');

              $('#player-me-img').attr('src', icon_path + 'player-black.png');
              $('#player-opp-img').attr('src', icon_path + 'player-white.png');

              $('#player-opp').addClass('selectplayer');
          }

          $('.player1-name:first').html(spl[4]);
          $('.player2-name:first').html(spl[6]);
          document.title = "Tak: " + spl[4] + " vs " + spl[6];

          var time = Number(spl[8]);
          var m = parseInt(time/60);
          var s = getZero(parseInt(time%60));
          $('.player1-time:first').html(m+':'+s);
          $('.player2-time:first').html(m+':'+s);

          var chimesound = document.getElementById("chime-sound");
          chimesound.play();
      }
      else if (e.startsWith("Observe Game#")) {
          //Observe Game#1 player1 vs player2, 4x4, 180, 7 half-moves played, player2 to move
          var spl = e.split(" ");
          board.clear();
          board.init(Number(spl[5].split("x")[0]), "white", false, true);
          var gameno = Number(spl[1].split("Game#")[1]);
          board.gameno = gameno;
          $('.player1-name:first').html(spl[2]);
          $('.player2-name:first').html(spl[4].split(",")[0]);
          document.title = "Tak: " + spl[2] + " vs " + spl[4];

          var time = Number(spl[6].split(",")[0]);
          var m = parseInt(time/60);
          var s = getZero(parseInt(time%60));
          $('.player1-time:first').html(m+':'+s);
          $('.player2-time:first').html(m+':'+s);

          provideChatRoom('Game' + gameno, spl[2], spl[4].split(",")[0]);
      }
      else if (e.startsWith("GameList Add Game#")) {
          //GameList Add Game#1 player1 vs player2, 4x4, 180, 15, 0 half-moves played, player1 to move
          var spl = e.split(" ");

          var no = spl[2].split("Game#")[1];

          var t = Number(spl[7].split(",")[0]);
          var m = parseInt(t/60);
          var s = getZero(parseInt(t%60));

          var inc = spl[8].split(",")[0];

          var p1 = spl[3];
          var p2 = spl[5].split(",")[0];
          var sz = spl[6].split(",")[0];

          var botGame = p1.trim().toLowerCase().endsWith('bot') || p2.trim().toLowerCase().endsWith('bot');

          p1 = "<span class='playername p1" + (p1.trim().toLowerCase().endsWith('bot') ? "'" : " nonbot'")
              + " style='display: inline-block; width: 120px; text-align: right;'>" + p1 + "</span>";
          p2 = "<span class='playername p2" + (p2.trim().toLowerCase().endsWith('bot') ? "'" : " nonbot'")
              + "style='display: inline-block; width: 120px;'>" + p2 + "</span>";
          sz = "<span class='badge' style='display: inline-block; width: 40px; text-align: center;'>"
              + sz + "</span>";
          var vs = "<span style='display: inline-block; width: 22px; text-align: center; font-size: 12px; "
              + "'>vs</span>";
          var time = "<span style='display: inline-block; width: 60px; text-align: center;'>"
              + m + ":" + s + "</span>";
          inc = "<span style='display: inline-block; width: 40px;'>+" + inc + "s</span>";

          var val = p1 + vs + p2 + sz + time + inc;

          var li = document.createElement('li');
          var a = document.createElement('a');
          li.className += ' game' + no;
          a.innerHTML = val;
          a.onclick = function() {
              server.observegame(spl[2].split("Game#")[1]);
            };
          li.appendChild(a);
          document.getElementById('gamelist').insertBefore(li,
              botGame ? null : document.getElementById('gamelist-botline'));

          var op = document.getElementById("gamecount");
          var humans = parseInt(new RegExp('-?\\d+(?= )').exec(op.innerHTML));
          var bots = parseInt(new RegExp('-?\\d+(?=\\</s)').exec(op.innerHTML));
          op.innerHTML = botGame ?
                '<span class="nonbot">' + humans + ' </span>&#183;<span class="botcount"> ' + ++bots + '</span>'
              : '<span class="nonbot">' + ++humans + ' </span>&#183;<span class="botcount"> ' + bots + '</span>';
      }
      else if (e.startsWith("GameList Remove Game#")) {
          //GameList Remove Game#1 player1 vs player2, 4x4, 180, 0 half-moves played, player1 to move
          var spl = e.split(" ");

          var no = spl[2].split("Game#")[1];
          var game = $('.game' + no);
          var playerName1 = game.find('.p1').html().toString().trim();
          var playerName2 = game.find('.p2').html().toString().trim();
          var botGame = playerName1.toLowerCase().endsWith('bot') || playerName2.toLowerCase().endsWith('bot');
          game.remove();

          var op = document.getElementById("gamecount");
          var humans = parseInt(new RegExp('-?\\d+(?= )').exec(op.innerHTML));
          var bots = parseInt(new RegExp('-?\\d+(?=\\</s)').exec(op.innerHTML));
          op.innerHTML = botGame ?
                '<span class="nonbot">' + humans + ' </span>&#183;<span class="botcount"> ' + --bots + '</span>'
              : '<span class="nonbot">' + --humans + ' </span>&#183;<span class="botcount"> ' + bots + '</span>';
      }
      else if (e.startsWith("Game#")) {
        var spl = e.split(" ");
        var gameno = Number(e.split("Game#")[1].split(" ")[0]);
        console.log("game no "+gameno+" "+board.gameno);
        //Game#1 ...
        if(gameno === board.gameno) {
          //Game#1 P A4 (C|W)
          if (spl[1] === "P") {
              board.serverPmove(spl[2].charAt(0), Number(spl[2].charAt(1)), spl[3]);
          }
          //Game#1 M A2 A5 2 1
          else if (spl[1] === "M") {
              var nums = [];
              for (i = 4; i < spl.length; i++)
                  nums.push(Number(spl[i]));
              board.serverMmove(spl[2].charAt(0), Number(spl[2].charAt(1)),
                      spl[3].charAt(0), Number(spl[3].charAt(1)),
                      nums);
          }
          //Game#1 Time 170 200
          else if (spl[1] === "Time") {
            var wt = Number(spl[2]);
            var bt = Number(spl[3]);
            lastWt = wt;
            lastBt = bt;

            var now = new Date();
            lastTimeUpdate = now.getHours()*60*60 + now.getMinutes()*60+now.getSeconds();


            $('.player1-time:first').html(parseInt(wt/60)+':'+getZero(wt%60));
            $('.player2-time:first').html(parseInt(bt/60)+':'+getZero(bt%60));

            if(!board.timer_started) {
              board.timer_started = true;
              startTime(true);
            }
          }
          //Game#1 RequestUndo
          else if (spl[1] === "RequestUndo") {
            alert("info", "Your opponent requests to undo the last move");
            $('#undo').attr('src', icon_path + 'otherrequestedundo.svg');
          }
          //Game#1 RemoveUndo
          else if (spl[1] === "RemoveUndo") {
            alert("info", "Your opponent removes undo request");
            $('#undo').attr('src', icon_path + 'requestundo.svg');
          }
          //Game#1 Undo
          else if (spl[1] === "Undo") {
            board.undo();
            alert("info", "Game has been UNDOed by 1 move");
            $('#undo').attr('src', icon_path + 'requestundo.svg');
          }
          //Game#1 OfferDraw
          else if (spl[1] === "OfferDraw") {
              document.getElementById("draw").src = icon_path + 'hand-other-offered.png';
              alert("info", "Draw is offered by your opponent");
          }
          //Game#1 RemoveDraw
          else if (spl[1] === "RemoveDraw") {
              document.getElementById("draw").src = icon_path + 'offer-hand.png';
              alert("info", "Draw offer is taken back by your opponent");
          }
          //Game#1 Over result
          else if (spl[1] === "Over") {
              document.title = "Tak";
              var spl = e.split(" ");
              board.scratch = true;
              board.result = spl[2];
              board.notate(spl[2]);

              var msg = "Game over <span class='bold'>" + spl[2] + "</span><br>";
              var res;
              var type;

              if(spl[2] === "R-0" || spl[2] === "0-R")
                type = "making a road";
              else if (spl[2] === "F-0" || spl[2] === "0-F")
                type = "having more flats";
              else if (spl[2] === "1-0" || spl[2] === "0-1")
                type = "resignation or time";

              if(spl[2] === "R-0" || spl[2] === "F-0" || spl[2] === "1-0") {
                if(board.observing === true) {
                  msg += "White wins by "+type;
                }
                else if(board.mycolor === "white") {
                  msg += "You win by "+type;
                } else {
                  msg += "Your opponent wins by "+type;
                }
              } else if (spl[2] === "1/2-1/2") {
                msg += "The game is a draw!";
              } else if (spl[2] === "0-0") {
                msg += "The game is aborted!";
              } else {//black wins
                if(board.observing === true) {
                  msg += "Black wins by "+type;
                }
                else if(board.mycolor === "white") {
                  msg += "Your opponent wins by "+type;
                } else {
                  msg += "You win by "+type;
                }
              }

              document.getElementById("scratchsize").disabled = false;
              stopTime();

              $('#gameoveralert-text').html(msg);
              $('#gameoveralert').modal('show');
          }
          //Game#1 Abandoned
          else if (spl[1] === "Abandoned.") {
              //Game#1 Abandoned. name quit
              var spl = e.split(" ");
              document.title = "Tak";
              board.scratch = true;

              if(board.mycolor === "white"){
                board.notate("1-0");
                board.result = "1-0";
              }
              else {
                board.notate("0-1");
                board.result = "0-1";
              }

              var msg = "Game abandoned by " + spl[2] + ".";
              if(!board.observing)
                msg += " You win!";

              document.getElementById("scratchsize").disabled = false;
              stopTime();

              $('#gameoveralert-text').html(msg);
              $('#gameoveralert').modal('show');
          }
          //Game#1 [Mark/Unmark]_[Player/Observer] field.
          else if (spl[1] === "Mark_Player" || spl[1] === "Unmark_Player"
              || spl[1] === "Mark_Observer" || spl[1] === "Unmark_Observer") {
              var marked = spl[1].contains("Mark");
              var observer = spl[1].contains("Observer");
              board.mark(marked, observer, spl[2].trim());
          }
        }
      }
      else if (e.startsWith("Login or Register")) {
          server.send("Client " + server_greeting);

          if(localStorage.getItem('keeploggedin')==='true' && this.tries<3) {
            var uname = localStorage.getItem('usr');
            var token = localStorage.getItem('token');
            server.send("Login " + uname + " " + token);
            this.tries++;
          } else {
            localStorage.removeItem('keeploggedin');
            localStorage.removeItem('usr');
            localStorage.removeItem('token');
            $('#login').modal('show');
          }
      }
      //Registered ...
      else if (e.startsWith("Registered")) {
        alert("success", "You're registered! Check mail for password");
      }
      //Name already taken
      else if (e.startsWith("Name already taken")) {
        alert("danger", "Name is already taken");
      }
      //Can't register with guest in the name
      else if (e.startsWith("Can't register with guest in the name")) {
        alert("danger", "Can't register with guest in the name");
      }
      //Unknown format for username/email
      else if (e.startsWith("Unknown format for username/email")) {
        alert("danger", e);
      }
      //Authentication failure
      else if (e.startsWith("Authentication failure")) {
          console.log('failure');
          if(($('#login').data('bs.modal') || {}).isShown) {
            alert("danger", "Authentication failure");
          } else {
            localStorage.removeItem('keeploggedin');
            localStorage.removeItem('usr');
            localStorage.removeItem('token');
            $('#login').modal('show');
          }
      }
      //You're already logged in
      else if (e.startsWith("You're already logged in")) {
        alert("warning", "You're already logged in from another window");
        this.connection.close();
      }
      //Welcome kaka!
      else if (e.startsWith("Welcome ")) {
          this.tries = 0;
          $('#login').modal('hide');
          document.getElementById('login-button').textContent = 'Logout';
          this.timeoutvar = window.setInterval(this.keepalive, 30000);
          this.myname = e.split("Welcome ")[1].split("!")[0];
          alert("success", "You're logged in "+this.myname+"!");

          var rem = $('#keeploggedin').is(':checked');
          if( rem === true && !this.myname.startsWith("Guest")) {
            console.log('storing');
            var name = $('#login-username').val();
            var token = $('#login-pwd').val();

            localStorage.setItem('keeploggedin', 'true');
            localStorage.setItem('usr', name);
            localStorage.setItem('token', token);
          }
      }
      else if (e.startsWith("Message")) {
          var msg = e.split("Message ");
          alert("info", "Server says: " + msg[1]);
      }
      else if (e.startsWith("Error")) {
          var msg = e.split("Error:")[1];
          alert("danger", "Server says: "+msg);
      }
      else if (handleChatMessage(e)) {
        // chat message was handled.
      }
      else if (e.startsWith("CmdReply")) {
          var msg = e.split("CmdReply ")[1];
          var $cs = $('#chat-server');

          $cs.append('<span class="cmdreply">' + msg + '</span><br>');
          $cs.scrollTop($cs[0].scrollHeight);
      }
      //new seek
      else if (e.startsWith("Seek new")) {
          //Seek new 1 chaitu 5 180 15 W|B
          var spl = e.split(" ");

          var no = spl[2];
          var t = Number(spl[5]);
          var m = parseInt(t/60);
          var s = getZero(parseInt(t%60));

          var inc = spl[6];

          var p = spl[3];
          var sz = spl[4]+'x'+spl[4];

          img = icon_path + 'circle_any.svg';
          if(spl.length == 8) {
              img = icon_path + (spl[7] === 'W' ? 'circle_white.svg' : 'circle_black.svg');
          }
          img = '<img src="' + img + '"/>';

          var botGame = p.trim().toLowerCase().endsWith('bot');

          p = "<span class='playername " + (botGame ? '' : 'nonbot')
              + "' style='display: inline-block; width: 120px; text-align: center'>" + p + "</span>";
          sz = "<span class='badge' style='display: inline-block; width: 40px; text-align: center;'>"
              + sz + "</span>";
          var time = "<span style='display: inline-block; width: 60px; text-align: center;'>"
              + m + ":" + s + "</span>";
          inc = "<span style='display: inline-block; width: 40px;'>+" + inc + "s</span>";

          var val = img + p + sz + time + inc;

          var li = document.createElement('li');
          var a = document.createElement('a');
          li.className += ' seek' + no;
          a.innerHTML = val;
          a.onclick = function() {
              server.acceptseek(spl[2]);
            };
          li.appendChild(a);
          document.getElementById('seeklist').insertBefore(li,
              botGame ? null : document.getElementById('seeklist-botline'));

          var op = document.getElementById("seekcount");
          var humans = parseInt(new RegExp('-?\\d+(?= )').exec(op.innerHTML.toString().trim()));
          var bots = parseInt(new RegExp('-?\\d+(?=\\</s)').exec(op.innerHTML.toString().trim()));
          op.innerHTML = botGame ?
                '<span class="nonbot">' + humans + ' </span>&#183;<span class="botcount"> ' + ++bots + '</span>'
              : '<span class="nonbot">' + ++humans + ' </span>&#183;<span class="botcount"> ' + bots + '</span>';
      }
      //remove seek
      else if (e.startsWith("Seek remove")) {
          //Seek remove 1 chaitu 5 15
          var spl = e.split(" ");

          var no = spl[2];
          var game = $('.seek' + no);
          var playerName = game.find('.playername').html().toString().trim();
          var botGame = playerName.toLowerCase().endsWith('bot')
          game.remove();

          var op = document.getElementById("seekcount");
          var humans = parseInt(new RegExp('-?\\d+(?= )').exec(op.innerHTML));
          var bots = parseInt(new RegExp('-?\\d+(?=\\</s)').exec(op.innerHTML));
          op.innerHTML = botGame ?
                '<span class="nonbot">' + humans + ' </span>&#183;<span class="botcount"> ' + --bots + '</span>'
              : '<span class="nonbot">' + --humans + ' </span>&#183;<span class="botcount"> ' + bots + '</span>';
      }
      //Online players
      else if (e.startsWith("Online ")) {
          $('#onlineplayers').removeClass('hidden');
          var op = document.getElementById("onlineplayersbadge");
          op.innerHTML = Number(e.split("Online ")[1]);
      }
  },
  chat: function () {
      var msg = $('#chat-me').val();

      // directed chat message.
      if (msg.startsWith('.'))
      {
        // segment message.
        var match = /^.(\S*)/.exec(msg);
        if (!match) return;
        var type = match[1];
        var toUser, body;
        switch (type)
        {
          case 'w':
          case 'whisper':
            var match = /^.\S* (\S*) (.*)/.exec(msg);
            if (!match) return;
            toUser = match[1];
            body = match[2];
            msg = 'Tell ' + toUser + ' ' + body;
            break;
          case 'a':
          case 'all':
          case 'g':
          case 'global':
            match = /^.\S* (.*)/.exec(msg);
            if (!match) return;
            body = match[1];
            msg = 'Shout ' + body;
            break;
          case 'r':
          case 'respond':
            match = /^.\S* (.*)/.exec(msg);
            if (!match) return;
            body = match[1];
            msg = 'Tell ' + lastWhisper + ' ' + body;
        }
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
      this.send(msg);
      $('#chat-me').val('');
  },
  send: function (e) {
      if (this.connection && this.connection.readyState === 1)
          this.connection.send(e + "\n");
      else
          this.error("You are not logged on to the server");
  },
  error: function (e) {
      alert("danger", e);
  },
  seek: function () {
      var size = $('#boardsize').find(':selected').text();
      size = parseInt(size);
      var time = $('#timeselect').find(':selected').text();
      var inc = $('#incselect').find(':selected').text();
      var clrtxt = $('#colorselect').find(':selected').text();
      var clr='';
      if(clrtxt == 'White')
        clr = ' W';
      if(clrtxt == 'Black')
        clr = ' B';

      this.send("Seek "+size+" " + (time*60) + " " + inc + clr);
      $('#creategamemodal').modal('hide');
  },
  removeseek: function() {
      this.send("Seek 0 0 0");
      $('#creategamemodal').modal('hide');
  },
  draw: function() {
      if(board.scratch)
        return;
      else if(board.observing)
        return;

      var img = document.getElementById("draw");
      if(img.src.match("offer-hand")) {//offer
          img.src = icon_path + 'hand-i-offered.png';
          this.send("Game#" + board.gameno + " OfferDraw");
      } else if(img.src.match("hand-i-offered")) {//remove offer
          img.src = icon_path + 'offer-hand.png';
          this.send("Game#" + board.gameno + " RemoveDraw");
      } else {//accept the offer
          this.send("Game#" + board.gameno + " OfferDraw");
      }
  },
  undo: function() {
    if(board.observing)
      return;

    var img = document.getElementById("undo");
    if(img.src.match('requestundo')) {//request undo
      this.send("Game#" + board.gameno + " RequestUndo");
      img.src = icon_path + 'irequestedundo.svg';
      alert('info', 'Undo request sent');

    } else if (img.src.match('otherrequestedundo')) {//accept request
      this.send("Game#" + board.gameno + " RequestUndo");

    } else if (img.src.match('irequestedundo')) {//remove request
      this.send("Game#" + board.gameno + " RemoveUndo");
      img.src = icon_path + 'requestundo.svg';
      alert('info', 'Undo request removed');
    }
  },

  resign: function()
  {
    if(board.scratch) return;
    else if(board.observing) return;
    this.send("Game#" + board.gameno + " Resign");
  },

  setmark: function(marked, field)
  {
    var msg = "Game#" + board.gameno + (marked ? " Mark " : " Unmark ") + field;
    if (board.gameno == 0) return;
    this.send(msg);
  },

  acceptseek: function (e)
  {
    this.send("Accept " + e);
  },

  observegame: function (no)
  {
    if (board.observing === false && board.scratch === false) return;//don't observe game while playing another
    if (no === board.gameno) return;
    else this.send("Unobserve " + board.gameno);
    this.send("Observe " + no);
  }
};
