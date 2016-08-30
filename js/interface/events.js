var camera, scene, renderer, light, canvas, controls = null;
var raycaster = new THREE.Raycaster();
var highlighter;
var mouse = new THREE.Vector2();
var offset = new THREE.Vector3();

/*
 * Called on file initialization.
 */
function init() {
    // init TSS.
    initTSS();

    // load the user settings.
    loadSettings();
    
    // construct geometries.
    constructGeometries();
    
    canvas = document.getElementById("gamecanvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    camera = new THREE.PerspectiveCamera(70, canvas.width / canvas.height, 1, 2000);
    camera.position.set(0, canvas.width / 2, canvas.height / 2);

    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer({canvas: canvas,
        antialias: antialiasing_mode});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x111111, 1);

    document.body.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.minDistance = 200;
    controls.maxDistance = 1500;
    controls.enableKeys = false;
    var ua = navigator.userAgent.toLowerCase();
    if (ua.indexOf("android") > -1 || ua.indexOf("iphone") > -1 ||
            ua.indexOf("ipod") > -1 || ua.indexOf("ipad") > -1)
        controls.zoomSpeed = 0.5;

    var material = new THREE.LineBasicMaterial({color: 0x0000f0});
    var geometry = new THREE.TorusGeometry(sq_size / 2 + 5, 3, 16, 100);
    //geometry.vertices.shift();
    highlighter = new THREE.Mesh(geometry, material);
    highlighter.rotateX(Math.PI / 2);

    canvas.addEventListener('mousedown', onDocumentMouseDown, false);
    canvas.addEventListener('mouseup', onDocumentMouseUp, false);
    canvas.addEventListener('mousemove', onDocumentMouseMove, false);

    board.init(5, "white", true);
}

/*
 * Called on window scaling.
 */
function onWindowResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    renderer.setSize(canvas.width, canvas.height);

    camera.aspect = canvas.width / canvas.height;
    camera.updateProjectionMatrix();

    $('#chat').offset({ top: $('nav').height() + 5 });
    $('#chat-toggle-button').offset({ top: $('nav').height() + 7 });
    $('#chat').height(window.innerHeight - $('nav').height() - 85
        + (localStorage.getItem('hide-send')==='true' ? 34 : 0));

    if (localStorage.getItem('auto_chat')!=='false')
    {
        if(isBreakpoint('xs') || isBreakpoint('sm')) {
            hidechat();
            hidermenu();
        } else {
            showchat();
            showrmenu();
        }
    }
}

function onDocumentMouseMove(e) {
    e.preventDefault();
    var x = e.clientX - canvas.offsetLeft;
    var y = e.clientY - canvas.offsetTop;
    mouse.x = (x / canvas.width) * 2 - 1;
    mouse.y = -(y / canvas.height) * 2 + 1;

    board.mousemove();
}

function onDocumentMouseDown(e) {
    e.preventDefault();

    var x = e.clientX - canvas.offsetLeft;
    var y = e.clientY - canvas.offsetTop;
    mouse.x = (x / canvas.width) * 2 - 1;
    mouse.y = -(y / canvas.height) * 2 + 1;

    if(board.movecount !== board.moveshown)
        return;

    if (e.button === 2)
        board.rightclick();
    else {
        if(board.movecount !== board.moveshown)
            return;
        board.leftclick(e);
    }
}
function onDocumentMouseUp(e) {
    if (e.button === 2)
        board.rightup();
}
function output(e) {
    console.log("output:" + e);
}

function buttonclick() {
    var input = document.getElementById("input");
    var data = input.value;
    input.value = "";
    server.send(data);
}

function scratchbutton(size) {
    if (board.observing)
        server.send("Unobserve " + board.gameno);
    if (board.scratch || board.observing) {
        board.clear();
        board.init(size, "white", true);
    }
}
function rmenu() {
    if($('#rmenu').hasClass('hidden'))
        showrmenu();
    else
        hidermenu();
}
function showrmenu() {
    $('#notation-toggle-text').html('<<<br>n<br>o<br>t<br>a<br>t<br>i<br>o<br>n');
    $('#rmenu').removeClass('hidden');
}
function hidermenu() {
    $('#rmenu').addClass('hidden');
    $('#notation-toggle-text').html('>><br>n<br>o<br>t<br>a<br>t<br>i<br>o<br>n');
}
function zoom(out) {
    console.log('zoom', out, controls);
    if (out)
        controls.constraint.dollyOut(1.5);
    else
        controls.constraint.dollyIn(1.5);
}
function loadtpn() {
    var tpn = window.prompt("Paste TPS here", "");
    if (!tpn)
        return;
    board.loadtpn(tpn);
}
function statusclick() {
    var inp = document.getElementById('status-inp');
    console.log('input: '+inp.value);
    server.send(inp.value);
    inp.innerHTML='';
}
function volume_change() {
    var img = document.getElementById("volume-img");
    var movesound = document.getElementById("move-sound");
    var chimesound = document.getElementById("chime-sound");

    if(img.src.match("mute")) {
        img.src = "images/ic_volume_up_black_24px.svg";
        movesound.muted = false;
        chimesound.muted = false;

        movesound.play();
        localStorage.setItem('sound', 'true');
    } else {
        img.src = "images/ic_volume_mute_black_24px.svg";
        movesound.muted = true;
        chimesound.muted = true;

        localStorage.setItem('sound', 'false');
    }
}
function togglechat() {
    if($('#chat').hasClass('hidden')) {
        showchat()
    } else {
        hidechat();
    }
}
function showchat() {
    $('#chat-toggle-button').css('right', 185);
    $('#chat-toggle-text').html('>><br>c<br>h<br>a<br>t');
    $('#chat').removeClass('hidden');
}
function hidechat() {
    $('#chat-toggle-button').css('right', 0);
    $('#chat-toggle-text').html('<<<br>c<br>h<br>a<br>t');
    $('#chat').addClass('hidden');
}
function isBreakpoint( alias ) {
    return $('.device-' + alias).is(':hidden');
}
function getHeader(key, val) {
  return '['+key+' "'+val+'"]\r\n';
}
function downloadNotation() {
  var p1 = $('.player1-name:first').html();
  var p2 = $('.player2-name:first').html();
  var now = new Date();
  var dt = (now.getYear()-100)+'.'+(now.getMonth()+1)+'.'+now.getDate()+' '+now.getHours()+'.'+getZero(now.getMinutes());

  $('#download_notation').attr('download', p1+' vs '+p2+' '+dt+'.ptn');

  var res='';
  res += getHeader('Site', 'PlayTak.com');
  res += getHeader('Date', '20'+(now.getYear()-100)+'.'+(now.getMonth()+1)+'.'+now.getDate());
  res += getHeader('Player1', p1);
  res += getHeader('Player2', p2);
  res += getHeader('Size', board.size);
  res += getHeader('Result', board.result);
  res += '\r\n';

  var count=1;

  $('#moveslist tr').each(function() {
    $('td', this).each(function() {
      var val = $(this).text();
      res += val;

      if(count%3 === 0)
        res += '\r\n';
      else
        res += ' ';

      count++;
    })
  });
  $('#download_notation').attr('href', 'data:text/plain;charset=utf-8,'+encodeURIComponent(res));
  console.log('res='+res);
}

function showPrivacyPolicy() {
    $('#help-modal').modal('hide');
    $('#privacy-modal').modal('show');
}

function undoButton() {
  if(board.scratch)
    board.undo();
  else
    server.undo();
}

function fastrewind() {
  board.showmove(1);
}

function stepback() {
  board.showmove(board.moveshown-1);
}

function stepforward() {
  board.showmove(board.moveshown+1);
}

function fastforward() {
  board.showmove(board.movecount);
}
