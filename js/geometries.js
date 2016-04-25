/*
 * Construct non-default geometries used to represent objects.
 */
function constructGeometries()
{
  if (localStorage.getItem('piece_style_white')!=='simple') {
    // construct complex geometry.
    white_piece_geometry = constructBurredBox(piece_size, piece_height, piece_size, 
      burring_depth, burring_height, burring_vertical);
    white_caps_geometry = constructCapstoneGeometry();
  }
  else
  {
    // construct simple geometry.
    white_piece_geometry = new THREE.BoxGeometry(piece_size, piece_height, piece_size);
    white_caps_geometry = new THREE.CylinderGeometry(capstone_radius, capstone_radius, capstone_height, 32);
  }

  if (localStorage.getItem('piece_style_black')!=='simple') {
    // construct complex geometry.
    black_piece_geometry = constructBurredBox(piece_size, piece_height, piece_size, 
      burring_depth, burring_height, burring_vertical);
    black_caps_geometry = constructCapstoneGeometry();
  }
  else
  {
    // construct simple geometry.
    black_piece_geometry = new THREE.BoxGeometry(piece_size, piece_height, piece_size);
    black_caps_geometry = new THREE.CylinderGeometry(capstone_radius, capstone_radius, capstone_height, 32);
  }
  
  marker_geometry = new THREE.BoxGeometry(sq_size, sq_height + 4, sq_size);
  marker_geometry.center();
}

/*
 * Construct capstone geometry.
 */
function constructCapstoneGeometry()
{
  var capsCut = [];

  // create spline.
  capsCut.push(new THREE.Vector3(0, 0, 0));
  capsCut.push(new THREE.Vector3(capstone_radius, 0, 0));
  for (i = 0; i < capstone_rings.length; ++i)
  {
    capsCut.push(new THREE.Vector3(capstone_radius, capstone_rings[i] - capstone_ring_width / 2 - capstone_ring_burring, 0));
    capsCut.push(new THREE.Vector3(capstone_radius - capstone_ring_depth, capstone_rings[i] - capstone_ring_width / 2, 0));
    capsCut.push(new THREE.Vector3(capstone_radius - capstone_ring_depth, capstone_rings[i] + capstone_ring_width / 2, 0));
    capsCut.push(new THREE.Vector3(capstone_radius, capstone_rings[i] + capstone_ring_width / 2 + capstone_ring_burring, 0));
  }
  capsCut.push(new THREE.Vector3(capstone_radius, capstone_height - burring_height, 0));
  for (i = capstone_top_rings.length - 1; i >= 0; --i)
  {
    capsCut.push(new THREE.Vector3(capstone_top_rings[i] + capstone_ring_width / 2 + capstone_ring_burring, capstone_height));
    capsCut.push(new THREE.Vector3(capstone_top_rings[i] + capstone_ring_width / 2, capstone_height - capstone_ring_depth));
    capsCut.push(new THREE.Vector3(capstone_top_rings[i] - capstone_ring_width / 2, capstone_height - capstone_ring_depth));
    capsCut.push(new THREE.Vector3(capstone_top_rings[i] - capstone_ring_width / 2 - capstone_ring_burring, capstone_height));
  }
  for (i = 3; i >= 0; --i)
  {
    capsCut.push(new THREE.Vector3((capstone_radius - capstone_top_rings[capstone_top_rings - 1]) / 3 * i, capstone_height, 0));
  }
  
  // create texPoints.
  var texPoints = [];
  texPoints.push(0);
  var side = 2 + 4 * capstone_rings.length;
  var top = 5 + 4 * capstone_top_rings.length;
  for (i = 0; i < side; ++i)
  {
    texPoints.push(capsCut[i + 1].y / capstone_height);
  }
  for (i = 0; i < top - 1; ++i)
  {
    texPoints.push(capsCut[i + side + 1].x / capstone_radius);
  }

  return betterLathe(capsCut, texPoints, 32);
}

/*
 * a more benefitial variation of lathe.
 */
function betterLathe(points, texPoints, segments)
{
  var geometry = new THREE.Geometry();
  
  var segmentRad = Math.PI * 2 / segments;
  for (i = 0; i < segments; ++i)
  {
    for (p = 0; p < points.length; ++p)
    {
      var dist = Math.sqrt(points[p].x * points[p].x + points[p].z * points[p].z);
      // add a vertex for every point in the array, on each segment.
      geometry.vertices.push(new THREE.Vector3(
          Math.cos(segmentRad * i) * dist,
          points[p].y,
          Math.sin(segmentRad * i) * dist
      ));
    }
  }
  var face;
  for (i = 0; i < segments; ++i)
  {
    for (p = 0; p < points.length - 1; ++p)
    {
      // calculate normals.
      var dist = Math.sqrt(
          (points[p + 1].x - points[p].x) * (points[p + 1].x - points[p].x) +
          (points[p + 1].y - points[p].y) * (points[p + 1].y - points[p].y));
      var unrotatedNormal = [
          (points[p + 1].y - points[p].y) / dist,
          (points[p].x - points[p + 1].x) / dist,
          (points[p + 1].y - points[p].y) / dist
      ];
      var normals = [
          new THREE.Vector3(
              Math.cos(segmentRad * (i % segments)) * unrotatedNormal[0],
              unrotatedNormal[1],
              Math.sin(segmentRad * (i % segments)) * unrotatedNormal[2]
          ),
          new THREE.Vector3(
              Math.cos(segmentRad * ((i + 1) % segments)) * unrotatedNormal[0],
              unrotatedNormal[1],
              Math.sin(segmentRad * ((i + 1) % segments)) * unrotatedNormal[2]
          )
      ];
      // create 2 faces per point (except for the last point in the spline)
      face = new THREE.Face3(
          i * points.length + p,
          i * points.length + p + 1,
          (i + 1) % segments * points.length + p
      );
      face.vertexNormals = [normals[0], normals[0], normals[1]];
      geometry.faces.push(face);
      face = new THREE.Face3(
          (i + 1) % segments * points.length + p,
          i * points.length + p + 1,
          (i + 1) % segments * points.length + p + 1
      );
      face.vertexNormals = [normals[1], normals[0], normals[1]];
      geometry.faces.push(face);
      // add two UVS
      geometry.faceVertexUvs[0].push([
          new THREE.Vector2(i / segments, texPoints[p]),
          new THREE.Vector2(i / segments, texPoints[(p + 1) % segments]),
          new THREE.Vector2((i + 1) / segments, texPoints[p])
      ]);
      
      geometry.faceVertexUvs[0].push([
          new THREE.Vector2((i + 1) / segments, texPoints[p]),
          new THREE.Vector2(i / segments, texPoints[(p + 1) % segments]),
          new THREE.Vector2((i + 1)/ segments, texPoints[(p + 1) % segments])
      ]);
    }
  }
  
  // do posterior work.
  geometry.uvsNeedUpdate = true;
  geometry.computeBoundingBox();
  //geometry.computeFaceNormals();
  geometry.center();
  return geometry;
}

/*
 * Construct a burred box with parameter width, height, depth
 * as well as burringWidth and burringHeight.
 */
function constructBurredBox(width, height, depth, burringDepth, burringHeight, burringVertical) {
  var geometry = new THREE.Geometry();
  geometry.parameters = [];
  geometry.parameters.width = width;
  geometry.parameters.height = height;
  geometry.parameters.depth = depth;
  
  // calculate relative burrings and side height.
  var relBurWidth = burringDepth / width;
  var relBurDepth = burringDepth / depth;
  var relBurVertical = burringVertical / width;
  var relBurHeight = burringHeight / height;
  var relativeSideHeight = (height - burringHeight * 2) / width;
  
  // construct UVS points.
  var tex_area = [
    new THREE.Vector2(relBurWidth, relBurWidth),
    new THREE.Vector2(1 - relBurWidth, relBurWidth),
    new THREE.Vector2(1 - relBurWidth, 1 - relBurWidth),
    new THREE.Vector2(relBurWidth, 1 - relBurWidth)
  ];
  var tex_side_area = [
    new THREE.Vector2(0, 1 - relativeSideHeight),
    new THREE.Vector2(1, 1 - relativeSideHeight),
    new THREE.Vector2(1, 1),
    new THREE.Vector2(0, 1)
  ];
  var tex_top = [
    new THREE.Vector2(relBurWidth, 1 - relBurWidth),
    new THREE.Vector2(1 - relBurWidth, 1 - relBurWidth),
    new THREE.Vector2(1, 1),
    new THREE.Vector2(0, 1)
  ];
  var tex_bottom = [
    new THREE.Vector2(1 - relBurWidth, relBurWidth),
    new THREE.Vector2(relBurWidth, relBurWidth),
    new THREE.Vector2(0, 0),
    new THREE.Vector2(1, 0)
  ];
  var tex_left = [
    new THREE.Vector2(relBurWidth, relBurWidth),
    new THREE.Vector2(relBurWidth, 1 - relBurWidth),
    new THREE.Vector2(0, 1),
    new THREE.Vector2(0, 0)
  ];
  var tex_right = [
    new THREE.Vector2(1 - relBurWidth, 1 - relBurWidth),
    new THREE.Vector2(1 - relBurWidth, relBurWidth),
    new THREE.Vector2(1, 0),
    new THREE.Vector2(1, 1)
  ];
  
  // construct vertices.
  geometry.vertices.push(
    // top. 0-3
    new THREE.Vector3(burringDepth, height, burringDepth),
    new THREE.Vector3(width - burringDepth, height, burringDepth),
    new THREE.Vector3(width - burringDepth, height, depth - burringDepth),
    new THREE.Vector3(burringDepth, height, depth - burringDepth),
    // bottom. 4-7
    new THREE.Vector3(width - burringDepth, 0, burringDepth),
    new THREE.Vector3(burringDepth, 0, burringDepth),
    new THREE.Vector3(burringDepth, 0, depth - burringDepth),
    new THREE.Vector3(width - burringDepth, 0, depth - burringDepth),
    // front.8-11
    new THREE.Vector3(burringVertical, burringHeight, 0),
    new THREE.Vector3(width - burringVertical, burringHeight, 0),
    new THREE.Vector3(width - burringVertical, height - burringHeight, 0),
    new THREE.Vector3(burringVertical, height - burringHeight, 0),
    // back.12-15
    new THREE.Vector3(width - burringVertical, burringHeight, depth),
    new THREE.Vector3(burringVertical, burringHeight, depth),
    new THREE.Vector3(burringVertical, height - burringHeight, depth),
    new THREE.Vector3(width - burringVertical, height - burringHeight, depth),
    // left.16-19
    new THREE.Vector3(0, burringHeight, depth - burringVertical),
    new THREE.Vector3(0, burringHeight, burringVertical),
    new THREE.Vector3(0, height - burringHeight, burringVertical),
    new THREE.Vector3(0, height - burringHeight, depth - burringVertical),
    // right.20-23
    new THREE.Vector3(width, burringHeight, burringVertical),
    new THREE.Vector3(width, burringHeight, depth - burringVertical),
    new THREE.Vector3(width, height - burringHeight, depth - burringVertical),
    new THREE.Vector3(width, height - burringHeight, burringVertical)
  );
  
  // construct faces.
  // areas.
  for (i = 0; i < 6; ++i) {
    geometry.faces.push(
      new THREE.Face3(i*4 + 2, i*4 + 1, i*4 + 3),
      new THREE.Face3(i*4 + 1, i*4 + 0, i*4 + 3)
    );
  }
  // texture areas.
  for (i = 0; i < 6; ++i) {
    if (i < 2) {
      geometry.faceVertexUvs[0][i*2 + 0] = [tex_area[2], tex_area[1], tex_area[3]];
      geometry.faceVertexUvs[0][i*2 + 1] = [tex_area[1], tex_area[0], tex_area[3]];
    } else {
      geometry.faceVertexUvs[0][i*2 + 0] =
          [tex_side_area[2], tex_side_area[1], tex_side_area[3]];
      geometry.faceVertexUvs[0][i*2 + 1] =
          [tex_side_area[1], tex_side_area[0], tex_side_area[3]];
    }
  }

  // edges.
  geometry.faces.push(
    // top.
    new THREE.Face3(11, 0, 10),
    new THREE.Face3(0, 1, 10),
    new THREE.Face3(15, 2, 14),
    new THREE.Face3(2, 3, 14),
    new THREE.Face3(19, 3, 18),
    new THREE.Face3(3, 0, 18),
    new THREE.Face3(23, 1, 22),
    new THREE.Face3(1, 2, 22),
    // bottom.
    new THREE.Face3(9, 4, 8),
    new THREE.Face3(4, 5, 8),
    new THREE.Face3(13, 6, 12),
    new THREE.Face3(6, 7, 12),
    new THREE.Face3(21, 7, 20),
    new THREE.Face3(7, 4, 20),
    new THREE.Face3(17, 5, 16),
    new THREE.Face3(5, 6, 16),
    // around.
    new THREE.Face3(18, 11, 17),
    new THREE.Face3(11, 8, 17),
    new THREE.Face3(10, 23, 9),
    new THREE.Face3(23, 20, 9),
    new THREE.Face3(22, 15, 21),
    new THREE.Face3(15, 12, 21),
    new THREE.Face3(14, 19, 13),
    new THREE.Face3(19, 16, 13)
  );
  // textures edges top.
  geometry.faceVertexUvs[0][12] = [tex_bottom[2], tex_bottom[1], tex_bottom[3]];
  geometry.faceVertexUvs[0][13] = [tex_bottom[1], tex_bottom[0], tex_bottom[3]];
  geometry.faceVertexUvs[0][14] = [tex_top[2], tex_top[1], tex_top[3]];
  geometry.faceVertexUvs[0][15] = [tex_top[1], tex_top[0], tex_top[3]];
  geometry.faceVertexUvs[0][16] = [tex_left[2], tex_left[1], tex_left[3]];
  geometry.faceVertexUvs[0][17] = [tex_left[1], tex_left[0], tex_left[3]];
  geometry.faceVertexUvs[0][18] = [tex_right[2], tex_right[1], tex_right[3]];
  geometry.faceVertexUvs[0][19] = [tex_right[1], tex_right[0], tex_right[3]];
  // textures edges bottom.
  geometry.faceVertexUvs[0][20] = [tex_bottom[2], tex_bottom[1], tex_bottom[3]];
  geometry.faceVertexUvs[0][21] = [tex_bottom[1], tex_bottom[0], tex_bottom[3]];
  geometry.faceVertexUvs[0][22] = [tex_top[2], tex_top[1], tex_top[3]];
  geometry.faceVertexUvs[0][23] = [tex_top[1], tex_top[0], tex_top[3]];
  geometry.faceVertexUvs[0][24] = [tex_left[2], tex_left[1], tex_left[3]];
  geometry.faceVertexUvs[0][25] = [tex_left[1], tex_left[0], tex_left[3]];
  geometry.faceVertexUvs[0][26] = [tex_right[2], tex_right[1], tex_right[3]];
  geometry.faceVertexUvs[0][27] = [tex_right[1], tex_right[0], tex_right[3]];
  // textures edges around.
  for (i = 0; i < 4; ++i)
  {
    geometry.faceVertexUvs[0][28 + i * 2] = [tex_side_area[3], tex_side_area[3], tex_side_area[0]];
    geometry.faceVertexUvs[0][28 + i * 2 + 1] = [tex_side_area[3], tex_side_area[0], tex_side_area[0]];
  }
  
  // corners.
  geometry.faces.push(
    // top.
    new THREE.Face3(18, 0, 11),
    new THREE.Face3(10, 1, 23),
    new THREE.Face3(22, 2, 15),
    new THREE.Face3(14, 3, 19),
    // bottom.
    new THREE.Face3(8, 5, 17),
    new THREE.Face3(20, 4, 9),
    new THREE.Face3(12, 7, 21),
    new THREE.Face3(16, 6, 13)
  );
  // texture corners.
  for (i = 0; i < 2; ++i)
  {
    geometry.faceVertexUvs[0][36 + i * 4] = [tex_left[3], tex_left[0], tex_left[3]];
    geometry.faceVertexUvs[0][37 + i * 4] = [tex_bottom[3], tex_bottom[0], tex_bottom[3]];
    geometry.faceVertexUvs[0][38 + i * 4] = [tex_right[3], tex_right[0], tex_right[3]];
    geometry.faceVertexUvs[0][39 + i * 4] = [tex_top[3], tex_top[0], tex_top[3]];
  }
  
  // do posterior work.
  geometry.computeBoundingBox();
  geometry.computeFaceNormals();
  geometry.center();
  return geometry;
}

