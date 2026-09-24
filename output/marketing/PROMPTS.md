# Yocum Properties — filled marketing render prompts

Generated from the approved plans in `existing site plans/`. Every value is
either EXTRACTED from a drawing or marked **[ASSUMED]** under the pack rule
"if a finish is unspecified, use neutral DMV-market-typical finishes and flag it
for human review."

## Variable resolution

| Variable | Value | Source |
|---|---|---|
| `{{community}}` | Yocum Properties | Technical plan title block |
| `{{location}}` | Clinton, 5th Election District, Prince George's County, MD | Title block |
| `{{street_name}}` | Joseph Drive | Sheet 5 street label |
| `{{lot_count}}` | 19 | "Lots 1 thru 19" |
| `{{landscaping}}` | maple, oak, Norway spruce | Landscape plant schedule, sheets 17–19 |
| Street furniture | curb and gutter, 5-foot concrete sidewalk | Key notes, sheet 5 |
| Street lighting | PEPCO, 8 ft pole, CLA-1-T3-32L | Lighting sheet 16 |
| `{{driveway_material}}` | concrete apron to bituminous drive | Key notes 3–5 |
| Soils / grade | Croom-Marr, Beltsville-Urban, 2–15% slopes | Soils table |
| **`{{primary_material}}`** | **[ASSUMED]** fiber-cement lap siding | No spec sheet in set |
| **`{{accent_material}}`** | **[ASSUMED]** brick water table | No spec sheet in set |
| **`{{roof_type}}`** | **[ASSUMED]** gable, architectural asphalt shingle | No elevations in set |
| **`{{home_model}}`** | **[ASSUMED]** "The Joseph" | No model names in a civil set |
| **`{{room}}` / `{{flooring}}` / `{{finish_level}}`** | **[ASSUMED]** | No floor plans, no finish schedule |
| **`{{beds}}` / `{{baths}}` / `{{price}}`** | **NOT AVAILABLE** | Supply from the sales sheet |

**Nine of twenty-two pages were checked for elevations. There are none.** The
technical set is grading, storm, paving, lighting and landscape. `SECTION` and
`DETAIL` on sheets 17–18 are road sections and pole details, not building
elevations.

---

## 1. Community aerial — DRAWING-CONDITIONED

**Model:** `flux-canny-pro`, conditioned on
`output/marketing/yocum_layout_conditioning_p1.png`

> photorealistic golden-hour aerial drone view of a completed 19-home
> subdivision matching this lot layout and curved street, single-family homes
> with mature maple and oak street trees, green lawns, concrete driveways and
> 5-foot sidewalks with curb and gutter, Yocum Properties in Clinton, Prince
> George's County Maryland, natural shadows, ultra-detailed, professional
> real-estate marketing

## 2. Streetscape — DRAWING-CONDITIONED

**Model:** `flux-canny-pro`, same conditioning image

> photorealistic street-level view down the finished Joseph Drive, 19 completed
> homes lining a curved residential street with curb, gutter and 5-foot concrete
> sidewalks, maple and oak street trees, 8-foot PEPCO pole lighting, parked
> cars, golden-hour light, 35mm lens, ultra-detailed

## 3. Exterior hero, twilight — ASSUMED DESIGN

> photorealistic architectural photography of The Joseph single-family home,
> front three-quarter view at blue-hour dusk, fiber-cement lap siding and brick
> water table façade, gable roof with architectural asphalt shingles, warm
> interior lights glowing through windows, professionally landscaped yard with
> maple and Norway spruce, concrete driveway, subtle path uplighting, DMV
> suburban setting, 24mm lens, high dynamic range, ultra-detailed,
> real-estate marketing quality

## 4. Exterior hero, daytime — ASSUMED DESIGN

> photorealistic real-estate photography of The Joseph home, front elevation in
> bright mid-morning light, clear blue sky, fiber-cement lap siding and brick
> water table exterior, manicured lawn, mature maple street trees, a car in the
> concrete driveway, family-friendly suburban Prince George's County setting,
> 24mm lens, crisp shadows, ultra-detailed

## 5. Interior — ASSUMED DESIGN

> photorealistic interior real-estate photography of the great room in The
> Joseph, builder-grade-plus finishes, engineered oak floors, natural window
> light plus warm fixtures, staged furniture, wide 20mm lens, bright and airy,
> high detail

## Negative prompt — attach to every image generation

> warped or bent structural lines, extra floors, distorted proportions, fisheye,
> cartoon, illustration, lowres, blurry, watermark, garbled text, duplicated
> windows, unrealistic sky, people with distorted faces

## Motion prompts (still → video)

- **Aerial:** slow cinematic drone push-in over the neighborhood, golden hour, gentle parallax, steady, no warping
- **Exterior hero:** slow dolly toward the front door, warm dusk light, subtle reflections, cinematic, steady
- **Streetscape:** smooth forward glide down Joseph Drive, golden hour, gentle motion, steady gimbal
- **Interior:** smooth slow pan across the room revealing depth, soft natural light, steady gimbal

## Disclosure — required on assets 3, 4 and 5

> Artist's rendering for illustrative purposes only. Features, finishes,
> materials, and landscaping are representative and subject to change. Not a
> warranty or offer.
>
> **Building design, elevations, materials and interior finishes shown are
> ILLUSTRATIVE ONLY and were not derived from architectural drawings. The
> approved plan set for Yocum Properties is a civil set and contains no
> elevations or floor plans. Actual homes will differ.**

The second paragraph is not in the standard pack. Assets 1 and 2 do not need it
— they are conditioned on the real layout. Assets 3–5 do, because the building
itself is assumed.

---

# Run log — what worked and what did not

## Succeeded (flux-dev, text-to-image)

- `Yocum_TheJoseph_ExteriorTwilight.png`
- `Yocum_TheJoseph_ExteriorDaytime.png`
- `Yocum_TheJoseph_GreatRoom.png`

Usable marketing quality. **The building design in all three is ASSUMED** — the
plan set contains no elevations and no floor plans, so façade, roof, fenestration
and every interior surface were generated, not derived. They carry the extended
disclosure.

## FAILED — community aerial via flux-canny-pro

Two attempts, both unusable, and the reason is structural rather than a prompt
problem.

**Attempt 1** conditioned on the whole sheet. Canny extracted the title block
and the tables as strong edges, and the model reproduced them as garbled text
blocks over a vacant lot.

**Attempt 2** cropped to the drawing area only. Better — real asphalt, curb,
sidewalks, parked cars — but the model read the contour lines and lot lines as
vegetation and returned a giant tree canopy with no homes.

**Diagnosis:** a civil site plan is the wrong conditioning source for an aerial.
Its dominant line work is contours and property lines. Nothing in it says
"building here" in a way canny can carry, so the model fills the lots with
whatever the edges most resemble — texture, not structure.

**The fix, not attempted here:** generate the conditioning image from the site
engine rather than from the PDF. The engine already holds building footprints,
street centrelines and lot polygons, so it can emit a clean plan-view diagram —
filled black footprints, grey streets, white lots, no contours, no text — which
is exactly what canny needs. That is a rendering task in
`sheets/render-pdf.ts`, roughly the same work as the existing SVG path, and it
would make the aerial and the streetscape both conditionable.

Until then, aerial and streetscape should be commissioned from a 3D massing
model, not from the civil set.
