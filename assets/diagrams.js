// Line drawings written into the page as markup, keyed by the path a story
// refers to them by (`art: "assets/.../name.svg"`). render-project.js looks
// here before it tries to fetch the file.
//
// Why not just fetch the .svg: a page opened from disk cannot fetch anything,
// and the fallback -- an <img> -- cannot take the page's colour, so a drawing
// meant to be pink line work on the dark came out black on the dark. Written
// in here, every stroke is currentColor and follows the section's ink.
const SITE_DIAGRAMS = {
  // String Theory's feedback loop -- movement drives the visuals, the visuals
  // drive the sound, the sound drives the movement -- redrawn from the
  // Readymag page's filled triangle as the same line art the rest of the play
  // section uses.
  "assets/gmmbbq/stringtheory/diagram-feedback.svg": `
<svg viewBox="0 0 330 300" fill="none" stroke="currentColor" stroke-width="2"
     stroke-linecap="round" stroke-linejoin="round" font-family="inherit">
  <g stroke-width="1.6">
    <path d="M181 78 L262 208"/><path d="M254 204 L262 208 L262 199"/>
    <path d="M258 238 L74 238"/><path d="M81 233 L74 238 L81 243"/>
    <path d="M67 209 L149 78"/><path d="M140 82 L149 78 L149 87"/>
  </g>
  <!-- movement: someone mid-dance, and the note they are dancing to -->
  <circle cx="163" cy="34" r="5.5"/>
  <path d="M163 40 L165 57 M163 45 L150 38 M163 45 L176 50 L181 43 M165 57 L156 70 M165 57 L174 64 L179 72"/>
  <path d="M188 44 L188 30 L195 28"/><ellipse cx="185.5" cy="44.5" rx="3" ry="2.2"/>
  <!-- visual: a camera -->
  <rect x="30" y="226" width="36" height="25" rx="5"/>
  <path d="M40 226 L43 220 L53 220 L56 226"/>
  <circle cx="48" cy="238.5" r="7"/>
  <!-- audio: a speaker -->
  <path d="M268 233 L274 233 L283 225 L283 252 L274 244 L268 244 Z"/>
  <path d="M289 232 A9 9 0 0 1 289 245 M294 227 A16 16 0 0 1 294 250"/>
  <g fill="currentColor" stroke="none" font-size="14" text-anchor="middle" letter-spacing="0.3">
    <text x="165" y="14">Movement</text>
    <text x="48" y="276">Visual</text>
    <text x="283" y="276">Audio</text>
    <text x="165" y="170" font-size="13" opacity="0.85">feedback</text>
    <text x="165" y="187" font-size="13" opacity="0.85">loop</text>
  </g>
</svg>`
};
