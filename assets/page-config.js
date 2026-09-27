// Controls which projects appear on which list page, in what order, and
// (facilitation.html only) whether a project is in the dark-only or
// bright-only group. work.html/play.html/gmmbbq.html/facilitation.html read
// this at load time and build their project cards from it +
// assets/manifest.js + assets/project-details.js.
//
// The per-project pages under projects/ read it too: a project's section,
// its back link and its prev/next arrows are all derived from the array it
// appears in here (see assets/render-project.js). A project that appears in
// no array still gets a page — it just falls back to linking home.
//
// To rearrange projects:
//   - Reorder within a page: reorder the entries in that page's array.
//   - Move a project to a different page: cut its entry from one array,
//     paste it into another.
//   - Change facilitation.html's light/dark grouping: change `group`.
//     (No project uses `group` right now — facilitation shows all three
//     cards on both themes.)
//   - Rename a project on the site without renaming its source folder:
//     add `displayName: "New Name"` to its entry.
//   - Add/remove a project entirely: add or remove the folder under
//     GMMBBQ/, Jishnu/, or OnebyZero/, rerun `python scripts/build_assets.py`,
//     then add/remove its "category/slug" key here. Rerun
//     `python scripts/build_project_pages.py` to sync projects/.
//
// Each entry: { key: "category/slug", group: "dark" | "bright", displayName: "..." }
// `key` must match a key in assets/manifest.js exactly. `group` only matters
// on facilitation.html. `displayName` is optional.
const PAGE_CONFIG = {
  // Order follows the notebook: the work run of write-ups, then the
  // Unconference box that closes it. Sobha follows Nodeshed because it
  // was commissioned off the back of it. Nodeshed and 6th Sense live here rather
  // than under play -- both are written up as commissioned work.
  work: [
    { key: "jishnu/fieldlinesim", displayName: "Voltage Line Sim" },
    { key: "onebyzero/echoesofearth" },
    { key: "onebyzero/nodeshed" },
    { key: "jishnu/sobha" },
    { key: "onebyzero/middleroom" },
    { key: "onebyzero/sixthsense" },
    { key: "jishnu/unconference" }
  ],
  // The notebook's own list for Play was:
  //
  //   1) Robot                      4) String theory
  //   2) Slightly Emasculated Man   5) Painting w eyes
  //   3) GMMBBQ -- Alien Garden, Portal, Joy Orbison, Bloom,
  //                Mapping materials, CRTs
  //
  // Item 3 was never one project; it was the whole gig practice listed as a
  // single line. It has been pulled out into `gmmbbq` below, which is what
  // the notebook calls "gamma gigs", and Play keeps items 1, 2, 4 and the
  // mapping work.
  //
  // Still missing a folder, so still not here: Ektya, Portal, and Painting w
  // Eyes (content promised).
  // Play is now the personal, experimental end of the work: the four pieces
  // that are mine, that have a real write-up, and that are not a gig. The
  // gigs moved out to `gmmbbq` below, which is where they were always
  // described -- play's own origin story was, on inspection, GMMBBQ's origin
  // story, and it moved with them.
  play: [
    { key: "jishnu/emasculatedman", displayName: "A Slightly Emasculated Man" },
    { key: "gmmbbq/mappingmaterials", displayName: "Mapping Materials" },
    { key: "gmmbbq/stringtheory", displayName: "String Theory" },
    { key: "jishnu/fucknrobot", displayName: "The Robots Killed the Video Star" }
  ],
  // GMMBBQ: the live-visuals practice, on its own page under play rather
  // than beside it. Not a fourth section -- it takes play's magenta and no
  // slot in the section nav, so the CMY set stays closed at three.
  //
  // gmmbbq.html no longer builds cards from this list: it is one page that
  // shows every gig in full and links to none of them (its gig list is in
  // its own script). This array is still what gives each gig's own page
  // under projects/ its section colour, back link and prev/next.
  //
  // CR2s leads because it is the only one here with a written case study,
  // and because it is the CRTs -- the same two televisions the origin story
  // on this page is about. The rest follow in the order they were given.
  //
  // MidRoom and Tycho's Tones came off the site entirely. Their entries are
  // gone from here, which is all it takes; their media under assets/ and
  // their source folders are untouched, so putting either back is a matter
  // of restoring one line.
  gmmbbq: [
    { key: "gmmbbq/cr2s", displayName: "CR2s" },
    { key: "gmmbbq/burrow" },
    { key: "gmmbbq/aliengarden", displayName: "Alien Garden" },
    { key: "gmmbbq/bloom" },
    { key: "gmmbbq/rawshit" },
    { key: "jishnu/handsonexplorations", displayName: "HandsOn" },
    { key: "gmmbbq/joyorbisonwhp", displayName: "JoyOrbison" }
  ],
  facilitation: [
    { key: "jishnu/jklu" },
    { key: "jishnu/somaiya" },
    { key: "jishnu/strate" }
  ]
};
