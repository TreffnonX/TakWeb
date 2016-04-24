var stack_dist = 105;
var piece_size = 88;
var piece_height = 15;
var sq_size = 90;
var sq_height = 15;
var capstone_height = 70;
var capstone_radius = 30;
var stack_selection_height = 60;
var border_size = 30;
var letter_size = 12;
var table_width = 1280;
var table_depth = 920;
var table_height = 50;
var digit_adjustment = 2;
var light_position = [0, 800, -45];
var light_radius = [1.8, 1600];
var diagonal_walls = false;
var render_light = false;
var burring_depth = 4;
var burring_height = 1;
var burring_vertical = 1;
var capstone_ring_width = 0.5;
var capstone_ring_depth = 0.5;
var capstone_ring_burring = 0.5;
var capstone_rings = [9.3, 52.5, 57.3];
var capstone_top_rings = [22.27, 24.43];
var white_piece_geometry;
var black_piece_geometry;
var white_caps_geometry;
var black_caps_geometry;
var white_square_tex_name = 'images/board/white_simple.png';
var black_square_tex_name = 'images/board/black_simple.png';
var white_piece_tex_name = 'images/pieces/white_simple_pieces.png';
var black_piece_tex_name = 'images/pieces/black_simple_pieces.png';
var white_caps_tex_name = 'images/pieces/white_simple_caps.png';
var black_caps_tex_name = 'images/pieces/black_simple_caps.png';
var table_tex_name = 'images/wooden_table.png';

var board = {
    size: 0,
    totcaps: 0,
    tottiles: 0,
    whitepiecesleft: 0,
    blackpiecesleft: 0,
    mycolor: "white",
    movecount: 0,
    moveshown: 0,
    scratch: true,
    table: null,
    sq: [],
    board_objects: [],
    piece_objects: [],
    move: {start: null, end: null, dir: 'U', squares: []},
    highlighted: null,
    totalhighlighted: null,
    selected: null,
    selectedStack: null,
    ismymove: false,
    server: null,
    gameno: 0,
    boardside: "white",
    result: "",
    observing: false,
    position: {x: 0, y: 0, endx: 0, endz: 0},
    board_history: [],
    timer_started: false,
    init: function (sz, col, scr, obs) {
        this.size = sz;

        if (sz === 3) {
            this.totcaps = 0;
            this.tottiles = 10;
        } else if (sz === 4) {
            this.totcaps = 0;
            this.tottiles = 15;
        } else if (sz === 5) {
            this.totcaps = 1;
            this.tottiles = 21;
        } else if (sz === 6) {
            this.totcaps = 1;
            this.tottiles = 30;
        } else if (sz === 7) {
            this.totcaps = 2;
            this.tottiles = 40;
        } else {
            this.totcaps = 2;
            this.tottiles = 50;
        }
        this.whitepiecesleft = this.tottiles + this.totcaps;
        this.blackpiecesleft = this.tottiles + this.totcaps;

        this.mycolor = col;
        this.sq = [];
        this.movecount = 0;
        this.moveshown = 0;
        this.scratch = scr;
        this.board_objects = [];
        this.piece_objects = [];
        this.highlighted = null;
        this.selected = null;
        this.selectedStack = null;
        this.gameno = 0;
        this.move = {start: null, end: null, dir: 'U', squares: []};
        this.result = "";
        this.observing = typeof obs !== 'undefined' ? obs : false;
        this.ismymove = this.checkifmymove();
        this.board_history = [];
        this.timer_started = false;

        var bp = [];
        for (var i = 0; i < this.size; i++) {
            this.sq[i] = [];
            for (var j = 0; j < this.size; j++) {
                this.sq[i][j] = [];
                bp.push([]);
            }
        }
        this.board_history.push(bp);
        
        this.addtable();
        this.addlight()
        this.addboard();
        this.addpieces();

        document.getElementById("player-opp").className = "selectplayer";
        document.getElementById("player-me").className = "";

        if (this.mycolor !== this.boardside)
            this.reverseboard();
    },
    addtable: function() {
        var table_texture = THREE.ImageUtils.loadTexture(table_tex_name);
        var table_material = new THREE.MeshLambertMaterial({map: table_texture});
        table_material.magFilter = THREE.LinearFilter;
        table_material.minFilter = THREE.LinearMipMapFilter;
        table_material.anisotropy = 1;
        var geometry = constructBurredBox(table_width, table_height, table_depth, 5, 5, 5);
        this.table = new THREE.Mesh(geometry, table_material);
        this.table.position.set(0, -(table_height + sq_height) / 2, -sq_size / 2);
        this.table.ispassive = true;
        scene.add(this.table);
        if(localStorage.getItem('table')!=='true') {
          this.table.visible = false;
        }
    },
    addlight: function() {
        var light = new THREE.PointLight(0xAAAAAA, light_radius[0], light_radius[1]);
        light.position.x = light_position[0];
        light.position.y = light_position[1];
        light.position.z = light_position[2];
        light.ispassive = true;
        scene.add(light);
        var hemisphereLight = new THREE.HemisphereLight( 0xFFFFFF, 0xFFFFFF, 0.6);
        hemisphereLight.color.setHSL(0.15, 0.1, 0.7);
        hemisphereLight.groundColor.setHSL(0.1, 0.8, 1);
        hemisphereLight.ispassive = true;
        scene.add(hemisphereLight);
    },
    addboard: function () {
        var white_texture = THREE.ImageUtils.loadTexture(white_square_tex_name);
        var black_texture = THREE.ImageUtils.loadTexture(black_square_tex_name);
        
        var white_material = new THREE.MeshLambertMaterial({map: white_texture});
        var black_material = new THREE.MeshLambertMaterial({map: black_texture});
        white_material.magFilter = THREE.LinearMipMapFilter;
        white_material.minFilter = THREE.LinearMipMapFilter;
        white_material.anisotropy = renderer.getMaxAnisotropy();
        black_material.magFilter = THREE.LinearMipMapFilter;
        black_material.minFilter = THREE.LinearMipMapFilter;
        black_material.anisotropy = renderer.getMaxAnisotropy();

        var geometry = new THREE.BoxGeometry(sq_size, sq_height, sq_size);
        geometry.center();

        var startx = -(this.size * sq_size) / 2.0 + sq_size / 2;
        var startz = -(this.size * sq_size) / 2.0;

        this.position.x = startx;
        this.position.z = startz;
        this.position.endx = startx + this.size * sq_size;
        this.position.endz = startz + this.size * sq_size;

        for (i = 0; i < this.size; i++) {
            for (j = 0; j < this.size; j++) {
                square = new THREE.Mesh(geometry, ((i + j) % 2) ? white_material : black_material);
                square.position.set(startx + i * sq_size, 0, startz + j * sq_size);

                square.file = i;
                square.rank = this.size - 1 - j;
                square.isboard = true;

                this.board_objects.push(square);
                this.sq[i][j].board_object = square;
                scene.add(square);
            }
        }

        // board border.
        var board_tex = THREE.ImageUtils.loadTexture('images/board.png');
        var border_material = new THREE.MeshLambertMaterial({map: board_tex});
        border_material.magFilter = THREE.LinearMipMapFilter;
        border_material.minFilter = THREE.LinearMipMapFilter;
        border_material.anisotropy = renderer.getMaxAnisotropy();
        geometry = new constructBurredBox(this.size * sq_size + 2 * border_size, piece_height, this.size * sq_size + 2 * border_size, 6, 1.5, 0);
        var board = new THREE.Mesh(geometry, border_material);
        board.position.set(0, -0.5, -sq_size / 2);
        board.ispassive = true;
        scene.add(board);

        var material = new THREE.MeshLambertMaterial({color: 0xFFF5B5});
        for (var i = 0; i < this.size; i++) {
            geometry = new THREE.TextGeometry(String.fromCharCode('A'.charCodeAt(0) + i),
                    {size: letter_size, height: 1, font: 'helvetiker', weight: 'normal'});

            var letter = new THREE.Mesh(geometry, material);
            letter.rotateX(-Math.PI / 2);
            letter.position.set(this.position.x - letter_size / 2 + i * sq_size, sq_height / 2,
                    this.position.endz - border_size / 2 - letter_size);
            letter.ispassive = true;
            scene.add(letter);

            geometry = new THREE.TextGeometry(String.fromCharCode('1'.charCodeAt(0) + i),
                    {size: letter_size, height: 1, font: 'helvetiker', weight: 'normal'});
            letter = new THREE.Mesh(geometry, material);
            letter.rotateX(-Math.PI / 2);
            letter.position.set(this.position.x - sq_size / 2 - border_size / 2 - letter_size / 2 + digit_adjustment * 2, sq_height / 2,
                    this.position.endz - border_size - sq_size / 2 - letter_size / 2 - digit_adjustment - i * sq_size);
            letter.ispassive = true;
            scene.add(letter);
        }
        for (var i = this.size - 1; i >= 0; i--) {
            geometry = new THREE.TextGeometry(String.fromCharCode('A'.charCodeAt(0) + i),
                    {size: letter_size, height: 1, font: 'helvetiker', weight: 'normal'});
            var letter = new THREE.Mesh(geometry, material);
            letter.rotateX(Math.PI / 2);
            letter.rotateY(Math.PI);
            letter.position.set(this.position.x + letter_size / 2 + i * sq_size, sq_height / 2,
                    this.position.z - sq_size / 2 - border_size / 2 - letter_size / 2);
            letter.ispassive = true;
            scene.add(letter);

            geometry = new THREE.TextGeometry(String.fromCharCode('1'.charCodeAt(0) + i),
                    {size: letter_size, height: 1, font: 'helvetiker', weight: 'normal'});
            letter = new THREE.Mesh(geometry, material);
            letter.rotateX(-Math.PI / 2);
            letter.rotateZ(Math.PI);
            letter.position.set(this.position.endx - sq_size / 2 + border_size / 2 + letter_size / 2 - digit_adjustment * 2, sq_height / 2,
                    this.position.endz - border_size - sq_size / 2 - letter_size * 1.5 - digit_adjustment - i * sq_size);
            letter.ispassive = true;
            scene.add(letter);
        }
        this.position.x -= border_size;
        this.position.z -= border_size;
        this.position.endx += border_size;
        this.position.endz += border_size;
    },
    addpieces: function () {
        var white_texture = THREE.ImageUtils.loadTexture(white_piece_tex_name);
        var black_texture = THREE.ImageUtils.loadTexture(black_piece_tex_name);
        var white_cap_texture = THREE.ImageUtils.loadTexture(white_caps_tex_name);
        var black_cap_texture = THREE.ImageUtils.loadTexture(black_caps_tex_name);
        
        var white_material = new THREE.MeshLambertMaterial({map: white_texture});
        var black_material = new THREE.MeshLambertMaterial({map: black_texture});
        var white_cap_material = new THREE.MeshLambertMaterial({map: white_cap_texture});
        var black_cap_material = new THREE.MeshLambertMaterial({map: black_cap_texture});
        white_material.magFilter = THREE.LinearFilter;
        white_material.minFilter = THREE.LinearMipMapFilter;
        white_material.anisotropy = 1;
        black_material.magFilter = THREE.LinearFilter;
        black_material.minFilter = THREE.LinearMipMapFilter;
        black_material.anisotropy = 1;
        white_cap_material.magFilter = THREE.LinearFilter;
        white_cap_material.minFilter = THREE.LinearMipMapFilter;
        white_cap_material.anisotropy = 1;
        black_cap_material.magFilter = THREE.LinearFilter;
        black_cap_material.minFilter = THREE.LinearMipMapFilter;
        black_cap_material.anisotropy = 1;

        var piece;
        var whitePieces = [];
        var whiteCaps = [];
        var blackPieces = [];
        var blackCaps = [];
        for (i = 0; i < this.tottiles; i++) {
            piece = new THREE.Mesh(white_piece_geometry, white_material);
            piece.iswhitepiece = true;
            piece.isstanding = false;
            piece.onsquare = null;
            piece.isboard = false;
            piece.iscapstone = false;
            this.piece_objects.push(piece);
            whitePieces.push(piece);

            piece = new THREE.Mesh(black_piece_geometry, black_material);
            piece.iswhitepiece = false;
            piece.isstanding = false;
            piece.onsquare = null;
            piece.isboard = false;
            piece.iscapstone = false;
            this.piece_objects.push(piece);
            blackPieces.push(piece);
        }
        for (i = 0; i < this.totcaps; i++) {
            piece = new THREE.Mesh(white_caps_geometry, white_cap_material);
            piece.iswhitepiece = true;
            piece.isstanding = true;
            piece.onsquare = null;
            piece.isboard = false;
            piece.iscapstone = true;
            this.piece_objects.push(piece);
            whiteCaps.push(piece);

            piece = new THREE.Mesh(black_caps_geometry, black_cap_material);
            piece.iswhitepiece = false;
            piece.isstanding = true;
            piece.onsquare = null;
            piece.isboard = false;
            piece.iscapstone = true;
            this.piece_objects.push(piece);
            blackCaps.push(piece);
        }
        this.arrangepieces(whitePieces, whiteCaps, blackPieces, blackCaps);
    },
    arrangepieces: function(whitePieces, whiteCaps, blackPieces, blackCaps) {
      var piece;
      for (i = 0; i < this.tottiles; i++) {
        var stackno = Math.floor(i / 10);
        var stackheight = i % 10;
        piece = whitePieces[i];
        piece.position.set(this.position.endx + 50, stackheight * piece_height,
            this.position.endz - piece_size - stackno * stack_dist);
        scene.add(piece);
        piece = blackPieces[i];
        piece.position.set(this.position.x - 50 - piece_size, stackheight * piece_height,
            this.position.z + stackno * stack_dist);
        scene.add(piece);
      }
      for (i = 0; i < this.totcaps; i++) {
        var stackno = Math.ceil(this.tottiles / 10) + i;
        piece = whiteCaps[i];
        piece.position.set(this.position.endx + 50, (capstone_height - sq_height) / 2,
            this.position.endz - piece_size - stackno * stack_dist);
        scene.add(piece);
        piece = blackCaps[i];
        piece.position.set(this.position.x - 50 - piece_size, (capstone_height - sq_height) / 2,
            this.position.z + stackno * stack_dist);
        scene.add(piece);
      }
    },
    updateboard: function () {
        // reload textures.
        var white_texture = THREE.ImageUtils.loadTexture(white_square_tex_name);
        var black_texture = THREE.ImageUtils.loadTexture(black_square_tex_name);
        
        var white_material = new THREE.MeshLambertMaterial({map: white_texture});
        var black_material = new THREE.MeshLambertMaterial({map: black_texture});
        white_material.magFilter = THREE.LinearFilter;
        white_material.minFilter = THREE.LinearMipMapFilter;
        white_material.anisotropy = renderer.getMaxAnisotropy();
        black_material.magFilter = THREE.LinearFilter;
        black_material.minFilter = THREE.LinearMipMapFilter;
        black_material.anisotropy = renderer.getMaxAnisotropy();
        
        // the first size^2 board_pieces are the squares.
        var fields = this.size * this.size;
        for (i = 0; i < fields; ++i) {
            if (this.board_objects[i].isboard===true) {
                this.board_objects[i].material =
                    ((i + Math.floor(i / this.size) * ((this.size - 1) % 2)) % 2)
                    ? white_material : black_material;
            }
        }
    },
    updatepieces: function () {
        // reload textures
        var white_texture = THREE.ImageUtils.loadTexture(white_piece_tex_name);
        var black_texture = THREE.ImageUtils.loadTexture(black_piece_tex_name);
        var white_cap_texture = THREE.ImageUtils.loadTexture(white_caps_tex_name);
        var black_cap_texture = THREE.ImageUtils.loadTexture(black_caps_tex_name);
        
        var white_material = new THREE.MeshLambertMaterial({map: white_texture});
        var black_material = new THREE.MeshLambertMaterial({map: black_texture});
        var white_cap_material = new THREE.MeshLambertMaterial({map: white_cap_texture});
        var black_cap_material = new THREE.MeshLambertMaterial({map: black_cap_texture});
        white_material.magFilter = THREE.LinearFilter;
        white_material.minFilter = THREE.LinearMipMapFilter;
        white_material.anisotropy = 1;
        black_material.magFilter = THREE.LinearFilter;
        black_material.minFilter = THREE.LinearMipMapFilter;
        black_material.anisotropy = 1;
        white_cap_material.magFilter = THREE.LinearFilter;
        white_cap_material.minFilter = THREE.LinearMipMapFilter;
        white_cap_material.anisotropy = 1;
        black_cap_material.magFilter = THREE.LinearFilter;
        black_cap_material.minFilter = THREE.LinearMipMapFilter;
        black_cap_material.anisotropy = 1;

        
        // reconstruct geometries.
        constructGeometries();
        var old_size = this.piece_objects[0].geometry.parameters.width;
        
        // for all pieces...
        for (i = 0; i < this.piece_objects.length; ++i) {
            // reapply texture.
            if (this.piece_objects[i].iscapstone)
            {
                this.piece_objects[i].material = (this.piece_objects[i].iswhitepiece)
                    ? white_cap_material : black_cap_material;
            } else {
                this.piece_objects[i].material = (this.piece_objects[i].iswhitepiece)
                    ? white_material : black_material;
            }
            
            if (this.piece_objects[i].iscapstone) {
                // reapply geometry.
                this.piece_objects[i].geometry = (this.piece_objects[i].iswhitepiece ?
                    white_caps_geometry : black_caps_geometry);
            } else {
                // if standing, reset and reapply orientation.
                if (this.piece_objects[i].isstanding) {
                    this.piece_objects[i].rotation.set(0, 0, 0);
                    this.piece_objects[i].updateMatrix();
                    this.piece_objects[i].position.y -= old_size / 2 - piece_height / 2;
                    this.piece_objects[i].isstanding = false;
                    this.standup(this.piece_objects[i]);
                }

                // reapply geometry.
                this.piece_objects[i].geometry = (this.piece_objects[i].iswhitepiece ?
                    white_piece_geometry : black_piece_geometry);
                this.piece_objects[i].updateMatrix();
            }
        }
    },
    file: function (no) {
        return String.fromCharCode('A'.charCodeAt(0) + no);
    },
    //file is no. rank is no.
    squarename: function (file, rank) {
        return this.file(file) + (rank + 1);
    },
    get_board_obj: function (file, rank) {
        return this.sq[file][this.size - 1 - rank].board_object;
    },
    incmovecnt: function () {
        this.save_board_pos();
        if(this.moveshown === this.movecount) {
          this.moveshown++;
          $('.curmove:first').removeClass('curmove');
          $('.moveno'+this.movecount+':first').addClass('curmove');
        }
        this.movecount++;
        document.getElementById("move-sound").play();

        $('#player-me').toggleClass('selectplayer');
        $('#player-opp').toggleClass('selectplayer');

        if (this.scratch) {
            if (this.mycolor === "white")
                this.mycolor = "black";
            else
                this.mycolor = "white";
        }

        this.ismymove = this.checkifmymove();
        $('#undo').attr('src', 'images/requestundo.svg');
    },
    save_board_pos: function() {
      var bp = [];
      //for all squares, convert stack info to board position info
      for(var i=0;i<this.size;i++) {
        for(var j=0;j<this.size;j++) {
          var bp_sq = [];
          var stk = this.sq[i][j];

          //if(stk.length===0)
          //  bp_sq.push('.');
          for(var s=0;s<stk.length;s++) {
            var pc = stk[s];
            var c = 'p';
            if(pc.iscapstone)
              c = 'c';
            else if (pc.isstanding)
              c = 'w';

            if(pc.iswhitepiece)
              c = c.charAt(0).toUpperCase();

            bp_sq.push(c);
          }
          bp.push(bp_sq);
        }
      }
      this.board_history.push(bp);
    },
    //pos is a single dim. array of size*size containing arrays of piece types
    apply_board_pos: function(pos) {
      for(var i=0;i<this.size;i++) {//file
        for(var j=0;j<this.size;j++) {//rank
          var sq = this.get_board_obj(i, j);
          var sqpos = pos[i*this.size + j];

          for(var s=0;s<sqpos.length;s++) {
            var pc = sqpos[s];
            var iscap = (pc==='c' || pc==='C');
            var iswall = (pc==='w' || pc==='W');
            var iswhite = (pc===pc.charAt(0).toUpperCase());

            var pc = this.getfromstack(iscap, iswhite);
            if(iswall)
              this.standup(pc);

            this.push(sq, pc);
            
            if(iswhite)
              this.whitepiecesleft--;
            else
              this.blackpiecesleft--;
          }
        }
      }
    },
    leftclick: function () {
        this.remove_total_highlight();
        if (!this.ismymove) {
            return;
        }

        if (this.highlighted && this.selected) {
            st = this.get_stack(this.highlighted);
            hlt = this.highlighted;
            this.unhighlight_sq();
            sel = this.selected;
            this.unselect();

            //place on board
            if (st.length === 0) {
                this.push(hlt, sel);

                var stone = 'Piece';
                if (sel.iscapstone)
                    stone = 'Cap';
                else if (sel.isstanding)
                    stone = 'Wall';

                console.log("Place " + this.movecount,
                        sel.iswhitepiece ? 'White' : 'Black', stone,
                        this.squarename(hlt.file, hlt.rank));

                var sqname = this.squarename(hlt.file, hlt.rank);
                var msg = "P " + sqname;
                if (stone !== 'Piece')
                    msg += " " + stone.charAt(0);
                this.sendmove(msg);
                this.notatePmove(sqname, stone.charAt(0));

                var pcs;
                if (this.mycolor === "white") {
                    this.whitepiecesleft--;
                    pcs = this.whitepiecesleft;
                } else {
                    this.blackpiecesleft--;
                    pcs = this.blackpiecesleft;
                }
                if (this.scratch) {
                    var over = this.checkroadwin();
                    if(!over) {
                      over = this.checksquaresover();
                      if (!over && pcs <= 0) {
                          this.findwhowon();
                          this.gameover();
                          return;
                      }
                    }
                }
                this.incmovecnt();
            }
            return;
        }

        //if already selected
        if (this.selected) {
            raycaster.setFromCamera(mouse, camera);
            var intersects = raycaster.intersectObjects(scene.children);
            if (intersects.length > 0) {
                var obj = intersects[0].object;
                //if already selected is same as clicked obj, rotate it
                if (this.selected === obj && Math.floor(this.movecount / 2) !== 0) {
                    this.rotate(obj);
                    return;
                }
            }
            this.unselect(obj);
            return;
        }
        if (this.selectedStack) {
            //move
            if (this.highlighted && this.selectedStack.length > 0) {
                var obj = this.selectedStack.pop();
                //this.unselectStackElem(obj);
                this.push(this.highlighted, obj);
                this.move_stack_over(this.highlighted, this.selectedStack);
                this.move.squares.push(this.highlighted);

                if (this.move.squares.length > 1 && this.move.dir === 'U')
                    this.setmovedir();

                if (this.selectedStack.length === 0) {
                    this.move.end = this.highlighted;
                    this.selectedStack = null;
                    this.unhighlight_sq();
                    this.generateMove();
                }
            } else {
                this.move.end = this.move.squares[this.move.squares.length - 1];
                this.unselectStack();
                this.generateMove();
            }
            return;
        }

        this.unhighlight_sq();

        raycaster.setFromCamera(mouse, camera);
        var intersects = raycaster.intersectObjects(scene.children);
        //select piece
        if (intersects.length > 0) {
            var obj = intersects[0].object;

            if (!obj.isboard && !obj.onsquare) {
                if (obj.iswhitepiece !== this.is_white_piece_to_move())
                    return;
                //no capstone move on 1st moves
                if (Math.floor(this.movecount / 2) === 0 && obj.iscapstone)
                    return;

                this.select(obj);
            }
            //select stack ... no stack selection on 1st moves
            else if (!this.selectedStack && Math.floor(this.movecount / 2) !== 0) {
                var sq = obj;
                if (!obj.isboard) {
                    if (!obj.onsquare)
                        return;
                    sq = obj.onsquare;
                }
                var stk = this.get_stack(sq);
                if (this.is_top_mine(sq) && stk.length > 0) {
                    this.selectStack(stk);
                    this.move.start = sq;
                    this.move.squares.push(sq);
                }
            }
        }
    },
    mousemove: function () {
        if (!this.ismymove)
            return;

        raycaster.setFromCamera(mouse, camera);
        if (!this.selected && !this.selectedStack)
            return;

        var intersects = raycaster.intersectObjects(scene.children);
        
        if (intersects.length > 0) {
            var obj = intersects[0].object;
            if (obj.ispassive){
              this.unhighlight_sq();
              return;
            }
            else if (!obj.isboard && !obj.onsquare){
              return;
            }
            if (!obj.isboard)
                obj = obj.onsquare;

            if (this.selectedStack) {
                var tp = this.top_of_stack(obj);
                if (tp && tp.iscapstone)
                    return;
                if (tp && tp.isstanding &&
                        !this.selectedStack[this.selectedStack.length - 1].iscapstone)
                    return;

                var prev = this.move.squares[this.move.squares.length - 1];

                var rel = this.sqrel(prev, obj);

                if (this.move.dir === 'U' && rel !== 'OUTSIDE')
                    this.highlight_sq(obj);
                else if (this.move.dir === rel || rel === 'O')
                    this.highlight_sq(obj);
            } else if (this.get_stack(obj).length === 0) {
                this.highlight_sq(obj);
            }
        } else {
            this.unhighlight_sq();
        }
    },
    sendmove: function (e) {
        if (!this.server || this.scratch)
            return;
        server.send("Game#" + this.gameno + " " + e);
    },
    getfromstack: function (iscap, iswhite) {
        //randomly get any piece
        for (i = this.piece_objects.length-1; i >= 0; i--) {
            var piece = this.piece_objects[i];
            if (!piece.onsquare
                && piece.iswhitepiece === iswhite
                && piece.iscapstone === iscap) {
              return piece;
            }
        }
        throw "The required piece was not available: "
            + (iswhite ? "white" : "black") + ":"
            + (iscap ? "capstone" : "tile");
    },
    //move the server sends
    serverPmove: function (file, rank, caporwall) {
        fastforward();
        var obj = this.getfromstack((caporwall === 'C'), this.is_white_piece_to_move());

        if (!obj) {
            console.log("something is wrong");
            return;
        }

        if (caporwall === 'W') {
            this.standup(obj);
        }

        var hlt = this.get_board_obj(file.charCodeAt(0) - 'A'.charCodeAt(0), rank - 1);
        this.push(hlt, obj);

        this.notatePmove(file + rank, caporwall);
        this.incmovecnt();
    },
    //Move move the server sends
    serverMmove: function (f1, r1, f2, r2, nums) {
        fastforward();
        var s1 = this.get_board_obj(f1.charCodeAt(0) - 'A'.charCodeAt(0), r1 - 1);
        var fi = 0, ri = 0;
        if (f1 === f2)
            ri = r2 > r1 ? 1 : -1;
        if (r1 === r2)
            fi = f2 > f1 ? 1 : -1;

        var tot = 0;
        for (i = 0; i < nums.length; i++)
            tot += nums[i];

        var tstk = [];
        var stk = this.get_stack(s1);
        for (i = 0; i < tot; i++) {
            tstk.push(stk.pop());
        }
        for (i = 0; i < nums.length; i++) {
            var sq = this.get_board_obj(s1.file + (i + 1) * fi, s1.rank + (i + 1) * ri);
            for (j = 0; j < nums[i]; j++) {
                this.push(sq, tstk.pop());
            }
        }
        this.notateMmove(f1.charCodeAt(0) - 'A'.charCodeAt(0), Number(r1) - 1,
                f2.charCodeAt(0) - 'A'.charCodeAt(0), Number(r2) - 1, nums);
        this.incmovecnt();
    },
    gameover: function () {
        console.log('gameover ' + this.result);
        this.notate(this.result);
        alert("info", "Game over!! " + this.result);
        this.scratch = true;
    },
    newgame: function (sz, col) {
        this.clear();
        this.init(sz, col, false, false);
    },
    findwhowon: function () {
        var whitec = 0, blackc = 0;
        for (i = 0; i < this.size; i++) {
            for (j = 0; j < this.size; j++) {
                var stk = this.sq[i][j];
                if (stk.length === 0)
                    continue;
                var top = stk[stk.length - 1];
                if (top.isstanding && !top.iscapstone)
                    continue;
                if (top.iswhitepiece)
                    whitec++;
                else
                    blackc++;
            }
        }
        if (whitec === blackc)
            this.result = "1/2-1/2";
        else if (whitec > blackc)
            this.result = "F-0";
        else
            this.result = "0-F";
    },
    checkroadwin: function () {
        for (var i = 0; i < this.size; i++) {
            for (var j = 0; j < this.size; j++) {
                var cur_st = this.sq[i][j];
                cur_st.graph = -1;
                if (cur_st.length === 0)
                    continue;

                var ctop = cur_st[cur_st.length - 1];
                if (ctop.isstanding && !ctop.iscapstone)
                    continue;

                cur_st.graph = (i + j * this.size).toString();

                if (i - 1 >= 0) {
                    var left_st = this.sq[i - 1][j];
                    if (left_st.length !== 0) {
                        var ltop = left_st[left_st.length - 1];
                        if (!(ltop.isstanding && !ltop.iscapstone)) {
                            if (ctop.iswhitepiece === ltop.iswhitepiece) {
                                for (var r = 0; r < this.size; r++) {
                                    for (var c = 0; c < this.size; c++) {
                                        if (this.sq[r][c].graph === cur_st.graph) {
                                            this.sq[r][c].graph = left_st.graph;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                if (j - 1 >= 0) {
                    var top_st = this.sq[i][j - 1];
                    if (top_st.length !== 0) {
                        var ttop = top_st[top_st.length - 1];
                        if (!(ttop.isstanding && !ttop.iscapstone)) {
                            if (ctop.iswhitepiece === ttop.iswhitepiece) {
                                for (var r = 0; r < this.size; r++) {
                                    for (var c = 0; c < this.size; c++) {
                                        if (this.sq[r][c].graph === cur_st.graph) {
                                            this.sq[r][c].graph = top_st.graph;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        var whitewin = false;
        var blackwin = false;
        //            console.log("--------");
        //            for(var i=0;i<this.size;i++){
        //                var st="";
        //                for(var j=0;j<this.size;j++){
        //                    st+="("+this.sq[i][j].graph+") ";
        //                }
        //                console.log(st);
        //            }
        //            console.log("=======");
        for (var tr = 0; tr < this.size; tr++) {
            var tsq = this.sq[tr][0];
            var no = tsq.graph;
            if (no === -1)
                continue;
            for (var br = 0; br < this.size; br++) {
                var brno = this.sq[br][this.size - 1].graph;
                if (no === brno) {
                    if (tsq[tsq.length - 1].iswhitepiece)
                        whitewin = true;
                    else
                        blackwin = true;
                }
            }
        }
        for (var tr = 0; tr < this.size; tr++) {
            var tsq = this.sq[0][tr];
            var no = tsq.graph;
            if (no === -1)
                continue;
            for (var br = 0; br < this.size; br++) {
                var brno = this.sq[this.size - 1][br].graph;
                if (no === brno) {
                    if (tsq[tsq.length - 1].iswhitepiece)
                        whitewin = true;
                    else
                        blackwin = true;
                }
            }
        }
        if (whitewin && blackwin)
            this.result = "1/2-1/2";
        else if (whitewin)
            this.result = "R-0";
        else if (blackwin)
            this.result = "0-R";

        if (whitewin || blackwin) {
          this.gameover();
          return true;
        }
        return false;
    },
    checksquaresover: function () {
        for (i = 0; i < this.size; i++)
            for (j = 0; j < this.size; j++)
                if (this.sq[i][j].length === 0)
                    return false;

        this.findwhowon();
        this.gameover();
        return true;
    },
    reverseboard: function (force) {
        this.boardside = (this.boardside === "white") ? "black" : "white";
        if (force || localStorage.getItem('auto_rotate')!=='false')
        {
          camera.position.z = -camera.position.z;
          camera.position.x = -camera.position.x;
        }
    },
    setmovedir: function () {
        var s1 = this.move.start;
        var s2 = this.move.squares[1];
        if (s1.file === s2.file && s1.rank === s2.rank)
            return;

        if (s1.file === s2.file) {
            if (s2.rank > s1.rank)
                this.move.dir = 'N';
            else
                this.move.dir = 'S';
        } else {
            if (s2.file > s1.file)
                this.move.dir = 'E';
            else
                this.move.dir = 'W';
        }
    },
    notate: function (txt) {
        var res=false;
        if(txt==='R-0'||txt==='0-R'||txt==='F=0'||txt==='0-F'
                ||txt==='1-0'||txt==='0-1'||txt==='1/2-1/2') {
            var ol = document.getElementById("moveslist");
            var row = ol.insertRow();
            var cell0 = row.insertCell(0);
            cell0.innerHTML = '';

            var cell1 = row.insertCell(1);
            row.insertCell(2);
            cell1.innerHTML = txt;

            $('#notationbar').scrollTop($('#moveslist tr:last').position().top);
            return;
        }
        if (this.movecount !== 0 && this.movecount % 2 === 1) {
            var om = document.getElementById("moveslist");
            var col = om.rows[om.rows.length - 1].cells[2];
            col.innerHTML = '<a href="#" onclick="board.showmove('
                + (this.movecount+1) + ');"><span class=moveno'
                + this.movecount + '>' + txt + '</span></a>';
        } else {
            var ol = document.getElementById("moveslist");
            var row = ol.insertRow();
            var cell0 = row.insertCell(0);
            cell0.innerHTML = Math.floor(this.movecount / 2 + 1) + '.';
            var cell1 = row.insertCell(1);
            row.insertCell(2);
            cell1.innerHTML = '<a href="#" onclick="board.showmove('
                + (this.movecount+1) + ');"><span class=moveno'
                + this.movecount + '>' + txt + '</span></a>';
        }
        $('#notationbar').scrollTop($('#moveslist tr:last').position().top);
    },
    notatePmove: function (sqname, pos) {
        if (pos === 'W')
            pos = 'S';
        else if (pos === 'C')
            pos = 'C';
        else
            pos = '';
        this.notate(pos + sqname.toLowerCase());
    },
    //all params are nums
    notateMmove: function (stf, str, endf, endr, nos) {
        var dir = '';
        if (stf === endf)
            dir = (endr < str) ? '-' : '+';
        else
            dir = (endf < stf) ? '<' : '>';
        var tot = 0;
        var lst = '';
        for (var i = 0; i < nos.length; i++) {
            tot += Number(nos[i]);
            lst = lst + (nos[i] + '').trim();
        }
        if (tot === 1) {
            var s1 = this.get_board_obj(stf, str);
            if (this.get_stack(s1).length === 0) {
                tot = '';
                lst = '';
            } else if (tot === Number(lst))
                lst = '';
        } else if (tot === Number(lst))
            lst = '';
        var move = tot + this.squarename(stf, str).toLowerCase()
                + dir + '' + lst;
        this.notate(move);
    },
    generateMove: function () {
        var st = this.squarename(this.move.start.file, this.move.start.rank);
        var end = this.squarename(this.move.end.file, this.move.end.rank);
        var lst = [];
        var prev = null;

        for (i = 0, c = 0; i < this.move.squares.length; i++) {
            var obj = this.move.squares[i];
            if (obj === this.move.start)
                continue;

            if (obj === prev)
                lst[c - 1] = lst[c - 1] + 1;
            else {
                prev = obj;
                lst[c] = 1;
                c++;
            }
        }
        if (st !== end) {
            console.log("Move ", this.movecount, st, end, lst);
            var nos = "";
            for (i = 0; i < lst.length; i++)
                nos += lst[i] + " ";
            this.sendmove("M " + st + " " + end + " " + nos.trim());
            this.notateMmove(this.move.start.file, this.move.start.rank,
                    this.move.end.file, this.move.end.rank, nos);
            if (this.scratch) {
                this.checkroadwin();
                this.checksquaresover();
            }
            this.incmovecnt();
        }
        this.move = {start: null, end: null, dir: 'U', squares: []};
    },
    push: function (sq, pc) {
        var st = this.get_stack(sq);
        var top = this.top_of_stack(sq);
        if (top && top.isstanding && !top.iscapstone && pc.iscapstone)
            this.rotate(top);

        pc.position.x = sq.position.x;

        if (pc.isstanding) {
          if(pc.iscapstone)
            pc.position.y = sq_height/2 + capstone_height/2 + piece_height*st.length;
          else
            pc.position.y = sq_height/2 + piece_size/2 + piece_height * st.length;
        } else
            pc.position.y = sq_height + st.length * piece_height;

        pc.position.z = sq.position.z;
        pc.onsquare = sq;
        st.push(pc);
    },
    rotate: function (piece) {
        if (piece.iscapstone)
            return;
        if (piece.isstanding)
            this.flatten(piece);
        else
            this.standup(piece);
    },
    flatten: function (piece) {
        if (!piece.isstanding || piece.iscapstone)
            return;
        piece.position.y -= piece_size / 2 - piece_height / 2;
        if (diagonal_walls)
            piece.rotateZ(Math.PI / 4);
        piece.rotateX(Math.PI / 2);
        piece.isstanding = false;
    },
    standup: function (piece) {
        if (piece.isstanding)
            return;
        piece.position.y += piece_size / 2 - piece_height / 2;
        piece.rotateX(-Math.PI / 2);
        if (diagonal_walls)
            piece.rotateZ(-Math.PI / 4);
        piece.isstanding = true;
    },
    rightclick: function () {
        if (this.selected && Math.floor(this.movecount / 2) !== 0) {
            this.rotate(this.selected);
        } else {
            raycaster.setFromCamera(mouse, camera);
            var intersects = raycaster.intersectObjects(scene.children);
            if (intersects.length > 0) {
                var obj = intersects[0].object;
                var sq = obj;
                if (!obj.isboard)
                    sq = obj.onsquare;
                var stk = this.get_stack(sq);
                if (stk.length === 0)
                    return;
                for (var i = 0; i < scene.children.length; i++) {
                    var obj = scene.children[i];
                    if (obj.isboard || !obj.onsquare)
                        continue;
                    obj.visible = false;
                }
                for (var i = 0; i < stk.length; i++) {
                    stk[i].visible = true;
                }
                this.totalhighlighted = sq;
            }
        }
    },
    remove_total_highlight: function () {
        if (this.totalhighlighted !== null) {
            for (var i = 0; i < scene.children.length; i++) {
                var obj = scene.children[i];
                if (obj.isboard || !obj.onsquare)
                    continue;
                obj.visible = true;
            }
            this.totalhighlighted = null;
        }
    },
    rightup: function () {
        console.log('right up');
        this.remove_total_highlight();
    },
    //bring pieces to original positions
    resetpieces: function() {
        this.highlighted = null;
        this.selected = null;
        this.selectedStack = null;
        this.move = {start: null, end: null, dir: 'U', squares: []};
        this.whitepiecesleft = this.tottiles + this.totcaps;
        this.blackpiecesleft = this.tottiles + this.totcaps;


        //reset stacks
        var piece;
        var whitePieces = [];
        var whiteCaps = [];
        var blackPieces = [];
        var blackCaps = [];
        while (piece = this.piece_objects.pop())
        {
          if (piece.onsquare)
            continue;
          this.flatten(piece);
          if (piece.iswhitepiece) {
            if (piece.iscapstone)
              whiteCaps.push(piece);
            else
              whitePieces.push(piece);
          }
          else {
            if (piece.iscapstone)
              blackCaps.push(piece);
            else
              blackPieces.push(piece);
          }
        }
        for (var i = 0; i < this.size; i++) {
            for (var j = 0; j < this.size; j++) {
                while (piece = this.sq[i][j].pop()) {
                    piece.onsquare = false;
                    this.flatten(piece);
                    if (piece.iswhitepiece) {
                      if (piece.iscapstone)
                        whiteCaps.push(piece);
                      else
                        whitePieces.push(piece);
                    }
                    else {
                      if (piece.iscapstone)
                        blackCaps.push(piece);
                      else
                        blackPieces.push(piece);
                    }
                }
            }
        }
        for (var i = 0; i < whitePieces.length; ++i) {
          this.piece_objects.push(whitePieces[i]);
        }
        for (var i = 0; i < blackPieces.length; ++i) {
          this.piece_objects.push(blackPieces[i]);
        }
        for (var i = 0; i < whiteCaps.length; ++i) {
          this.piece_objects.push(whiteCaps[i]);
        }
        for (var i = 0; i < blackCaps.length; ++i) {
          this.piece_objects.push(blackCaps[i]);
        }
        this.arrangepieces(whitePieces, whiteCaps, blackPieces, blackCaps);
    },
    showmove: function(no) {
      if(this.movecount <= 0 || no>this.movecount || no<=0 || this.moveshown === no)
          return;

      console.log('showmove '+no);
      this.moveshown = no;
      this.resetpieces();
      this.apply_board_pos(this.board_history[no]);
      $('.curmove:first').removeClass('curmove');
      $('.moveno'+(no-1)+':first').addClass('curmove');
    },
    undo: function() {
      if(this.movecount <= 0)
        return;

      this.resetpieces();
      this.apply_board_pos(this.board_history[this.movecount-1]);
      this.board_history.pop();
      this.movecount--;
      this.moveshown = this.movecount;

      $('#player-me').toggleClass('selectplayer');
      $('#player-opp').toggleClass('selectplayer');

      if (this.scratch) {
          if (this.mycolor === "white")
              this.mycolor = "black";
          else
              this.mycolor = "white";
      }
      this.ismymove = this.checkifmymove();

      //fix notation
      var ml = document.getElementById("moveslist");
      var lr = ml.rows[ml.rows.length - 1];
      var txt = lr.cells[1].innerHTML;
      if(txt==='R-0'||txt==='0-R'||txt==='F=0'||txt==='0-F'||txt==='1-0'||txt==='0-1'||txt==='1/2-1/2') {
        ml.deleteRow(ml.rows.length - 1);
        lr = ml.rows[ml.rows.length - 1];
      }

      if(this.movecount % 2 == 0) {
          ml.deleteRow(ml.rows.length - 1);
      } else {
          lr.cells[2].innerHTML="";
      }

      $('.curmove:first').removeClass('curmove');
      $('.moveno'+(this.movecount-1)+':first').addClass('curmove');
      $('#notationbar').scrollTop($('#moveslist tr:last').position().top);
    },
    //remove all scene objects, reset player names, stop time, etc
    clear: function () {
        for (var i = scene.children.length - 1; i >= 0; i--) {
            scene.remove(scene.children[i]);
        }
        var tbl = document.getElementById("moveslist");
        while (tbl.rows.length > 0)
            tbl.deleteRow(0);
        document.getElementById("draw").src = "images/offer-hand.png";
        stopTime();

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

        //i'm always black after clearing
        $('#player-me-name').addClass('player2-name');
        $('#player-opp-name').addClass('player1-name');

        $('#player-me-time').addClass('player2-time');
        $('#player-opp-time').addClass('player1-time');

        $('#player-me-img').attr('src', 'images/player-black.png');
        $('#player-opp-img').attr('src', 'images/player-white.png');

        $('#player-opp').addClass('selectplayer');

        $('.player1-name:first').html('You');
        $('.player2-name:first').html('You');
        $('.player1-time:first').html('0:00');
        $('.player2-time:first').html('0:00');

        $('#gameoveralert').modal('hide');
    },
    sqrel: function (sq1, sq2) {
        var f1 = sq1.file;
        var r1 = sq1.rank;
        var f2 = sq2.file;
        var r2 = sq2.rank;
        if (f1 === f2 && r1 === r2)
            return 'O';

        if (f1 === f2) {
            if (r2 === r1 + 1)
                return 'N';
            else if (r1 === r2 + 1)
                return 'S';
        } else if (r1 === r2) {
            if (f2 === f1 + 1)
                return 'E';
            else if (f1 === f2 + 1)
                return 'W';
        }
        return 'OUTSIDE';
    },
    checkifmymove: function () {
        if (this.observing)
            return false;
        var tomove = (this.movecount % 2 === 0) ? "white" : "black";
        //console.log('tomove = ', tomove, this.mycolor, tomove===this.mycolor);
        return tomove === this.mycolor;
    },
    is_white_piece_to_move: function () {
        if (this.movecount === 0)
            return false;
        if (this.movecount === 1)
            return true;
        return this.movecount % 2 === 0;
    },
    select: function (obj) {
        obj.position.y += stack_selection_height;
        this.selected = obj;
    },
    unselect: function () {
        if (this.selected) {
            this.selected.position.y -= stack_selection_height;
            this.selected = null;
        }
    },
    selectStack: function (stk) {
        //this.selectedStack = stk;
        this.selectedStack = [];
        for (i = 0; stk.length > 0 && i < this.size; i++) {
            obj = stk.pop();
            obj.position.y += stack_selection_height;
            this.selectedStack.push(obj);
        }
    },
    unselectStackElem: function (obj) {
        obj.position.y -= stack_selection_height;
    },
    unselectStack: function () {
        var stk = this.selectedStack.reverse();
        var lastsq = this.move.squares[this.move.squares.length - 1];
        //push unselected stack elems onto last moved square
        for (i = 0; i < stk.length; i++) {
            this.unselectStackElem(stk[i]);
            this.push(lastsq, stk[i]);
            this.move.squares.push(lastsq);
        }
        this.selectedStack = null;
    },
    highlight_sq: function (sq) {
        this.unhighlight_sq(this.highlighted);
        this.highlighted = sq;

        highlighter.position.x = sq.position.x;
        highlighter.position.y = sq_height / 2;
        highlighter.position.z = sq.position.z;
        scene.add(highlighter);
    },
    unhighlight_sq: function () {
        if (this.highlighted) {
            //this.highlighted.position.y -= 10;
            this.highlighted = null;
            scene.remove(highlighter);
        }
    },
    get_stack: function (sq) {
        return this.sq[sq.file][sq.rank];
    },
    top_of_stack: function (sq) {
        var st = this.get_stack(sq);
        if (st.length === 0)
            return null;
        return st[st.length - 1];
    },
    is_top_mine: function (sq) {
        var ts = this.top_of_stack(sq);
        if (!ts)
            return true;
        if (ts.iswhitepiece && this.mycolor === "white")
            return true;
        if (!ts.iswhitepiece && this.mycolor !== "white")
            return true;
        return false;
    },
    move_stack_over: function (sq, stk) {
        if (stk.length === 0)
            return;
        var top = this.top_of_stack(sq);
        if (!top)
            top = sq;

        var ts = stk[stk.length - 1];
        if (ts.onsquare === sq)
            return;

        var diffy = ts.position.y - top.position.y;

        for (i = 0; i < stk.length; i++) {
            stk[i].position.x = sq.position.x;
            stk[i].position.z = sq.position.z;
            stk[i].position.y += stack_selection_height - diffy;
            stk[i].onsquare = sq;
        }
    },
    loadtpn: function (tpn) {
        if (!this.scratch) {
            alert('warning', 'TPN won\'t be displayed in the middle of an online game');
            return;
        }
        tpn = tpn.trim().split("[")[1].split("]")[0].trim();
        var tt = tpn.split(" ");
        var ptomove = tt[1];//string

        var rows = tt[0].split("/");
        this.clear();
        this.init(rows.length, "white", true);
        for (var i = 0; i < rows.length; i++) {
            var cells = rows[i].split(",");
            var cols = 0;
            for (var j = 0; j < cells.length; j++, cols++) {
                var cell = cells[j];
                if (cell.charAt(0) === 'x') {
                    if (cell.length === 1) //lone x
                        continue;
                    cols += Number(cell.charAt(1)) - 1;//x5
                    continue;
                }
                var sq = this.get_board_obj(cols, rows.length - 1 - i);

                for (var k = 0; k < cell.length; k++) {
                    var ch = cell[k];
                    //console.log('ch', ch);
                    if (ch === 'S' || ch === 'C')
                        continue;
                    var piece = '';
                    if (k + 1 === cell.length - 1) {
                        if (cell[k + 1] === 'C')
                            piece = 'C';
                        else if (cell[k + 1] === 'S')
                            piece = 'W';
                    }

                    var pc = this.getfromstack(piece === 'C', ch === '1');
                    if (pc === null || typeof pc === 'undefined') {
                        alert('danger', 'Out of pieces. Wrong TPS!');
                        return;
                    }
                    if (piece === 'W') {
                        this.standup(pc);
                    }
                    this.push(sq, pc);
                }
            }
        }
    }
};

function startTime(fromFn) {
  if(typeof fromFn === 'undefined' && !server.timervar)
    return;
  var now = new Date();
  var t = now.getHours()*60*60 + now.getMinutes()*60+now.getSeconds();
  var elapsed = t-lastTimeUpdate;

  if(board.movecount%2 === 0) {
    t1 = lastWt - elapsed;
    $('.player1-time:first').html(parseInt(t1/60)+':'+getZero(t1%60));
  } else {
    t2 = lastBt - elapsed;
    $('.player2-time:first').html(parseInt(t2/60)+':'+getZero(t2%60));
  }

  server.timervar = setTimeout(startTime, 500);
}

function stopTime() {
  clearTimeout(server.timervar);
  server.timervar = null;
}

function getZero(t) {
    return t<10?'0'+t:t;
}