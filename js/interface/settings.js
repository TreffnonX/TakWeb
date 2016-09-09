var antialiasing_mode = false;

/*
 * Settings loaded on initialization. Try to keep them in the order of the window.
 * First the left-hand div, then the right-hand div.
 */
function loadSettings() {
  // load TSS.
  if(localStorage.getItem('tss')) {
    var rawTSS = decodeURI(localStorage.getItem('tss'));
    var parsedTSS = parseTSS(rawTSS);
    var customTSS = objectifyTSSTree(parsedTSS, tssDefinition);
    tss = mergeTSSTrees(tss, customTSS);
  }

  // load the setting for wall orientation.
  if(localStorage.getItem('diagonal_walls')==='true') {
    document.getElementById('wall-orientation').checked = true;
    diagonal_walls = true;
  }
  
  // load the setting for table visibility.
  if(localStorage.getItem('table')==='true') {
    document.getElementById('table-checkbox').checked = true;
  }

  // load the setting for piece size.
  if(localStorage.getItem('piece_size')!==null) {
    piece_size = parseInt(localStorage.getItem('piece_size'));
    document.getElementById('piece-size-display').innerHTML = piece_size;
    document.getElementById('piece-size-slider').value = piece_size;
  }

  // load white piece style.
  if (localStorage.getItem('piece_style_white')!==null) {
    var styleName = localStorage.getItem('piece_style_white');
    white_piece_tex_name = 'resources/images/pieces/white_' + styleName + '_pieces.png';
    if (new THREE.TextureLoader().load(white_piece_tex_name)===null)
    {
      styleName = 'simple';
      localStorage.setItem('piece_style_white', styleName);
      white_piece_tex_name = 'resources/images/pieces/white_' + styleName + '_pieces.png';
    }
    white_caps_tex_name = 'resources/images/pieces/white_' + styleName + '_caps.png';
    document.getElementById('piece-style-white-' + styleName).checked = true;
  }
  
  // load black piece style.
  if (localStorage.getItem('piece_style_black')!==null) {
    var styleName = localStorage.getItem('piece_style_black');
    black_piece_tex_name = 'resources/images/pieces/black_' + styleName + '_pieces.png';
    if (new THREE.TextureLoader().load(black_piece_tex_name)===null)
    {
      styleName = 'simple';
      localStorage.setItem('piece_style_black', styleName);
      black_piece_tex_name = 'resources/images/pieces/black_' + styleName + '_pieces.png';
    }
    black_piece_tex_name = 'resources/images/pieces/black_' + styleName + '_pieces.png';
    black_caps_tex_name = 'resources/images/pieces/black_' + styleName + '_caps.png';
    document.getElementById('piece-style-black-' + styleName).checked = true;
  }
  
  // load white board style.
  if (localStorage.getItem('board_style_white')!==null) {
    var styleName = localStorage.getItem('board_style_white');
    white_square_tex_name = 'resources/images/board/white_' + styleName + '.png';
    if (new THREE.TextureLoader().load(white_square_tex_name)===null)
    {
      styleName = 'simple';
      localStorage.setItem('board_style_white', styleName);
      white_square_tex_name = 'resources/images/board/white_' + styleName + '_pieces.png';
    }
    document.getElementById('board-style-white-' + styleName).checked = true;
  }
  
  // load black board style.
  if (localStorage.getItem('board_style_back')!==null) {
    var styleName = localStorage.getItem('board_style_back');
    black_square_tex_name = 'resources/images/board/black_' + styleName + '.png';
    if (new THREE.TextureLoader().load(black_square_tex_name)===null)
    {
      styleName = 'simple';
      localStorage.setItem('board_style_black', styleName);
      black_square_tex_name = 'resources/images/board/black_' + styleName + '_pieces.png';
    }
    document.getElementById('board-style-black-' + styleName).checked = true;

    // load notation position and height.
    if (localStorage.getItem('notation_position')!==null)
    {
      document.getElementById('notation_area').style.top = localStorage.getItem('notation_position') + "px";
    }
    if (localStorage.getItem('notation_height')!==null)
    {
      document.getElementById('notationbar').style.height = localStorage.getItem('notation_height') + "px";
    }

    notationSizeCheck();
  }

  // load the setting for antialiasing.
  if(localStorage.getItem('antialiasing_mode')==='true') {
    document.getElementById('antialiasing-checkbox').checked = true;
    antialiasing_mode = true;
  }

  // load the setting for ui-style.
  if (!localStorage.getItem('dark_ui'))
  {
    localStorage.setItem('dark_ui', 'true');
  }
  if(localStorage.getItem('dark_ui')==='true')
  {
    document.getElementById('uistyle-checkbox').checked = true;
    checkboxUIStyle();
  }
  
  // load whether or not the 'Send' button should be hidden.
  if (localStorage.getItem('hide-send')==='true')
  {
    document.getElementById('hide-send-checkbox').checked = true;
    document.getElementById('send-button').style.display = "none";
    $('#chat').height(window.innerHeight - $('nav').height() - 51);
  }

  //load setting for hide chat time
  if (localStorage.getItem('hide-chat-time')==='true')
  {
    document.getElementById('hide-chat-time').checked = true;
    $('.chattime').each(function(index) {
      $(this).addClass('hidden');
    });
  }

  // load the setting for automatically opening and closing the chat on window resize.
  if(localStorage.getItem('auto_chat')==='false') {
    document.getElementById('auto-open-chat-checkbox').checked = false;
  }

  // load the setting for automatically rotating the board, when assigned player 2.
  if(localStorage.getItem('auto_rotate')==='false') {
    document.getElementById('auto-rotate-checkbox').checked = false;
  }
}

function textFieldTSS() {
  var rawTSS = $('#tss-field').val();
  $('#tss-field').val('');
  console.log(rawTSS);
  var parsedTSS = parseTSS(rawTSS);
  var tssTree = objectifyTSSTree(parsedTSS, tssDefinition);
  tss = mergeTSSTrees(tss, tssTree);
  localStorage.setItem('tss', encodeURI(toString(tss, 'tss')));
  board.updatepieces();
}

/*
 * Notify checkbox change for checkbox:
 *   Diagonal walls
 */
function checkboxDiagonalWalls() {
  if (document.getElementById('wall-orientation').checked) {
    localStorage.setItem('diagonal_walls', 'true');
    diagonal_walls = true;
  } else {
    localStorage.setItem('diagonal_walls', 'false');
    diagonal_walls = false;
  }
  board.updatepieces();
}

/*
 * Notify slider movement:
 *   Piece size
 */
function sliderPieceSize(newSize) {
  localStorage.setItem('piece_size', newSize);
  document.getElementById('piece-size-display').innerHTML=newSize;
  piece_size = parseInt(newSize);
}

/*
 * Notify radio button check:
 *   Piece style - white
 */
function radioPieceStyleWhite(styleName) {
  document.getElementById('piece-style-white-' + styleName).checked = true;
  white_piece_tex_name = 'resources/images/pieces/white_' + styleName + '_pieces.png';
  white_caps_tex_name = 'resources/images/pieces/white_' + styleName + '_caps.png';
  localStorage.setItem('piece_style_white', styleName);
  board.updatepieces();
}

/*
 * Notify radio button check:
 *   Piece style - black
 */
function radioPieceStyleBlack(styleName) {
  document.getElementById('piece-style-black-' + styleName).checked = true;
  black_piece_tex_name = 'resources/images/pieces/black_' + styleName + '_pieces.png';
  black_caps_tex_name = 'resources/images/pieces/black_' + styleName + '_caps.png';
  localStorage.setItem('piece_style_black', styleName);
  board.updatepieces();
}

/*
 * Notify radio button check:
 *   Board style - black
 */
function radioBoardStyleBlack(styleName) {
  document.getElementById('board-style-black-' + styleName).checked = true;
  black_square_tex_name = 'resources/images/board/black_' + styleName + '.png';
  localStorage.setItem('board_style_back', styleName);
  board.updateboard();
}

/*
 * Notify radio button check:
 *   Board style - white
 */
function radioBoardStyleWhite(styleName) {
  document.getElementById('board-style-white-' + styleName).checked = true;
  white_square_tex_name = 'resources/images/board/white_' + styleName + '.png';
  localStorage.setItem('board_style_white', styleName);
  board.updateboard();
}

/*
 * Notify checkbox change for checkbox:
 *   Antialiasing
 */
function checkboxAntialiasing() {
  if (document.getElementById('antialiasing-checkbox').checked) {
    localStorage.setItem('antialiasing_mode', 'true');
  } else {
    localStorage.setItem('antialiasing_mode', 'false');
  }
}

/**
 * Notify checkbox change for checkbox:
 *   UI-Style.
 */
function checkboxUIStyle()
{
  if (document.getElementById('uistyle-checkbox').checked) {
    localStorage.setItem('dark_ui', 'true');
    document.getElementById('ui-css').href = 'resources/css/style/dark.css';
    var icons = document.getElementsByClassName('icon');
    for (var i = 0; i < icons.length; ++i)
    {
      icons[i].src = icons[i].src.replace(new RegExp('/icons/'), '/icons_inv/');
    }
    icon_path = 'resources/images/icons_inv/';
  } else {
    localStorage.setItem('dark_ui', 'false');
    document.getElementById('ui-css').href = 'resources/css/style/classic.css';
    var icons = document.getElementsByClassName('icon');
    for (var i = 0; i < icons.length; ++i)
    {
      icons[i].src = icons[i].src.replace(new RegExp('/icons_inv/'), '/icons/');
    }
    icon_path = 'resources/images/icons/';
  }
}

/*
 * Notify checkbox change for checkbox:
 *   Hide 'Send' button
 */
function checkboxHideSend() {
  if (document.getElementById('hide-send-checkbox').checked) {
    localStorage.setItem('hide-send', 'true');
    document.getElementById('send-button').style.display = "none";
    $('#chat').height(window.innerHeight - $('nav').height() - 51);
  } else {
    localStorage.setItem('hide-send', 'false');
    document.getElementById('send-button').style.display = "initial";
    $('#chat').height(window.innerHeight - $('nav').height() - 85);
  }
  
}

/*
 * Notify checkbox change for checkbox:
 * Hide chat time
 */
function checkboxHideChatTime() {
  if (document.getElementById('hide-chat-time').checked) {
    localStorage.setItem('hide-chat-time', 'true');
    $('.chattime').each(function(index) {
      $(this).addClass('hidden');
    });
  } else {
    localStorage.setItem('hide-chat-time', 'false');
    $('.chattime').each(function(index) {
      $(this).removeClass('hidden');
    });
  }
}

/*
 * Notify checkbox change for checkbox:
 *   Show/Hide chat on window resize
 */
function checkboxAutoOpenChat() {
  if (document.getElementById('auto-open-chat-checkbox').checked) {
    localStorage.setItem('auto_chat', 'true');
  } else {
    localStorage.setItem('auto_chat', 'false');
  }
}

/*
 * Notify checkbox change for checkbox:
 *   Rotate board when player 2
 */
function checkboxAutoRotate() {
  if (document.getElementById('auto-rotate-checkbox').checked) {
    localStorage.setItem('auto_rotate', 'true');
  } else {
    localStorage.setItem('auto_rotate', 'false');
  }
}

/*
 * Notify checkbox change for checkbox:
 *   Show table
 */
function checkboxTable() {
  if (document.getElementById('table-checkbox').checked) {
    localStorage.setItem('table', 'true');
    board.table.visible = true;
  } else {
    localStorage.setItem('table', 'false');
    board.table.visible = false;
  }
}
