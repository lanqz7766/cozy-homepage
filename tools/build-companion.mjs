import { writeFile, mkdir } from 'node:fs/promises';
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

globalThis.FileReader = class FileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((result) => {
      this.result = result;
      this.onloadend();
    });
  }
};

const species = process.argv[2] || 'bear';
if (!['bear', 'cat', 'bunny', 'panda'].includes(species)) throw new Error('Choose bear, cat, bunny or panda');
const scene = new THREE.Scene();
scene.name = `${species} at work`;
const typingTracks = [];
const typingDuration = 1.52;

function surface(color, roughness = .88) {
  return new THREE.MeshStandardMaterial({ color, roughness });
}

const m = {
  honey: surface(0xb38558, .92),
  warmShade: surface(0x845a3c, .94),
  muzzle: surface(0xe7d6b4, .94),
  cream: surface(0xf5ebda, .68),
  white: surface(0xf5f4ec, .68),
  piping: surface(0x3a5269, .58),
  pipingShade: surface(0x788a9a, .72),
  softWhite: surface(0xd6dfdf, .69),
  eyes: surface(0x342a25, .8),
  walnut: surface(0x96735a, .94),
  woodTop: surface(0xc18f73, .92),
  frame: surface(0x33444d, .48),
  chair: surface(0x6c827b, .94),
  chairEdge: surface(0x91a7a8, .72),
  stone: surface(0xebe9e0, .78),
  stoneEdge: surface(0xc7cfcb, .68),
  terminal: surface(0x197e80, .88),
  glass: surface(0x334c4e, .94),
  displayInk: new THREE.MeshBasicMaterial({ color: 0xb3d6ca }),
  displaySoft: new THREE.MeshBasicMaterial({ color: 0x527c7f }),
  displayDark: new THREE.MeshBasicMaterial({ color: 0x23404b }),
  pottery: surface(0xd2aa80, .74),
  leaf: surface(0x739584, .72)
};

// Each animal has its own silhouette and face, on the same quiet workstation.
if (species === 'cat') {
  m.honey.color.setHex(0xe1b787); m.warmShade.color.setHex(0xb57d52);
  m.muzzle.color.setHex(0xf9ebd4); m.white.color.setHex(0xc4d8d5);
}
if (species === 'bunny') {
  m.honey.color.setHex(0xf3e9dd); m.warmShade.color.setHex(0xb89885);
  m.muzzle.color.setHex(0xfff4e7); m.white.color.setHex(0xd7d6e6);
}
if (species === 'panda') {
  m.honey.color.setHex(0xf2eee3); m.warmShade.color.setHex(0x45484a);
  m.muzzle.color.setHex(0xfff9ed); m.white.color.setHex(0xbfcbdc);
}
m.blush = surface(0xd6a09b);
m.ink = surface(0x424348);

const box = new THREE.BoxGeometry(1, 1, 1);
function block(parent, name, material, size, position) {
  const part = new THREE.Mesh(box, material);
  part.name = name;
  part.scale.set(...size);
  part.position.set(...position);
  parent.add(part);
  return part;
}

// Exposed faces of a shared voxel grid, with flat normals and solid colors.
// Shape is carried by the stepped silhouette, never by noisy surface pixels.
function sculpt(parent, name, material, size, position, power = 3, cell = .055) {
  const count = size.map(v => Math.max(1, Math.round(v / cell)));
  const occupied = (x, y, z) => {
    const q = [x, y, z];
    if (q.some((v, axis) => v < 0 || v >= count[axis])) return false;
    return q.reduce((sum, v, axis) => sum + Math.pow(Math.abs((v + .5) * 2 / count[axis] - 1), power), 0) <= 1;
  };
  const cube = box.toNonIndexed();
  const cp = cube.attributes.position;
  const cn = cube.attributes.normal;
  const positions = [], normals = [];
  const neighbors = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
  for (let x = 0; x < count[0]; x++) for (let y = 0; y < count[1]; y++) for (let z = 0; z < count[2]; z++) {
    if (!occupied(x,y,z)) continue;
    neighbors.forEach(([dx,dy,dz], face) => {
      if (occupied(x+dx,y+dy,z+dz)) return;
      for (let v = face * 6; v < face * 6 + 6; v++) {
        positions.push((x+.5-count[0]/2+cp.getX(v))*cell,
          (y+.5-count[1]/2+cp.getY(v))*cell,
          (z+.5-count[2]/2+cp.getZ(v))*cell);
        normals.push(cn.getX(v),cn.getY(v),cn.getZ(v));
      }
    });
  }
  cube.dispose();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
  const part = new THREE.Mesh(geometry, material);
  part.name = name;
  part.position.set(...position);
  parent.add(part);
  return part;
}

// Broad planar surfaces with a single small chamfer: softened voxel corners,
// without concentric stair steps, rounded shading, or surface texture.
function softBlock(parent, name, material, size, position, corner, bevel) {
  const [width, height, depth] = size;
  const x = width / 2 - bevel, y = height / 2 - bevel, c = corner;
  const points = [[-x+c,y],[x-c,y],[x,y-c],[x,-y+c],
    [x-c,-y],[-x+c,-y],[-x,-y+c],[-x,y-c]];
  const outline = new THREE.Shape();
  points.forEach(([px,py], i) => i ? outline.lineTo(px,py) : outline.moveTo(px,py));
  outline.closePath();
  const geometry = new THREE.ExtrudeGeometry(outline, {
    depth:depth-2*bevel, bevelEnabled:true, bevelSegments:1,
    bevelThickness:bevel, bevelSize:bevel, steps:1
  });
  geometry.translate(0,0,-depth/2+bevel);
  const part = new THREE.Mesh(geometry,material);
  part.name = name;
  part.position.set(...position);
  parent.add(part);
  return part;
}

function group(parent, name, position, yaw = 0) {
  const shape = new THREE.Group();
  shape.name = name;
  shape.position.set(...position);
  shape.rotation.y = yaw;
  parent.add(shape);
  return shape;
}

function sleeveBetween(parent, name, start, end, width, material) {
  const from = new THREE.Vector3(...start);
  const to = new THREE.Vector3(...end);
  const direction = to.clone().sub(from);
  const length = direction.length();
  const sleeve = block(parent, name, material, [width, length, width],
    from.lerp(to, .5).toArray(), Math.min(width * .34, length * .28));
  sleeve.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
}

function makeKeystrokeTrack(forearm, taps) {
  const lift = -.066;
  const frames = [[0, lift]];
  for (const tap of taps) {
    frames.push([tap - .10, lift], [tap - .043, -.028],
      [tap, 0], [tap + .042, 0], [tap + .13, lift]);
  }
  frames.push([typingDuration, lift]);
  const hinge = new THREE.Vector3(1, 0, 0);
  const rotation = new THREE.Quaternion();
  return new THREE.QuaternionKeyframeTrack(`${forearm.name}.quaternion`,
    frames.map(([time]) => time),
    frames.flatMap(([, angle]) => rotation.setFromAxisAngle(hinge, angle).toArray()));
}

function lapel(parent, sign) {
  for (let row = 0; row < 4; row++) {
    const x = sign * (.17 - row * .037);
    block(parent, 'Pixel collar', m.softWhite, [.074, .055, .025], [x, 1.25 - row * .055, .283]);
    block(parent, 'Pixel collar stitch', m.pipingShade, [.021, .055, .029], [x + sign * .027, 1.25 - row * .055, .298]);
  }
}

function makeChair(parent) {
  const chair = group(parent, 'Swivel chair', [0, 0, -.15]);
  block(chair, 'Backrest', m.chair, [.67, .56, .10], [0, .97, -.285], .042).rotation.x = -.10;
  block(chair, 'Backrest piping', m.chairEdge, [.63, .023, .09], [0, 1.241, -.312], .009);
  for (const side of [-1, 1]) {
    block(chair, 'Backrest stay', m.frame, [.067, .38, .067], [side * .226, .733, -.248], .016);
  }
  block(chair, 'Seat', m.chair, [.734, .129, .681], [0, .584, .042], .056);
  block(chair, 'Seat underside', m.frame, [.61, .083, .546], [0, .528, .042], .025);
  block(chair, 'Gas lift', m.frame, [.107, .373, .110], [0, .314, .042], .031);
  const spokes = group(chair, 'Caster base', [0, .106, .042]);
  for (let i = 0; i < 5; i++) {
    const branch = group(spokes, 'Caster support', [0, 0, 0], i * Math.PI * .4);
    block(branch, 'Spoke', m.frame, [.076, .062, .337], [0, .004, .141], .019);
    block(branch, 'Caster', m.chair, [.092, .102, .088], [0, -.040, .286], .026);
  }
}

function makeBear(parent) {
  const bear = group(parent, `${species} companion`, [0, 0, 0]);
  sculpt(bear, 'Stepped coat body', m.white, [.66, .715, .55], [0, .981, -.014], 3.5);
  block(bear, 'Coat hem', m.softWhite, [.55, .055, .44], [0, .652, -.008]);
  block(bear, 'Neck', m.honey, [.467, .246, .397], [0, 1.318, -.019], .105);
  block(bear, 'Open coat warm center', m.honey, [.11, .44, .024], [0, .945, .267]);
  for (const side of [-1, 1]) {
    lapel(bear, side);
    block(bear, 'Bent leg', m.honey, [.249, .227, .39], [side * .170, .663, .244], .076);
    block(bear, 'Shin', m.honey, [.22, .44, .22], [side * .174, .36, .381], .055).rotation.x = -.14;
    sculpt(bear, 'Stepped foot', m.honey, [.22, .165, .33], [side * .176, .063, .448], 4);
  }
  block(bear, 'Breast pocket', m.softWhite, [.158, .109, .033], [-.187, 1.024, .283], .012);
  block(bear, 'Pocket pen', m.piping, [.020, .089, .024], [-.170, 1.073, .307], .006);

  for (const side of [-1, 1]) {
    const shoulder = [side * .259, 1.205, .028];
    const elbow = [side * .366, .971, .252];
    const wrist = [side * .206, 1.119, .622];
    sleeveBetween(bear, 'Upper sleeve', shoulder, elbow, .226, m.white);
    const forearm = group(bear, side < 0 ? 'Left_typing_forearm' : 'Right_typing_forearm', elbow);
    const fromElbow = point => point.map((coordinate, axis) => coordinate - elbow[axis]);
    const wristOffset = fromElbow(wrist);
    sleeveBetween(forearm, 'Forearm sleeve', fromElbow([side * .359, .959, .224]),
      wristOffset, .185, m.white);
    sleeveBetween(forearm, 'Navy cuff', fromElbow([side * .224, 1.105, .586]),
      wristOffset, .168, m.piping);
    const pawDepth = side === -1 ? .673 : .705;
    block(forearm, 'Typing paw', m.honey, [.144, .116, .153],
      fromElbow([side * .203, 1.113, pawDepth]), .055).rotation.x = .10;
    typingTracks.push(makeKeystrokeTrack(forearm, side < 0 ? [.24, .80] : [.51, 1.07]));
  }

  const head = group(bear, 'Head facing the display', [0, 1.61, -.014], .01);
  head.rotation.x = .09;
  if (species !== 'bear') {
    makeCompanionHead(head);
    if (species === 'cat') {
      const tail = group(bear, 'Curled cat tail', [.32,.72,-.22]);
      softBlock(tail, 'Tail base', m.honey, [.13,.13,.40], [.12,0,-.10], .035,.012);
      softBlock(tail, 'Tail tip', m.honey, [.13,.36,.13], [.12,.12,-.25], .035,.012);
    }
    return;
  }
  // Keep the face broad and readable; soften only the outer silhouette.
  softBlock(head, 'Soft voxel teddy head', m.honey, [.77, .66, .63], [0,.025,0], .10, .035);
  for (const side of [-1, 1]) {
    const ear = group(head, 'Simple teddy ear', [side * .275, .37, -.055]);
    softBlock(ear, 'Outer ear', m.honey, [.25,.25,.16], [0,0,0], .060, .012);
    softBlock(ear, 'Warm inner ear', m.muzzle, [.12,.12,.018], [0,.01,.082], .025, .003);
    block(head, 'Dark eye', m.eyes, [.052,.065,.018], [side * .16,.075,.324]);
    block(head, 'Eye highlight', m.cream, [.013,.014,.006], [side * .16-.009,.091,.336]);
  }
  // A single cream muzzle replaces the two overlapping cheek volumes.
  softBlock(head, 'Single cream muzzle', m.muzzle, [.33,.22,.105], [0,-.085,.35], .04, .012);
  block(head, 'Small chestnut nose', m.eyes, [.085,.05,.028], [0,-.035,.412]);
  block(head, 'Muzzle center line', m.warmShade, [.016,.045,.006], [0,-.081,.406]);
  block(head, 'Quiet smile', m.warmShade, [.066,.012,.006], [0,-.105,.406]);


}

function makeCompanionHead(head) {
  const fur = m.honey;
  softBlock(head, 'Soft companion head', fur, [.78,.65,.63], [0,.025,0], .12,.035);
  for (const side of [-1,1]) {
    if (species === 'cat') {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(.205,.28,4),fur); ear.name='Cat pointed ear';
      ear.position.set(side*.25,.43,-.025); ear.rotation.y=Math.PI/4;
      head.add(ear);
      block(head,'Whisker',m.warmShade,[.105,.009,.006],[side*.255,-.075,.330]);
      block(head,'Whisker',m.warmShade,[.09,.009,.006],[side*.26,-.114,.327]);
      block(head,'Forehead stripe',m.warmShade,[.035,.105,.008],[side*.07,.271,.314]);
    } else if (species === 'bunny') {
      const ear=group(head,'Long bunny ear',[side*.205,.52,-.065]);
      ear.rotation.z=side*-.13;
      softBlock(ear,'Outer ear',fur,[.19,.64,.16],[0,0,0],.06,.014);
      softBlock(ear,'Pink inner ear',m.blush,[.085,.45,.018],[0,.025,.082],.028,.004);
    } else {
      const ear=group(head,'Round panda ear',[side*.28,.37,-.05]);
      softBlock(ear,'Black ear',m.ink,[.25,.25,.17],[0,0,0],.065,.015);
      const patch=softBlock(head,'Panda eye patch',m.ink,[.175,.20,.026],[side*.17,.06,.319],.047,.005);
      patch.rotation.z=side*-.18;
    }
    const eyeZ=species==='panda'?.341:.326;
    block(head,'Bright dark eye',m.eyes,[.063,.082,.018],[side*.165,.065,eyeZ]);
    block(head,'Eye glint',m.cream,[.018,.020,.006],[side*.165-.011,.086,eyeZ+.012]);
    if(species!=='panda') softBlock(head,'Soft cheek',m.blush,[.09,.028,.012],[side*.245,-.01,.321],.008,.002);
  }
  softBlock(head,'Cream muzzle',m.muzzle,[.30,.17,.065],[0,-.105,.336],.05,.012);
  block(head,'Tiny nose',species==='panda'?m.eyes:m.blush,[.060,.035,.022],[0,-.066,.378]);
  block(head,'Mouth line',m.warmShade,[.012,.032,.006],[0,-.098,.374]);
  block(head,'Small smile',m.warmShade,[.050,.009,.006],[0,-.115,.374]);
}

function makeTerminal(parent, seatedPosition) {
  const desk = group(parent, 'Maple workstation', [.020, 0, .73], Math.PI + .37);
  for (const side of [-1, 1]) {
    for (const end of [-1, 1]) {
      const leg = block(desk, 'Workstation leg', m.walnut, [.11, .863, .11],
        [side * .678, .464, end * .339], .023);
      leg.rotation.z = 0;
      block(desk, 'Desk foot', m.pipingShade, [.103, .070, .121],
        [side * .686, .046, end * .339], .020);
    }
    block(desk, 'Side brace', m.walnut, [.086, .079, .673], [side * .671, .766, 0], .020);
  }
  block(desk, 'Maple edge', m.walnut, [1.651, .121, .986], [0, .919, 0], .035);
  block(desk, 'Maple desktop', m.woodTop, [1.645, .067, .981], [0, .972, 0], .031);

  const terminalPosition = [.112, 1.005, -.267];
  desk.updateMatrix();
  const seatInDesk = seatedPosition.clone().applyMatrix4(desk.matrix.clone().invert());
  const facingSeat = Math.atan2(seatInDesk.x - terminalPosition[0], seatInDesk.z - terminalPosition[2]);
  const terminal = group(desk, 'Slate medical terminal', terminalPosition, facingSeat - .18);
  block(terminal, 'Monitor foot', m.terminal, [.378, .073, .300], [0, .038, .015], .022);
  block(terminal, 'Monitor stand', m.frame, [.118, .248, .116], [0, .164, -.030], .019);
  block(terminal, 'Monitor shell', m.terminal, [1.224, .727, .110], [0, .487, -.023], .035);
  block(terminal, 'Inset glass', m.glass, [1.134, .633, .054], [0, .500, .035], .021);
  const mark = (name, mat, x, y, width, height) =>
    block(terminal, name, mat, [width, height, .004], [x, y, mat === m.displayDark ? .064 : .070]);
  mark('Header', m.displayDark, 0, .730, 1.044, .110);
  mark('Medical sign', m.displayInk, -.444, .732, .076, .020);
  mark('Medical sign', m.displayInk, -.444, .732, .022, .074);
  const letters = {
    R: ['1110','1001','1001','1110','1010','1001','1001'],
    C: ['0111','1000','1000','1000','1000','1000','0111'],
    L: ['1000','1000','1000','1000','1000','1000','1111'],
    I: ['111','010','010','010','010','010','111'],
    N: ['1001','1101','1101','1011','1011','1001','1001'],
    A: ['0110','1001','1001','1111','1001','1001','1001'],
    G: ['0111','1000','1000','1011','1001','1001','0111'],
    E: ['1111','1000','1000','1110','1000','1000','1111'],
    T: ['11111','00100','00100','00100','00100','00100','00100']
  };
  const pixel = .0104;
  let offset = -.379;
  for (const glyph of 'CREATE') {
    letters[glyph].forEach((row, i) => {
      for (const run of row.matchAll(/1+/g)) {
        const width = run[0].length;
        mark('Screen lettering', m.displayInk, offset + pixel * (run.index + width * .5),
          .760 - pixel * i, pixel * width, pixel);
      }
    });
    offset += pixel * (letters[glyph][0].length + 1);
  }
  mark('Review panel', m.displayDark, .283, .460, .418, .357);
  mark('Review glyph', m.displayInk, .279, .480, .057, .136).rotation.z = -.78;
  mark('Review glyph', m.displayInk, .222, .455, .054, .072).rotation.z = .71;
  mark('Review status', m.displaySoft, .275, .348, .138, .016);
  for (let row = 0; row < 3; row++) {
    const y = .561 - row * .105;
    mark('Task marker', row === 0 ? m.displayInk : m.displaySoft, -.454, y, .041, .036);
    mark('Task line', m.displayInk, -.274, y + .008, .236 - row * .039, .016);
    mark('Secondary line', m.displaySoft, -.301, y - .027, .178 - row * .025, .009);
  }
  block(terminal, 'Activity light', m.displayInk, [.025, .019, .005], [.521, .158, .023], .002);

  terminal.scale.set(.88,.88,1);

  const keys = group(desk, 'Compact keyboard', [-.114, 1.017, .254], -.30);
  block(keys, 'Keyboard housing', m.terminal, [.759, .051, .275], [0, 0, 0], .020);
  for (let row = 0; row < 3; row++) {
    for (let key = 0; key < 10; key++) {
      if (row === 2 && key >= 3 && key <= 6) continue;
      block(keys, 'Key', key === 9 || key === 0 ? m.chairEdge : m.cream,
        [.057, .025, .063], [-.316 + key * .070, .028, -.079 + row * .079], .005);
    }
  }
  block(keys, 'Spacebar', m.cream, [.264, .024, .063], [0, .027, .079], .006);
  const cup = group(desk, 'Warm ceramic mug', [-.58,1.005,.27]);
  block(cup,'Mug body',m.cream,[.165,.165,.165],[0,.083,0]);
  block(cup,'Coffee surface',m.warmShade,[.115,.008,.115],[0,.168,0]);
  block(cup,'Mug handle top',m.cream,[.075,.035,.045],[-.11,.137,0]);
  block(cup,'Mug handle side',m.cream,[.035,.11,.045],[-.145,.083,0]);
  block(cup,'Mug handle bottom',m.cream,[.075,.035,.045],[-.11,.028,0]);
  const plant = group(desk, 'Small plant', [.60,1.005,-.245]);
  block(plant,'Pot',m.cream,[.165,.165,.165],[0,.083,0]);
  block(plant,'Pot rim',m.softWhite,[.187,.033,.187],[0,.165,0]);
  block(plant,'Soil',m.warmShade,[.132,.015,.132],[0,.184,0]);
  block(plant,'Stem',m.leaf,[.035,.22,.035],[0,.275,0]);
  block(plant,'Lower leaves',m.leaf,[.165,.055,.11],[.025,.25,0]);
  block(plant,'Middle leaves',m.leaf,[.22,.055,.11],[-.025,.32,0]);
  block(plant,'Top leaves',m.leaf,[.11,.055,.11],[.025,.375,0]);

}

const station = group(scene, 'Medical station', [-.15, .02, .035], 1.31);
const occupant = group(station, 'Seated clinician', [0, 0, -.31]);
makeChair(occupant);
makeBear(occupant);
makeTerminal(station, occupant.position);

const typing = new THREE.AnimationClip('Alternating keystrokes', typingDuration, typingTracks);
const model = Buffer.from(await new GLTFExporter().parseAsync(scene, { binary: true, animations: [typing] }));
const output = new URL(`../assets/scenes/${species}-station.glb`, import.meta.url);
await mkdir(new URL('../assets/scenes/', import.meta.url), { recursive: true });
await writeFile(output, model);
console.log(`Built ${output.pathname} (${model.length} bytes)`);
