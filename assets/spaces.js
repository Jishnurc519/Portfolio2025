// The rooms, as drawn in the notebook, for assets/space-3d.js.
//
// Units are metres-ish and only have to agree with each other. Each item's
// `target` is the id of a heading in that project's story in
// assets/project-details.js -- clicking the installation scrolls there.
//
// Loaded on demand by assets/render-project.js (after three.js and
// space-3d.js) when a story has a `{ space: "<name>" }` block, so pages
// without a map never fetch three.js.

window.SPACES = {
  // The chilling zone, Echoes of Earth 2024: a pie slice of floor with the
  // curved wall on its arc and the four installations in the plan's order.
  // The slice is drawn bigger than the plan and the pieces pushed apart, so
  // each one reads on its own instead of as one knot of lines.
  echoes: {
    floor: { radius: 14, from: Math.PI * 0.06, to: Math.PI * 0.94 },
    wall: { height: 4.2 },
    items: [
      {
        id: 'tree', label: 'Memories of a Tree', note: 'the welcoming scene at the entrance',
        target: 'memories-of-a-tree',
        at: [-8.4, 5.4],
        build(a, T) {
          // A hanging basket-net with two canopies pushing up out of it.
          a.push(...T.basket(2.6, 2.0, 0, 2.8, 0, 12));
          a.push(...T.blob(1.2, -1.0, 3.2, -0.5));
          a.push(...T.blob(1.5, 0.9, 3.0, 0.4));
          for (let i = 0; i < 4; i++) {
            const t = i / 4 * Math.PI * 2;
            a.push(...T.line([Math.cos(t) * 2.6, 2.8, Math.sin(t) * 2.6],
                             [Math.cos(t) * 2.6, 4.6, Math.sin(t) * 2.6]));
          }
        }
      },
      {
        id: 'beepod', label: 'BeePod', note: 'a rotating one-person hive you step into',
        target: 'beepod',
        at: [6.5, 4.7],
        build(a, T) {
          a.push(...T.box(2.1, 2.9, 2.1, 0, 1.45, 0));
          a.push(...T.box(0.9, 0.9, 0.06, 0, 1.8, 1.06));   // the window
          a.push(...T.ring(1.5, 0.02, 0, 0));                  // the turntable
          a.push(...T.line([0, 2.9, 0], [0, 4.2, 0]));          // hung from the rig
          a.push(...T.panel(1.2, 1.6, 1.9, 1.4, 1.2, -0.6));    // the flower screen
        }
      },
      {
        id: 'neel', label: 'Neelkurunji Blossom', note: 'blossoms once every twelve years',
        target: 'neelkurunji',
        at: [2.6, 10.2],
        build(a, T) {
          const seedsX = [0, 1.1, -1.0, 0.6, -0.6, 1.6, -1.7, 0.2];
          const seedsZ = [0, 0.7, 0.9, -0.9, -0.5, -0.2, 0.4, 1.6];
          for (let i = 0; i < seedsX.length; i++) {
            const r = 0.38 + (i % 3) * 0.12;
            a.push(...T.blob(r, seedsX[i], 0.25 + (i % 2) * 0.2, seedsZ[i], 2));
          }
        }
      },
      {
        id: 'wasp', label: 'W.A.S.P', note: 'prod the nest and part of the hive wakes up',
        target: 'wasp',
        at: [-2.0, 6.2],
        build(a, T) {
          // The rig: a beam with angled panels hanging off it, eggs below.
          a.push(...T.line([-2.6, 3.4, 0], [2.6, 3.4, 0]));
          const p = [[-2.0, -0.5], [-0.7, 0.2], [0.6, -0.1], [2.0, 0.4]];
          for (let i = 0; i < p.length; i++) {
            const x = p[i][0], z = p[i][1];
            a.push(...T.panel(1.15, 0.8, x, 2.3 + (i % 2) * 0.35, z, 0.25 * (i - 1.5), 0.45));
            a.push(...T.line([x, 3.4, z], [x, 2.7 + (i % 2) * 0.35, z]));
            a.push(...T.ring(0.5, 0.02, x, z, 0, Math.PI * 2, 20));
            a.push(...T.line([x, 0.02, z], [x, 1.9 + (i % 2) * 0.35, z]));
          }
          a.push(...T.blob(0.45, -2.9, 2.6, 0.3, 2));
          a.push(...T.blob(0.38, 2.9, 2.9, -0.2, 2));
          // The lectern people put their hand on.
          a.push(...T.panel(1.0, 0.6, 0, 1.1, 1.6, 0, -1.1));
          a.push(...T.line([0, 0, 1.6], [0, 1.0, 1.6]));
        }
      }
    ]
  },

  // Nodeshed: the long six-sided warehouse from the notebook plan, entrance at
  // the +x end, the Buddha Bowl room partitioned off at the far end.
  nodeshed: {
    floor: { poly: [[-13, 0], [-9, -5.5], [9, -5.5], [13, 0], [9, 5.5], [-9, 5.5]] },
    // Edge 3 runs from the entrance point round to the near corner; it is
    // the way in, so it is left open.
    wall: { height: 3.2, open: [3] },
    view: { back: 1.3, lift: 1.0 },
    extra(a, T) {
      // The partition that makes the Buddha Bowl its own dark room, with a
      // doorway in the middle.
      for (const [z0, z1] of [[-5.5, -1.3], [1.3, 5.5]]) {
        a.push(-6.5, 0, z0, -6.5, 0, z1, -6.5, 3.2, z0, -6.5, 3.2, z1);
        for (let z = z0; z <= z1 + 0.01; z += (z1 - z0) / 3) a.push(-6.5, 0, z, -6.5, 3.2, z);
      }
      // An arrow on the floor at the entrance.
      a.push(13.6, 0, 3.6, 11.4, 0, 2.2, 11.4, 0, 2.2, 12.4, 0, 2.1, 11.4, 0, 2.2, 11.9, 0, 3.0);
    },
    items: [
      {
        id: 'drawings', label: 'See your drawings come to life', note: 'draw a character, watch it move',
        target: 'drawings-come-to-life',
        at: [8.4, -3.4],
        build(a, T) {
          a.push(...T.box(2.4, 0.08, 1.1, 0, 0.9, 0));          // the drawing table
          for (const [x, z] of [[-1.1, -0.5], [1.1, -0.5], [-1.1, 0.5], [1.1, 0.5]]) {
            a.push(...T.line([x, 0, z], [x, 0.86, z]));
          }
          a.push(...T.panel(0.5, 0.35, -0.5, 0.95, 0, 0, Math.PI / 2)); // paper
          a.push(...T.panel(2.6, 1.5, 0, 2.0, -1.6));            // the "Hello" screen
        }
      },
      {
        id: 'balle', label: 'Balle Balle Drawing', note: 'the body as a paintbrush',
        target: 'balle-balle',
        at: [2.8, -4.9],
        build(a, T) {
          a.push(...T.grid(4.6, 2.4, 3, 2, 0, 1.6, 0));          // the wall of screens
          a.push(...T.ring(0.7, 0.02, 0, 2.2));                  // where you stand
          a.push(...T.box(0.3, 0.3, 0.3, 0, 2.95, 0.3));         // the camera
        }
      },
      {
        id: 'rained', label: 'Rained In', note: 'rain you conduct with your hands',
        target: 'rained-in',
        at: [-2.6, -4.1],
        build(a, T) {
          a.push(...T.box(3.2, 2.9, 1.0, 0, 1.45, 0));           // the LED curtain frame
          for (let i = 1; i < 12; i++) {                        // its strands
            const x = -1.6 + (3.2 * i) / 12;
            a.push(...T.line([x, 0.1, 0.5], [x, 2.9, 0.5]));
          }
          a.push(...T.line([0, 0, 2.2], [0, 1.0, 2.2]));        // the stand
          a.push(...T.panel(0.7, 0.4, 0, 1.05, 2.2, 0, -1.2));
          a.push(...T.ring(0.35, 0.02, 0, 2.2, 0, Math.PI * 2, 16));
        }
      },
      {
        id: 'ledwalls', label: 'LED walls moving around', note: 'kinetic LED, digital into physical',
        target: 'led-walls',
        at: [3.6, 3.6],
        build(a, T) {
          a.push(...T.box(4.4, 2.6, 1.2, 0, 1.3, 0));
          a.push(...T.grid(4.4, 2.6, 4, 3, 0, 1.3, -0.62));
          // A second leaf pushed forward: the wall mid-move.
          a.push(...T.grid(1.6, 1.3, 2, 2, -1.2, 1.95, -1.3));
          a.push(...T.line([-2.0, 1.3, -1.3], [-2.0, 1.3, -0.62]));
          a.push(...T.line([-0.4, 1.3, -1.3], [-0.4, 1.3, -0.62]));
        }
      },
      {
        id: 'onlyfans', label: 'Only Fans', note: 'a pedestal fan and its LED hologram',
        target: 'only-fans',
        at: [-3.2, 3.9],
        build(a, T) {
          // The pedestal fan, and the paper fluttering in front of it.
          a.push(...T.line([-1.1, 0, 0], [-1.1, 1.4, 0]));
          a.push(...T.ring(0.35, 0.02, -1.1, 0, 0, Math.PI * 2, 16));
          a.push(...T.hoop(0.45, -1.1, 1.8, 0, 0));
          a.push(...T.panel(0.4, 0.55, -1.1, 1.6, -0.9, 0, 0.3));
          // The LED holographic fan: a hoop with its blades.
          a.push(...T.line([1.1, 0, 0], [1.1, 1.4, 0]));
          a.push(...T.ring(0.35, 0.02, 1.1, 0, 0, Math.PI * 2, 16));
          a.push(...T.hoop(0.6, 1.1, 2.0, 0, 0));
          for (let k = 0; k < 4; k++) {
            const t = (k / 4) * Math.PI * 2;
            a.push(1.1, 2.0, 0, 1.1 + Math.cos(t) * 0.6, 2.0 + Math.sin(t) * 0.6, 0);
          }
          // The benches in front, from the plan.
          a.push(...T.box(2.8, 0.45, 0.6, 0, 0.22, -1.8));
        }
      },
      {
        id: 'buddha', label: 'Buddha Bowl', note: 'ask a question, watch it dissolve',
        target: 'buddha-bowl',
        at: [-9.6, 0],
        build(a, T) {
          a.push(...T.ring(0.45, 0.55, 0, 0, 0, Math.PI * 2, 28)); // the bowl
          a.push(...T.ring(0.3, 0.3, 0, 0, 0, Math.PI * 2, 24));
          a.push(...T.box(0.8, 0.28, 0.8, 0, 0.14, 0));           // its stool
          for (const [x, z] of [[1.2, 1.1], [1.2, -1.1], [1.7, 0]]) {
            a.push(...T.ring(0.42, 0.06, x, z, 0, Math.PI * 2, 20)); // cushions
          }
          // The projection of circles on the end of the room.
          a.push(...T.hoop(1.1, -2.2, 1.7, 0, Math.PI / 2));
          a.push(...T.hoop(0.6, -2.2, 1.7, -1.6, Math.PI / 2));
          a.push(...T.hoop(0.6, -2.2, 1.7, 1.6, Math.PI / 2));
        }
      }
    ]
  },
  // Middle Room Fest: the venue as a three-storey cutaway, front wall left
  // off -- the Courtyard on the ground, the Middle Room above it, and the
  // Conservatory on top under its glass roof.
  middleroom: {
    floor: { poly: [[-7, -4], [7, -4], [7, 4], [-7, 4]] },
    // Edge 2 is the front; it is left open so the floors can be seen into.
    wall: { height: 3.4, open: [2] },
    view: { back: 2.15, lift: 1.4, target: 6.2 },
    extra(a, T) {
      // The two upper floor plates, the walls that carry them, and the
      // pitched glass roof.
      for (const y of [3.6, 7.2]) {
        a.push(-7, y, -4, 7, y, -4, 7, y, -4, 7, y, 4, 7, y, 4, -7, y, 4, -7, y, 4, -7, y, -4);
        for (let x = -7; x <= 7.01; x += 14 / 8) a.push(x, y, -4, x, y + 3.4, -4);
        for (const z of [-4, 0, 4]) {
          a.push(-7, y, z, -7, y + 3.4, z, 7, y, z, 7, y + 3.4, z);
        }
      }
      a.push(-7, 10.8, -4, 7, 10.8, -4, -7, 10.8, 4, 7, 10.8, 4);
      a.push(-7, 12.3, 0, 7, 12.3, 0);
      for (let x = -7; x <= 7.01; x += 14 / 6) {
        a.push(x, 10.8, -4, x, 12.3, 0, x, 12.3, 0, x, 10.8, 4);
      }
      a.push(-7, 3.4, -4, -7, 3.4, 4, 7, 3.4, -4, 7, 3.4, 4);
    },
    items: [
      {
        id: 'courtyard', label: 'Courtyard', note: 'LED screens and a crowd feedback loop',
        target: 'courtyard',
        at: [0, 0],
        build(a, T) {
          // Three LED screens on stands, facing the crowd.
          for (const x of [-3.2, 0, 3.2]) {
            a.push(...T.grid(2.4, 1.4, 4, 2, x, 2.1, -2.6));
            a.push(...T.line([x, 0, -2.6], [x, 1.4, -2.6]));
          }
          // The camera that turns the crowd back into the picture.
          a.push(...T.box(0.35, 0.25, 0.35, 0, 2.9, 2.2));
          a.push(...T.line([0, 0, 2.2], [0, 2.78, 2.2]));
          // The crowd, as spots on the floor.
          for (const [x, z] of [[-2.4, 0.6], [-1.0, 1.2], [0.8, 0.4], [2.2, 1.3], [-0.2, -0.4], [1.8, -0.6], [-2.0, -0.8]]) {
            a.push(...T.ring(0.3, 0.02, x, z, 0, Math.PI * 2, 14));
          }
        }
      },
      {
        id: 'middleroom', label: 'Middle Room', note: 'vinyl records, mapped',
        target: 'middle-room',
        at: [0, 0],
        build(a, T) {
          const y = 3.6;
          // The decks: a table with two turntables on it.
          a.push(...T.box(2.6, 0.9, 0.9, 0, y + 0.45, 0.8));
          for (const x of [-0.65, 0.65]) {
            a.push(...T.ring(0.34, y + 0.92, x, 0.8, 0, Math.PI * 2, 24));
            a.push(...T.ring(0.06, y + 0.92, x, 0.8, 0, Math.PI * 2, 8));
          }
          // The records hung on the back wall, each one mapped.
          for (const [x, h] of [[-4.2, 5.6], [-2.1, 5.1], [0, 5.7], [2.1, 5.1], [4.2, 5.6]]) {
            a.push(...T.hoop(0.6, x, h, -3.9));
            a.push(...T.hoop(0.38, x, h, -3.9));
            a.push(...T.hoop(0.12, x, h, -3.9));
          }
        }
      },
      {
        id: 'conservatory', label: 'Conservatory', note: 'three projectors on the roof',
        target: 'conservatory',
        at: [0, 0],
        build(a, T) {
          const y = 7.2;
          // The roof slope: height at a given z under the pitched glass.
          const roof = (z) => 10.8 + 1.5 * (1 - Math.abs(z) / 4);
          for (const x of [-4.2, 0, 4.2]) {
            // A projector on a stand, throwing up at the glass.
            a.push(...T.line([x, y, 1.6], [x, y + 1.0, 1.6]));
            a.push(...T.box(0.5, 0.3, 0.4, x, y + 1.15, 1.6));
            const q = [[x - 1.4, -3.2], [x + 1.4, -3.2], [x + 1.4, -0.8], [x - 1.4, -0.8]]
              .map(([px, pz]) => [px, roof(pz), pz]);
            for (let i = 0; i < 4; i++) {
              a.push(...T.line([x, y + 1.3, 1.4], q[i]));
              a.push(...T.line(q[i], q[(i + 1) % 4]));
            }
          }
          // The low seating for the ambient sets.
          a.push(...T.box(5.0, 0.4, 0.8, 0, y + 0.2, 3.0));
        }
      }
    ]
  }
};
