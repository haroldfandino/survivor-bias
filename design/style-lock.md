# SURVIVOR BIAS — style lock

Values live in `survivor-bias-tokens.json`. That file is the source of truth; this one
explains *why*, so nobody "fixes" a deliberate choice.

Channel convention: cf. `iio-games/Crownbane/UI-UX/V01/crownbane-tokens.json`.

---

## 1. The constraint that shaped everything

Local ComfyUI (`D:\Indie\Tools\ComfyUI`) has **no ControlNet, no LoRAs, no SDXL
checkpoint, no custom nodes** — `models/{loras,controlnet,checkpoints}` are all empty.
There is no way to pin one face across generations.

This game is about **one man in three timelines**. If his face drifts, players read it as
a bug, not a style.

So the art direction is built to make drift impossible to misread:

> **Everything the player sees is evidence.** A call frame, a security still, a scan.
> Nothing is presented as direct observation.

Once every image is mediated, inconsistency is *transmission noise*. That reframing is
load-bearing, not decoration.

## 2. How that cashes out

| Decision | Reason |
|---|---|
| **One duotone per branch** | A timeline is legible by colour before you read its name. Also the single biggest unifier — whatever flux returns ends up in two colours. Applied at 86% blend so a little real colour survives. |
| **Portraits are small circular crops** | The most forgiving format for a generated face. 320 px source, displayed at 32–40 px. |
| **Faces half-shadowed and off-angle** | Prompted deliberately. Less face means less to be inconsistent about, and it suits three men who are all avoiding something. |
| **Heavy grain + hard vignette** | Kills the clean-render tell, hides whatever flux did in the corners, and matches the CSS grain overlay so baked and live grain agree. |
| **Chromatic aberration on R/B** | Sub-pixel channel offset. Reads as a photograph of a screen. |
| **Real art weight on places and objects** | The ford, the verge, the porch, the document. No consistency problem at all — so this is where detail goes. |

## 3. The grades

Each branch owns a two-colour ramp (`timelines.<id>.duotone`).

| | Grade | Key | Belongs to |
|---|---|---|---|
| **prime** | ungraded | `#E4E6EA` | The player's own branch. The only thing that looks like plain reality. |
| **t3** | sodium-orange | `#E08B3C` | Night exteriors, wet asphalt, car interiors. |
| **t7** | hospital-green | `#5E9C8A` | Corridors, waiting rooms, paperwork. |
| **t12** | blue-hour | `#4A6FA5` | Pre-dawn cold. The one that got furthest away. |
| **Nell** | warm | `#F2D9B0` | **The only warm image in the game.** Shown exactly once, in ending A. |

Evidence inherits the grade of whoever sends it, so an attachment is attributable at a
glance even scrolled past.

## 4. Chrome

Cold and institutional — deliberately **not** an iMessage clone. `#0B0D10` ground,
`#12151A` raised, one accent (`#C8402F`) reserved for *contested* and for `TONIGHT`.

Two typefaces only: a system UI stack (so it reads as a real app) and a mono for system
lines and documents (so instrumentation reads as machine-produced). System lines are
centred, uppercase, letterspaced — the app talking, not a person.

Motion is restrained. The only fast thing should be a message arriving.

## 5. Documents are composited, not generated

`timeline_scan` is generated **blank** and the text drawn on in
`tools/gen_art.py → compose_timeline()`.

flux cannot write. Its first attempt produced convincing-looking gibberish, which is
worse than nothing for a page the player is invited to read. Compositing means the times
are real — and the 01:40 → 01:55 gap sits visibly empty on the page with *"15 min"* in the
margin. **The central mystery becomes something you can see.**

Any future in-world document follows the same rule: generate the surface, draw the
content.

## 6. Gates

`uv run --script tools/gen_art.py` runs two, and both are real checks with real numbers:

- **LPIPS drift** (`/v1/image/similarity`) across the three portraits. Perceptual
  distance must stay in **0.15–0.78**: below and they're one photo re-graded, above and
  they stop being the same man. Current: `t3/t7 0.52 · t3/t12 0.53 · t7/t12 0.40`
  — the two composed selves are closest, which is right.
- **NIMA aesthetic** (`/v1/image/quality`). Floor **5.0**; the set lands 5.2–6.2. Note
  the field is `file=`, not `image=`, and the payload is flat — neither is documented.

The story gate additionally fails the build if any `# img:` points at a missing file.
Broken art must fail loudly, not degrade into a placeholder that looks like a choice.

## 7. Payload

Everything is **WebP**: it carries the alpha the circular portraits need and compresses
grain far better than PNG. The first pass shipped PNG at ~1 MB per still, 5.3 MB total,
against a 104 KB app bundle — WebP brought it to **400 KB for all eight assets**.
