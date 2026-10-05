// Hand-authored case-study content, keyed the same way as assets/manifest.js
// ("category/slug"). This file is NOT touched by scripts/build_assets.py or
// scripts/build_project_pages.py — edit it directly. Any field can be left
// out; a project page only renders sections that have content.
//
// `year`, `tools` and `overview` are also what the list pages
// (work/play/facilitation) show on each card, via assets/render-projects.js.
// Leaving a project as {} renders a card with nothing but its title and
// thumbnail, so keep at least those three fields filled in.
//
// Shape per project:
//   {
//     year: "2026",
//     role: "Design & development",
//     tools: ["TouchDesigner", "Python"],
//     overview: "1-3 sentence description of what the project is.",
//     process: "How it was made / the approach taken.",
//     credits: "Collaborators, commissioners, etc.",
//     youtube: "8thJDYB_lSU",   // the id only, not the whole watch URL
//                               // — plays above the gallery, see render-project.js
//     hero: "neel-1",           // the clip on the project's screen on work /
//                               // play: a name in assets/curated-media.js
//     story: [ ...blocks... ]   // the long form, see below
//   }
//
// `story` is the case study proper: an ordered list of blocks, rendered by
// assets/render-project.js.
//
//   { h: "A subheading" }
//   { p: "A paragraph. **bold** and *italic* work inside one." }
//   { p: "...", figure: 2, side: "right" }   paragraph with an image beside it
//   { figure: 0, caption: "...", side: "full" }   an image on its own
//   { quote: "A pulled line.", cite: "Who said it" }
//   { h: "BeePod", id: "beepod" }              a heading the 3-D map can link to
//   { p: "...", media: "beepod-1", side: "left" }   a named file (curated-media.js)
//   { media: ["a", "b"], side: "full" }         several files side by side
//   { media: "vid:0" }                          the manifest's first clip
//   { media: "assets/.../diagram.svg" }         line art, drawn in the page's ink
//   { p: "...", embed: "https://www.instagram.com/reel/…" }   Instagram player
//   { space: "echoes" }                         a 3-D plan from assets/spaces.js
//   Inside a paragraph, [text](projects/x.html) makes a link.
//
// `gallery: [...]` names the gallery outright (the same references as
// `media`, plus plain numbers for manifest stills). Without it the gallery is
// every manifest still and clip, as before.
//
// `figure` is an index into this project's own media -- 0 is its first image,
// and it wraps, so the same story works for a project with two images and one
// with nine. `side` is "left", "right" or "full" and defaults to "full".
//
// Until a project has its own, every page falls back to PLACEHOLDER_STORY
// below and is labelled as such on screen, so unfinished copy cannot be
// mistaken for the real thing.

// Deliberately Latin. Prose that reads like a real account of the work would
// be indistinguishable from the finished thing at a glance, and this is going
// on a portfolio -- placeholder that cannot be mistaken for a claim is worth
// more here than placeholder that flows nicely.
const PLACEHOLDER_STORY = [
  { h: "The brief" },
  { p: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. **Ut enim ad minim veniam**, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    figure: 0, side: "right" },
  { p: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum." },

  { h: "Making it" },
  { p: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, *eaque ipsa quae ab illo inventore* veritatis et quasi architecto beatae vitae dicta sunt explicabo.",
    figure: 1, side: "left" },
  { p: "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. **Neque porro quisquam est**, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit." },

  { quote: "Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam.", cite: "Placeholder attribution" },

  { figure: 2, side: "full", caption: "Placeholder caption — replace with a real note about this image." },

  { h: "What came out of it" },
  { p: "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident." },
  { p: "Similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et *expedita distinctio*. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus.",
    figure: 3, side: "right" }
];

const PROJECT_DETAILS = {
  // --- work ---
  "jishnu/fieldlinesim": {
    year: "2025",
    role: "Design & development",
    tools: ["TouchDesigner", "Python", "Machine Learning"],
    credits: "Built in collaboration with Param Innovation, Bangalore.",
    overview: "A learning tool deployed in schools, built with Param Innovation in Bangalore. A hands-on way for students to get at the basics of electrostatics — voltage, fields and field lines — by putting the field on the table in front of them.",
    story: [
      { h: "The brief" },
      { p: "The voltage line sim is a learning tool deployed at schools in collaboration with **Param Innovation** in Bangalore. It is a hands-on way for students to understand the basics of electrostatics — voltage, fields and field lines — by putting the field itself on the table in front of them.",
        embed: "https://www.instagram.com/reel/DNnkp42yQVZ/", side: "right" },
      { p: "Different phenomena can be simulated in the system: *electrostatic shielding*, dielectrics, and the way a field redraws itself the moment a charge moves." },

      { h: "How it works" },
      { p: "Pick up a token — a proton or an electron. Place it on the table. Look at what the field lines do. Switch between **voltage** and **electric field** and watch the same arrangement described two different ways." },

      { h: "Making it" },
      { media: "assets/jishnu/fieldlinesim/diagram-setup.svg", side: "full",
        caption: "The setup: a screen laid flat as a table, a camera over it, and a student placing tokens." },
      { media: "assets/jishnu/fieldlinesim/diagram-steps.svg", side: "full",
        caption: "What a student does, in four steps." },
      { p: "Tokens are placed on the screen and photographed, then classified and used to train a model that recognises them where they sit. Keeping the screen lit through training was the awkward part — the field lines it draws mess things up — so the training pass and the display pass had to be kept apart.",
        media: "vid:0", side: "left" },
      { media: "assets/jishnu/fieldlinesim/diagram-training.svg", side: "full",
        caption: "From the notebook's process page: photograph, classify, train, then run it all in one loop." },
      { p: "The shader and the model both run out of Python, so the field solve and the recognition sit in the same loop." },

      { h: "Where it went" },
      { p: "The installation has since been taken up by the **Param Foundation** as part of their educational outreach programmes, travelling to schools across Karnataka." }
    ],
    gallery: [0, 1, "vid:1"]
  },
  "onebyzero/echoesofearth": {
    hero: "neel-1",
    year: "2024",
    role: "Concept, design & development",
    tools: ["Installation", "TouchDesigner", "LED", "Sensing"],
    credits: "Made with 1/0 — though we didn’t know we were 1/0 at the time.",
    overview: "A chill zone for Echoes of Earth, filled out with four new media installations under the festival’s theme of seasons of change — somewhere to sit down once the dancing has worn you out.",
    story: [
      { h: "The brief" },
      { p: "For Echoes of Earth we were commissioned to fill out their chill zone with a bunch of different installations, all under their theme of **seasons of change**." },
      { p: "The goal was to create a space interspersed with different new media installations, offering people somewhere to just hang out when they are tired from all the dancing." },

      { h: "The space" },
      { media: "wholespace", side: "full", caption: "The whole chill zone." },
      { space: "echoes" },

      { h: "BeePod", id: "beepod" },
      { p: "A rotating one-person enclosure, built with the forms and patterns of a beehive, that people need to step into. As the enclosure rotates, the viewer sees different flowers on a screen through different coloured lenses. The idea is to see, from a pollinating bee’s eyes, the different flowering plants that bloom through the seasons.",
        media: "beepod-1", side: "left" },
      { media: ["beepod-2", "beepod-3"], side: "full" },

      { h: "W.A.S.P — Web of Audio and Spatial Patterns", id: "wasp" },
      { p: "Enter into the wasp’s nest. An interactive installation with several wasp eggs and hives that wakes the hive up when a user enters. An instrument, an audiovisual experience — there need to be better words to really describe what is happening — that people can play by placing their hand. As people prod into different parts of the nest, different parts of the hive wake up.",
        media: ["wasp-1", "wasp-2"], side: "right" },

      { h: "Neelkurunji Blossom", id: "neelkurunji" },
      { p: "Flowers that blossom once every twelve years in Karnataka. This installation looks beyond concepts of seasons that are restricted to within a year. Made largely from upcycled materials, with some 3D printed parts to hold the installation together, the flowers blossom and light up as a visitor comes close to it.",
        media: ["neel-1", "neel-2"], side: "left" },

      { h: "Memories of a Tree", id: "memories-of-a-tree" },
      { p: "At the entrance of the chill zone, a welcoming scene for people to walk into — the tree of life from the notebook, a net canopy strung between the trees.",
        embed: "https://www.instagram.com/reel/DEhrKg9SJQv/", side: "right" },
      { media: "tree-1", side: "full" },

      { h: "Process", id: "process" },
      { media: ["process-1", "process-2"], side: "full", caption: "Putting it together on site." }
    ],
    // Repeats out: the whole-space shot is in the story, stills 0 and 1 are
    // the Neelakurinji and BeePod the story already shows, 2-4 are one wide
    // shot three times, the crowd was photographed twice, and clip-1662 is
    // the WASP clip again.
    gallery: [
      "card-1", "card-2", "crowd-1", 3,
      "clip-1664", "clip-1668", "clip-1670", "clip-1675"
    ]
  },
  "onebyzero/nodeshed": {
    hero: "painting-2",
    year: "2025",
    role: "Concept, design & development",
    tools: ["TouchDesigner", "VCV Rack", "Kinetic LED", "Gesture Control"],
    credits: "Run with 1/0 and Craftech 360, at their space off Mysore Road.",
    overview: "An exhibition of our own, in a warehouse on top of a building off Mysore Road: six installations and a TouchDesigner workshop, put together with Craftech 360.",
    story: [
      { h: "How it happened" },
      { p: "At some point, the boys and I decided we should pull off an exhibition of our own. One of us had been working for **Craftech 360**, a mixed media vendor for large corporate events, and wondered if it would be a good idea for us to collaborate.",
        embed: "https://www.instagram.com/p/DO-yBRFAdfv/", side: "right" },
      { p: "Craftech had been conducting an event called Node Shed at their space called Nodeshed — it’s all a bit confusing — from the year prior. It was a series of workshops over a weekend, attended by a few albeit very, very interested individuals. We decided we would amp it up a notch this time around.",
        media: "signal", side: "left", loop: true },
      { p: "Nodeshed is a warehouse on top of a building, smack in the butt crack of a gulley somewhere off Mysore Road, next to a blackened, smelly river called Vrishabhavati. *Vishabhavati*, more like — visha being poison." },

      { h: "The space" },
      { space: "nodeshed" },

      { h: "Rained In", id: "rained-in" },
      { p: "Inspired by Bangalore’s ability to start raining moments after causing several heatstrokes — weather that is usually quite gentle and sometimes quite mercurial. **Rained In** is an interactive audiovisual experience where users control the amount of rain, and where it is raining, using their hands. Rain sounds are a mixture of samples and synthesis, using VCV Rack and TouchDesigner.",
        embed: "https://www.instagram.com/reel/DNdVBptP90S/", side: "right" },

      { h: "Buddha Bowl", id: "buddha-bowl" },
      { p: "A guided interactive experience that prompts users to ask questions about themselves, while leading them to question the very questions that they ask. Using the Buddha bowl and their voice as a medium, visitors witness their thoughts collapse into the ether as they delve deeper into their meditative experience.",
        media: "buddhabowl", side: "left" },

      { h: "Only Fans", id: "only-fans" },
      { p: "Two fans. One a normal pedestal fan, blowing onto a piece of paper that flutters in the wake of the air from the fan. The other an LED holographic fan, creating a virtual illusion of the same.",
        media: "onlyfans", side: "right" },

      { h: "Balle Balle Drawing", id: "balle-balle" },
      { p: "A playful drawing tool using gesture controls. An exploration of the body as a paintbrush. Users do a balle balle gesture to erase their drawings.",
        media: "balleballe", side: "left" },

      { h: "LED walls moving around", id: "led-walls" },
      { p: "Craftech’s proprietary moving LED wall system, used to create a space where users — being virtual beings inside the LED wall — would perform actions to make the LEDs move in real physical space. Kinetic LED, to mix and merge digital movements with physical ones.",
        media: "ledwalls", side: "right" },

      { h: "See your drawings come to life", id: "drawings-come-to-life" },
      { p: "Draw a character. See the character animated seconds later." },

      { h: "Workshops", id: "workshops" },
      { p: "We also conducted a TouchDesigner workshop, introducing people to the basics of TouchDesigner." }
    ],
    // A few, all different: most of the night's footage is the rain wall
    // from one more angle, and one of those is enough.
    gallery: [0, "g-3063", "onlyfans-2", "g-3026", "painting-2", "g-3031", "g-3074"]
  },
  "jishnu/sobha": {
    hero: "set-3",
    year: "2025",
    role: "Volumetric lighting design",
    tools: ["Volumetric Lighting", "Exhibition"],
    credits: "Commissioned by Craftech 360 for Sobha Realty’s exhibition in Dubai.",
    overview: "A volumetric lighting set for Sobha Realty’s Dubai exhibition, commissioned through Craftech 360. The question underneath it: how do you turn a 2D moodboard into a 3D volumetric experience?",
    story: [
      { p: "This commission came out of [Nodeshed](projects/nodeshed.html) — it followed after the work we put up there had been noticed." },

      { h: "The brief" },
      { p: "Sobha Realty is India’s premier construction company, and I was commissioned by **Craftech 360** to prepare a volumetric lighting set for their exhibition in Dubai.",
        media: "viz-1", side: "right" },
      { p: "The project sits close to the work done for *Nodeshed* — the same instinct about light as a material with volume, rather than a thing you point at a surface." },

      { h: "The actual problem" },
      { p: "This project is an example of something that people have the tech for, but cannot think of the different storytelling possibilities that exist on the tech. The equipment was never the constraint." },
      { quote: "How to convert a 2-D moodboard into a 3-D volumetric experience.", cite: "The whole job, in one line" },
      { p: "Everything after that is translation — taking flat reference and working out what it wants to be once it has depth, haze, and a viewer who can walk around inside it.",
        media: "viz-2", side: "left" },
      { media: ["viz-3", "viz-4"], side: "full", caption: "Visualisations, worked out before anything was hung." },

      { h: "The set" },
      { media: ["set-still", "set-1"], side: "full", caption: "The finished volumetric set." }
    ],
    gallery: ["set-2", "set-3", "set-4", "set-5"]
  },
  "onebyzero/middleroom": {
    year: "2025",
    role: "Visual direction & operation",
    tools: ["TouchDesigner", "After Effects", "Affinity", "Resolume"],
    overview: "A full visual setup for Middle Room Fest — three floors, two days, each floor with its own distinct vibe, from roof projections to mapped vinyl records.",
    story: [
      { h: "The brief" },
      { p: "We love music. Which is why it was almost impossible for us to say no when the folks from Middle Room asked us to do a full visual setup for their event, **Middle Room Fest**." },
      { p: "Spanning over three floors, each with their own distinct vibes, we were tasked with creating and curating visuals for their different performances over two days.",
        figure: 3, side: "right" },
      { space: "middleroom" },

      // A few of the best from each floor, under the floor they were shot
      // on: the LED walls are the Courtyard, the vinyl wall and the sign are
      // the Middle Room, the ceiling projections are the Conservatory.
      { h: "Courtyard", id: "courtyard" },
      { p: "On the ground floor we set up a bunch of LED screens and added some crowd feedback loop effects to jazz stuff up.",
        media: "vid:0", side: "left" },
      { media: "r-9444", side: "full" },

      { h: "Middle Room", id: "middle-room" },
      { p: "Mapped out their vinyl records to create cool scenes.",
        media: "vid:1", side: "right" },
      { media: "r-9437", side: "full" },

      { h: "Conservatory", id: "conservatory" },
      { p: "A three projector set up, for roof projections. Mostly ambient sets with themes of flowing water and life.",
        figure: 2, side: "left" },
      { media: ["roof-tunnel", "roof-lava", "roof-cells"], side: "full" },

      { h: "Tech used" },
      { p: "TouchDesigner, After Effects, Affinity and Resolume — across roof mapping, vinyl mapping, TV installations and LED walls." }
    ],
    // What belongs to no one floor: the crew in the stairwell (taken four
    // times over, img-02 to img-05 -- one kept) and one of the three shots
    // of the glowing cube.
    gallery: [4, 8]
  },
  // Every file here is from assets/NewAssets/Projects/6thSense, and none
  // appears twice -- between the story and the gallery, nothing repeats. (The card's two plates are made from img-08 and IMG_4241, which
  // also appear once each below.)
  "onebyzero/sixthsense": {
    hero: "v-4241",
    year: "2025",
    role: "Concept, design & development",
    tools: ["TouchDesigner", "Ableton Live", "FL Studio", "Procreate"],
    credits: "Shown at 6th Sense, conducted by Node Institute — not to be mistaken with Nodeshed.",
    overview: "Beyond Conversations — a set of short stories told in LED light and sound, following the conversations a spider has with its web.",
    story: [
      { h: "Where it was" },
      { p: "At **6th Sense**, conducted by Node Institute — not to be mistaken with Nodeshed — we set up our A/V installation, again, called Beyond Conversations. We were one of only two Indian teams called to present our work at the exhibition.",
        embed: "https://www.instagram.com/reel/DU3KfIsk2vo/", side: "right" },
      { p: "Beyond Conversations is a set of short stories told through the form of LED lights and sounds. It follows the conversations that a spider has with its web in several different scenarios.",
        media: "v-4238", side: "left" },

      { quote: "If a picture is worth a 1000 words, I have no idea how many words are required to explain an audio visual experience. Yet I shall try.", cite: "From the notebook" },

      { h: "One of the stories" },
      { p: "The spider jumps from light to light, trying to find a place to stay. In the cacophony of city noises and traffic, the spider roams the room frantically. It finally settles down in a spot with nature — with sounds of birds and creeks, and the warm light of the sun.",
        media: "v-4241", side: "right" },
      { media: ["img-08", "v-4230"], side: "full" },

      { h: "Tech used" },
      { p: "TouchDesigner, Ableton, FL Studio and Procreate.",
        media: "img-06", side: "left" }
    ],
    // One of each moment: img-07 and p-4234/4235/4239 are the scene the
    // story already shows, 4210/4218/4224 stay near-black the whole way
    // through, and 4217, 4229 and 4236 are 4216, 4226 and 4232 again.
    gallery: [
      "p-4240", "p-4243",
      "v-4216", "v-4223", "v-4226", "v-4232", "v-4209", "v-4231", "v-4242", "v-4244"
    ]
  },
  "jishnu/unconference": {
    hero: "touch-1",
    year: "2025",
    role: "Design & development",
    tools: ["LIDAR", "TouchDesigner", "Interaction"],
    overview: "A LIDAR-sensed booth wired to an LED screen — walk up, touch it, and watch different products just doing their thing.",
    story: [
      { h: "The build" },
      { p: "Put up a **LIDAR sensed booth** and connected it to an LED screen that people could touch, and look at different interactions of different products just doing their thing.",
        figure: 0, side: "right" }
    ],
    // The booth was photographed eight times from nearly the same spot; two
    // angles and the two clips.
    gallery: [4, 6, "vid:0", "vid:1"]
  },
  // --- play ---
  // The robot is a UR10e -- the long-reach one of the pair -- going by the
  // arm in the prototype clips. The syncing and content sections below are
  // written up from how a piece like this gets made rather than from notes,
  // so they want a read-through before anyone quotes them back.
  "jishnu/fucknrobot": {
    year: "2025",
    role: "Concept, content & interaction",
    tools: ["Universal Robots UR10e", "TouchDesigner", "LED Wall", "Motion Design"],
    overview: "A TV on the end of a robot arm, in conversation with an LED wall behind it. A layered way of looking at ancient Indian sciences, starting with Aryabhata.",
    story: [
      { h: "Old tech, new tech" },
      { p: "The idea with this one was to use a robot to build a layered way of looking at content about ancient Indian sciences. We had a Universal Robots **UR10e**, the bigger of the two arms, and on the end of it we mounted a TV. Behind the whole thing sits an LED wall. Whatever is playing on the TV decides what happens on the LED wall, so as the robot swings the TV around, new stuff gets pulled out onto the big screen behind it.",
        youtube: "cmfUK0U_S6E", side: "right" },
      { p: "So there is a conversation going on. The robot says something, the wall answers, and the robot moves on to the next thing. A dialogue between old tech and new tech, which felt right for a piece about people who were working out how the sky moves with a stick and its shadow, some fifteen hundred years before any of this existed." },

      { h: "Aryabhata" },
      { p: "The main content on the screens covers the story and the discoveries of **Aryabhata**. He was twenty three when he wrote the *Aryabhatiya*, in 499 CE. In it he works out that the earth spins on its own axis, that the moon and the planets shine because they reflect the sun, how eclipses actually happen, and a value of pi that holds up to four decimal places. No telescope. I have a phone with maps on it and I still get lost on the way to Indiranagar." },
      { p: "The TV carries the small, close up version of a moment, the sun, the moon, a number, and the LED wall blows it up into the bigger picture around it. Move the TV and the story moves somewhere else, and the wall follows it there." },

      { h: "Prototyping" },
      { p: "Before anything expensive went anywhere near the arm, we strapped the TV's own cardboard box to it. A slightly sad looking robot, but it did its job. The worry was the wires. A TV on the end of a six axis arm needs power and a video signal, and every time the wrist turns, those cables want to wind themselves around it like noodles on a fork. So we ran the whole routine with the box, again and again, watching where the cables pulled, snagged and tangled, and rerouted them until the arm could go through every move without strangling itself.",
        media: "proto-box", side: "left" },
      { p: "Once the box could get through a full run without getting tied up, the real screen went on, with rough first passes of the content playing on it and a projection on the studio wall standing in for the LED wall. That is where we started working out the choreography, what the TV shows at which point in the arm's path, and what the wall does about it.",
        media: "proto-screen", side: "right" },

      { h: "Keeping everything in sync" },
      { p: "The hardest bit by far was timing. The robot runs on its own controller, on its own clock, at whatever speed is safe for a TV to be swung around at. The LED wall runs out of TouchDesigner. The TV plays its own content. That is three things that each think they are in charge. If the wall reacts even a few frames after the TV gets somewhere, the whole illusion of the two of them talking falls apart, and what you are left with is two screens playing two videos near a robot." },
      { p: "We ended up reading the arm's position back into TouchDesigner and running everything off that. The robot became the clock. When it slows down at the end of a move, the content slows down with it, and when it pauses, everything waits for it." },

      { h: "Making stuff for a screen that moves" },
      { p: "Nobody really makes content for a TV that flies around. Things that look great on a screen that stays put turn to mush once the screen is moving. Small text becomes unreadable, quick cuts make you seasick, and anything sitting near the edge of the frame is gone the moment the TV tilts. We redid a lot of it. Bigger, slower, bolder, with the important bits kept in the middle of the frame, and every scene built around where the TV would physically be at that point in the routine." },
      { p: "On top of that the LED wall and the TV have completely different colours, brightness and pixel density, so the same sun on both of them looked like two different suns. A good few evenings went into getting the two to look like they belonged to the same sky." },
      { media: "vid:1", side: "full", caption: "The TV and the LED wall, mid conversation." }
    ],
    gallery: []
  },
  // No year on this one: neither the notebook nor the PDF dates it, and a
  // year on a portfolio is a claim. Left off rather than guessed.
  //
  // Laid out slide for slide as it was in the old portfolio PDF (pages
  // 51-60), one `spread` per slide on the PDF's own 1000 x 625 page. The
  // drawings are the PDF's, turned to pink line work on the page's dark by
  // scripts/build_slide_art.py; the copy is the PDF's, set as live text where
  // it sat. The one slide left out is 58, the second, empty page of the
  // storyboard.
  "jishnu/emasculatedman": {
    role: "Direction, animation & sound",
    tools: ["Experimental Animation", "Hair", "Lightboard", "Blender"],
    credits: "Made on the experimental animation course at Srishti, facilitated by Bhavana.",
    overview: "An animated film about a beard I could never grow, animated with my own hair on a lightboard. The course opened with a question — what is it like to be a woman? — put to a class of nine girls and one boy.",
    layout: "spread",
    story: [
      { spread: { w: 1000, h: 625, items: [
        { x: 73, y: 92, w: 390, title: "A Slightly Emasculated Man", fs: 34 },
        { x: 73, y: 232, w: 330, lead: "A film about the trim.", fs: 38 },
        { x: 73, y: 402, w: 180, link: { text: "watch the short film here", href: "#film" }, fs: 14 },
        { x: 73, y: 510, w: 200, p: "Motion Design / Animation", fs: 14 },
        { x: 360, y: 0, w: 640, h: 625, art: "assets/jishnu/emasculatedman/s51-art.png", alt: "A heart made of hair on a lightboard" }
      ] } },
      { youtube: "8thJDYB_lSU", id: "film", caption: "A Slightly Emasculated Man" },

      { spread: { w: 1000, h: 625, items: [
        { x: 73, y: 46, w: 600, h: "What is it like to be a woman?", fs: 14 },
        { x: 73, y: 88, w: 750, p: "This was the question posed to a class of 9 girls and 1 boy (yours truly) by Bhavana, our facilitator for the **experimental animation course at Srishti**. I have no idea. I’m a boy and I have identified as a boy through my whole life. When Bhavana asked me what I would do if I were a girl, my brain was firing blanks. I never wanted to be a girl.", fs: 13.5 },
        { x: 73, y: 164, w: 345, p: "When I was younger girls were gross, talking to them and being friends with a girl was **gross**. They couldn’t even run as fast as me, not even close.", fs: 13.5 },
        { x: 0, y: 0, w: 1000, h: 625, art: "assets/jishnu/emasculatedman/s52-art.png", alt: "A boy looking back at two girls running" },
        { x: 738, y: 540, w: 200, p: "Why would I want to be a girl?", fs: 13.5 }
      ] } },

      { spread: { w: 1000, h: 625, items: [
        { x: 73, y: 90, w: 830, p: "As I grew older I realised that being a girl was not necessarily gross. As my friends around me grew out their facial hair, the way they were around girls changed too. Girls were not gross anymore, they were **“fine”** and **“hot”** and were to be ogled at. My lack of a facial hair and my puny figure prompted me to create my own ideas of masculinity, one that avoided femininity and its effects on **dudes**.", fs: 13.5 },
        { x: 73, y: 168, w: 345, p: "This outward objectification of women is not something I ever engaged in, not because I was being considerate or empathetic but because I was seeking to preserve my **innocence** as a boy.", fs: 13.5 },
        { x: 0, y: 0, w: 1000, h: 625, art: "assets/jishnu/emasculatedman/s53-art.png", alt: "A boy with a backpack, a girl walking away, and two dudes calling out to her" },
        { x: 565, y: 484, w: 345, p: "For whom was I preserving myself? For my parents perhaps, for society; society seemed to like **boys who did not concern themselves with the feminine** and I liked being that boy.", fs: 13.5 }
      ] } },

      { spread: { w: 1000, h: 625, items: [
        { x: 0, y: 0, w: 1000, h: 625, art: "assets/jishnu/emasculatedman/s54-art.png", alt: "Two hearts: a couple, and the same girl with a bearded man, over a sulking boy" },
        { x: 98, y: 404, w: 314, align: "center", p: "It was not until I had gotten into college, got into a **relationship with a girl** that I first truly began to engage with femininity, girls and my own masculinity.", fs: 13.5 },
        { x: 592, y: 46, w: 296, align: "center", p: "However, after my ex left me for my ex best friend, I saw my **non threatening** form of masculinity turn into something not too different from the kind my **dude** friends employed.", fs: 13.5 }
      ] } },

      { spread: { w: 1000, h: 625, items: [
        { x: 15, y: 205, w: 570, p: "I decided to make my story about my lack of a beard and how that linked in with masculinity. I felt I should write about how I tried very hard to be more manly and the insecurities I felt because of not having one. My friends in school would call me lesbian because I had no facial hair and long flowy hair, a two pronged attack on my sexuality and gender identity. I wanted to write about how I was affected by this and how I also involved myself in reinforcing such stereotypes. I was not the nicest person in school either and engaged in such hurtful banter. My friends who teased me have since become more considerate and so have I.", fs: 13.5 },
        { x: 628, y: 4, w: 370, h: 621, art: "assets/jishnu/emasculatedman/s55-art.png", alt: "The poem, handwritten, beside a drawing of a bearded face" }
      ] } },

      { spread: { w: 1000, h: 540, items: [
        { x: 73, y: 118, w: 600, h: "The medium", fs: 14 },
        { x: 73, y: 158, w: 750, p: "I used my hair to make my animation film. It was serendipitous that I needed a haircut just as soon as I joined this course. The material was also intrinsically linked to the story I was trying to tell as well. I felt I could use the almost fluid flowing nature of hair to inform the way I would do my animating as well.", fs: 13.5 },
        { x: 73, y: 280, w: 600, h: "Storyboarding the whole thing", fs: 14 },
        { x: 73, y: 322, w: 755, p: [
          "I started with writing a poem about my beard. I had linked my beard to my masculinity growing up and it was not until I saw a friend pick out some food from his beard and put it in his mouth that I actually felt that I was fine without one. Having a poem written down helped in storyboarding and creating a boardmatic. I had a very clear idea of how I wanted my poem to be represented and that helped with creating the necessary imagery. Since I had an idea of how I was going to be reciting my poem, the timings for my animations also fell in place.",
          "My boardmatic was done in blender in 3D. Using a pre rendered 3D animation helped me with understanding where to place my hair during production."
        ], fs: 13.5 }
      ] } },

      { spread: { w: 1000, h: 625, items: [
        { x: 80, y: 0, w: 825, h: 625, art: "assets/jishnu/emasculatedman/s57-art.png", alt: "The storyboard: thumbnails, visuals, narration and sound, shot by shot" }
      ] } },

      { spread: { w: 1000, h: 625, items: [
        { x: 45, y: 93, w: 300, h: "Production", fs: 14 },
        { x: 45, y: 136, w: 415, p: [
          "I cut my hair 2 days before production. I had to use forceps to make the hair form little line segments which I joined to create larger forms. Hair was a fun medium to work with, albeit slightly strange. Perhaps using hair and touching it and actually getting personal with it got me in touch with a very important part of my body. Women seem to have to deal with their hair a lot, my mother and my girl friends (not girlfriends) just pick up, tangle it or knot it or something and just throw it. I’ve always been quite grossed out by clumps of hair. I still don’t like touching hair when I’m dusting my bed and the sight of a single strand used to ruin my whole day.",
          "Since I was using the lightboard, I could use my hair and pack them with different densities to let different amounts of light pass. I had also planned on seeing how wetting my hair with hot and cold water would affect its material properties. I could not fully explore these variations this time around due to time constraints but I had a lot of fun in doing this so I’ll try it some time again.",
          "I used some sand as well for some extra dark portions."
        ], fs: 12.5 },
        { x: 483, y: 115, w: 472, h: 266, media: "assets/jishnu/emasculatedman/s59-a.jpg", alt: "At the lightboard, camera overhead" },
        { x: 483, y: 403, w: 224, h: 126, media: "assets/jishnu/emasculatedman/s59-b.jpg", alt: "Hair laid out on the lightboard" },
        { x: 732, y: 403, w: 224, h: 126, media: "assets/jishnu/emasculatedman/s59-c.jpg", alt: "Hair laid out on the lightboard" }
      ] } },

      { spread: { w: 1000, h: 625, items: [
        { x: 73, y: 46, w: 600, h: "Post Production", fs: 14 },
        { x: 73, y: 90, w: 850, p: [
          "In post I realised some of my timings were off. I had to slow down my film and it worked really well. My monologue was working even better with pauses.",
          "I wished I had spent more time with the sound design. Trying to figure out what hair sounds like was interesting. I went with a sweeping sound for most of my hair sfx. I did want to add more dynamism to my hair sounds. I wanted to make the hair growing sequences sound different, with some implication of growth. I had an idea of the sounds I wanted but I couldn’t find them in time. I should add those sfx in after."
        ], fs: 13.5 },
        { x: 0, y: 246, w: 1000, h: 379, media: "assets/jishnu/emasculatedman/s60-a.jpg", alt: "Hair being arranged on the lightboard in the dark" }
      ] } }
    ],
    gallery: []
  },
  "gmmbbq/aliengarden": {
    year: "2026",
    tools: ["Live Visuals", "Club Show"],
    overview: "A GMMBBQ gig. Visuals built for the room and run live from the booth."
  },
  "gmmbbq/joyorbisonwhp": {
    year: "2025",
    tools: ["Live Visuals"],
    overview: "Visual set built for a Joy Orbison show at Warehouse Project."
  },
  "gmmbbq/bloom": {
    year: "2026",
    tools: ["Live Visuals", "Club Show"],
    overview: "A GMMBBQ gig. Visuals built for the room and run live from the booth."
  },
  // TODO: not in the notebook -- copy still to be written.
  "gmmbbq/burrow": {
    year: "2025",
    tools: ["Live Visuals", "Club Show"],
    overview: "A GMMBBQ gig. Visuals built for the room and run live from the booth."
  },
  "gmmbbq/rawshit": {
    year: "2025",
    tools: ["Live Visuals", "Club Show"],
    overview: "A raw, high-contrast visual language put together for the RawShit nights.",
    // still 7 is still 6 again
    gallery: [0, 1, 2, 3, 4, 5, 6, "vid:0", "vid:1"]
  },
  // RETIRED. MidRoom and Tycho's Tones are off the site: their keys are out
  // of assets/page-config.js and listed in RETIRED in
  // scripts/build_project_pages.py, so neither gets a page. The copy below
  // is kept rather than deleted, so putting either back is one line in each
  // of those two files and nothing to rewrite.
  "gmmbbq/midroom": {
    year: "2025",
    tools: ["Live Visuals"],
    overview: "Visuals for the mid room — a smaller, closer counterpart to the main-floor set."
  },
  "gmmbbq/tychostones": {
    year: "2025",
    tools: ["Live Visuals", "Club Show"],
    overview: "Live audio-reactive visuals built for the room and run from the booth."
  },
  // The three below are lifted from the GMMBBQ write-ups, which the notebook
  // lists under play as "gamma gigs". Neither source dates them, so no year.
  // String Theory and Mapping Materials are laid out as they were on the
  // GMMBBQ Readymag site (readymag.website/u2816148450/4716300, pages 3 and
  // 5): every x, y, w, h below is that page's own, on its 1024px width, with
  // the empty band under its menu bar taken off the top. The photographs are
  // Readymag's, cropped the way that page cropped them.
  "gmmbbq/stringtheory": {
    role: "Installation & space design",
    tools: ["TouchDesigner", "Generative Audio", "Movement", "Visual Art"],
    credits: "Made for a residency conducted by Sensistaan in Bangalore.",
    overview: "An installation that uses movement, sound and visual feedback to build an intuition for audio production and arrangement — walk in with no instrument and no idea how music is made, and start making some.",
    layout: "spread",
    story: [
      { spread: { w: 1024, h: 2790, items: [
        { x: 462, y: 0, w: 361, h: 203, art: "assets/gmmbbq/stringtheory/rm-title.png", alt: "String theory" },
        { x: 20, y: 70, w: 482, h: 340, media: "assets/gmmbbq/stringtheory/rm-hero.jpg", alt: "A visitor's hands drawing light across the projection" },
        { x: 522, y: 170, w: 482, fs: 12.5, p: [
          "String theory is an installation that we made for a residency conducted by **Sensistaan** in Bangalore, that uses movement, sound and visual feedbacks to help in forming an intuition for audio production and arrangement.",
          "The idea is that one can walk in without any prior knowledge in music or arrangement, without any instrument in their hands, and create sounds and music. One uses different senses to inform each of the other senses and the process of audio generation."
        ] },
        { x: 522, y: 372, w: 482, fs: 11, tags: ["Installation / Space Design", "Generative Audio / Movement / Visual Art"] },
        { x: 20, y: 610, w: 482, fs: 12.5, p: [
          "Every sound and visual that is created is user generated or triggered. A central pad sound is generated through several different parameters, such as the distance between the hands and the angle.",
          "Loops begin to play upon touching certain triggers.",
          "The emergence of sounds and patterns is this installation’s call to action."
        ] },
        { x: 672, y: 575, w: 180, h: 164, art: "assets/gmmbbq/stringtheory/diagram-feedback.svg", alt: "Movement, visual and audio, each feeding the next: a feedback loop" },
        { x: 20, y: 961, w: 231, h: 216, media: "assets/gmmbbq/stringtheory/rm-howto-1.jpg", alt: "Lift your hands to begin" },
        { x: 271, y: 961, w: 231, h: 216, media: "assets/gmmbbq/stringtheory/rm-howto-2.jpg", alt: "Move your hands to change different characteristics of the sound" },
        { x: 522, y: 961, w: 231, h: 216, media: "assets/gmmbbq/stringtheory/rm-howto-3.jpg", alt: "Touch the corners with the circles to trigger different instruments" },
        { x: 773, y: 961, w: 231, h: 216, media: "assets/gmmbbq/stringtheory/rm-howto-4.jpg", alt: "Once the angle turns 90° or -90°, MIDI notes will begin to play" },
        { x: 271, y: 1205, w: 482, fs: 11, align: "center", caption: "How to (optionally) interact with this installation, as seen on the CRT." },
        { x: 20, y: 1285, w: 482, h: 435, media: "assets/gmmbbq/stringtheory/rm-g1.jpg" },
        { x: 522, y: 1285, w: 482, h: 435, media: "assets/gmmbbq/stringtheory/rm-g2.jpg" },
        { x: 20, y: 1739, w: 482, h: 437, media: "assets/gmmbbq/stringtheory/rm-g3.jpg" },
        { x: 522, y: 1739, w: 482, h: 437, media: "assets/gmmbbq/stringtheory/rm-g4.jpg" },
        { x: 20, y: 2220, w: 984, h: 554, youtube: "PkP3l_Rnvjg", alt: "String Theory" }
      ] } }
    ],
    gallery: []
  },
  "gmmbbq/cr2s": {
    role: "Installation, space design & performance",
    tools: ["CRTs", "DJ Deck (MIDI)", "Audio Mixer", "TouchDesigner"],
    credits: "Played at Taj, F Super Club Bengaluru, Pebble, Indiranagar Social and Koramangala Social — with Hypnos, Area313, Vinyl Ambulance, Tarang Joseph and Soul Kollektiv.",
    overview: "Two CRTs, an audio processor and a DJ deck, carried from room to room. The visuals are mixed the way a set is mixed — faders, samplers and cue points wired to the parameters of the picture.",
    story: [
      { h: "The setup" },
      { p: "CR2s is an installation that we carry around to perform for our own music, and for other musicians that we vibe with. It’s a fairly simple set up: two TVs, an audio processor and a DJing deck. And cables.",
        figure: 0, side: "right" },
      { p: "The setup allows us to control the visuals through the same intuition that one uses to mix different songs on a DJ deck — using concepts of faders, samplers and the different offerings that the equipment gives, and relating those to different parameters of our visualisations.",
        figure: 7, side: "left" },

      { h: "Why" },
      { p: "Music does not exist in a vacuum. It is made by people and for people. It serves as a powerful medium for expression, storytelling and dance, capturing the rhythms of life and the nuances of human experience." },
      { p: "We love working with musicians. Through our installations and set design we hope to be able to convey the stories that they want to tell.",
        figure: 1, side: "right" },
      { quote: "Having visuals be audio reactive creates a driving force on a dance floor. A call to action.", cite: "From the write-up" },
      { p: "The combination of curated visuals interacting with sounds and camera feed, along with the music, allows for subjective experiences while tapping into the human tendency to move to the pulsing beats.",
        figure: 3, side: "left" },

      { h: "What goes in it" },
      { p: "Each performance calls for a different use of tech and storytelling to carry the vibes across. Sensors, lights, cameras, projectors, mirrors, lens and films — and a bunch of other stuff.",
        figure: 5, side: "right" }
    ],
    // The write-up already shows stills 0, 1, 3, 5 and 7.
    gallery: [2, 4, 6]
  },
  "gmmbbq/mappingmaterials": {
    role: "Projection mapping & photography",
    tools: ["Projection Mapping", "TouchDesigner", "Photography"],
    overview: "A running collection of projection work where the material is the input: film the surface, generate from what the camera sees, throw it back onto the same surface. Every material ends up with a visual identity of its own.",
    layout: "spread",
    story: [
      { spread: { w: 1024, h: 3615, items: [
        { x: -18, y: 198, w: 1059, h: 871, media: "assets/gmmbbq/mappingmaterials/rm-bloom-wide.jpg", cls: "lighten", alt: "Projection on the giant bamboo head at Blooming Green" },
        { x: 20, y: 60, w: 600, title: "Mapping Materials", fs: 40, z: 2 },
        { x: 20, y: 124, w: 482, fs: 12.5, z: 2, p: [
          "Mapping materials is a collection of projects that we have undertaken for personal and commercial purposes.",
          "The core idea lies in the use of the materials and their characteristic properties to inform projections upon themselves. Using a camera to capture these characteristics of material surfaces, we project visuals back on to the material itself, creating a **visual feedback loop**.",
          "These feedback loops are highly dependent on the visual properties of the material, and thus lead to unique visual identities for different materials."
        ] },
        { x: 522, y: 248, w: 482, fs: 11, z: 2, tags: ["Installation / Space Design", "Projection Mapping, Photography"] },
        { x: 22, y: 376, w: 480, fs: 12.5, z: 2, p: "Projection mapping at **Blooming Green ’23**, onto the tent and a giant bamboo head that was made for the event." },
        { x: 20, y: 428, w: 230, h: 412, media: "assets/gmmbbq/mappingmaterials/rm-bloom-1.jpg", z: 2, alt: "The tent at Blooming Green, mapped" },
        { x: 270, y: 428, w: 232, h: 412, media: "assets/gmmbbq/mappingmaterials/rm-bloom-2.jpg", z: 2, alt: "The tent at Blooming Green, mapped" },
        { x: 0, y: 901, w: 1024, h: 577, media: "assets/gmmbbq/mappingmaterials/rm-holofilm.jpg", cls: "lighten", alt: "Holofilm catching a projected texture" },
        { x: 20, y: 996, w: 480, fs: 12.5, z: 2, p: "Using **holofilm** to project and reflect cool textures." },
        { x: 20, y: 1513, w: 230, h: 411, media: "assets/gmmbbq/mappingmaterials/rm-holo-1.jpg" },
        { x: 270, y: 1513, w: 232, h: 412, media: "assets/gmmbbq/mappingmaterials/rm-holo-2.jpg" },
        { x: 522, y: 1513, w: 232, h: 412, media: "assets/gmmbbq/mappingmaterials/rm-holo-3.jpg" },
        { x: 774, y: 1513, w: 230, h: 411, media: "assets/gmmbbq/mappingmaterials/rm-holo-4.jpg" },
        { x: 20, y: 1953, w: 600, fs: 12.5, p: "Projection mapping onto a **mesh**, for a 2000s inspired retro futurism themed gig." },
        { x: 18, y: 1991, w: 358, h: 455, media: "assets/gmmbbq/mappingmaterials/rm-mesh-1.jpg" },
        { x: 398, y: 1991, w: 356, h: 455, media: "assets/gmmbbq/mappingmaterials/rm-mesh-2.jpg" },
        { x: 774, y: 1991, w: 230, h: 455, media: "assets/gmmbbq/mappingmaterials/rm-mesh-3.jpg" },
        { x: 20, y: 2462, w: 356, h: 545, media: "assets/gmmbbq/mappingmaterials/rm-concrete-1.jpg", alt: "A painting on concrete, mapped with its own texture" },
        { x: 396, y: 2462, w: 357, h: 545, media: "assets/gmmbbq/mappingmaterials/rm-concrete-2.jpg", alt: "A painting on concrete, mapped with its own texture" },
        { x: 774, y: 2975, w: 230, fs: 12.5, p: "Using a painting on **concrete** as the input that generates the visuals." },
        { x: 20, y: 3050, w: 984, h: 554, youtube: "UQklF8chIYk", alt: "Mapping materials" }
      ] } }
    ],
    gallery: []
  },
  "jishnu/handsonexplorations": {
    year: "2025",
    tools: ["Music Visualization", "GLSL"],
    overview: "Real-time raymarching landscapes that deform and color-shift based on frequency spectrum analysis.",
    // still 2 is still 1 again
    gallery: [0, 1, 3, 4, 5, 6, 7, "vid:0", "vid:1"]
  },

  // --- facilitation ---
  "jishnu/jklu": {
    year: "2025",
    role: "Course design & teaching",
    tools: ["Interactive Poster", "New Media", "TouchDesigner"],
    overview: "A course at JKLU. The first exercise is always the same: design an interactive poster, under two rules that are harder to satisfy than they look.",
    story: [
      { h: "The first exercise" },
      { p: "The nature of new media is such that, in order for us to see mediums in new ways, we must approach them in wholly new ways." },
      { p: "The first exercise I give to my students is to design an **interactive poster**. Poster being a rectangular, portrait format, one-to-many communication tool; interaction implying a dialogue between the poster and the viewer.",
        figure: 0, side: "right" },
      { p: "Only two rules. The poster must be a poster — it obeys the above. And if I can remove the interaction from the poster and it still communicates the story, then the poster fails." },

      { h: "Some of the work my students have done" },
      { figure: 1, side: "full", caption: "Student work from the interactive poster exercise." }
    ],
    // Stills 0 and 1 are already in the write-up.
    gallery: [2, "vid:0", "vid:1"]
  },
  // TODO: not in the notebook -- copy still to be written.
  "jishnu/somaiya": {
    year: "2025",
    tools: ["Workshop", "Teaching"],
    overview: "Facilitation work with Somaiya. Media and write-up to follow."
  },
  "jishnu/strate": {
    year: "2025",
    tools: ["Workshop", "Teaching"],
    overview: "Facilitation work with Strate. Media and write-up to follow."
  }
};
