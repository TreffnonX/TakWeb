var textures = {};

/* different enums to be applied. */
textures.Pattern =
{
  NONE: "none",
  CHESS: "chess",
  FRAME: "frame"
}
textures.OrnamentType =
{
  SIMPLE: "simple",
  SUNKEN: "sunken",
  RAISED: "raised"
}

/* collected information specific to one tile color. */
textures.boardColorSettings = 
{
  color: 0x665d54,
  ornamentColor: 0x000000,
  baseTexture: null,
  ornamentTexture: null,
  ornamentPattern: null,
  ornamentType: textures.OrnamentType.SIMPLE,
  ornamentShow: false,
}

/* board related textures and values. */
var boardTextureSettings = 
{
  // values.
  pattern: textures.Pattern.CHESS,
  diamondsShow: false,
  diamondsTexture: null,
  diamondsColor: 0xcc5566,
  borderWidth: 2,
  borderColor: 0xba8d63,
  colors: [],

  // baked.
  bakedTextures: [],

  bakeTextures: function()
  {
    // clear old textures.
    this.bakedTextures = [];
  },
}

/* apply baked textures to the board tiles. */
function applyBoardTextures()
{
  
}