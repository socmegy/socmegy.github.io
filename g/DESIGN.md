# DESIGN.md

# g. — Design System & UX Direction

This file defines the permanent visual, layout, interaction, responsive, and copy direction for the `g.` project.

It must be read together with `AGENTS.md` and all installed antislop skills before any UI work begins.

This file takes priority over generic design habits, framework defaults, AI-generated dashboard patterns, and convenience-driven redesigns.

## Current direction: user-app visual redesign

The existing UI was implemented before antislop was introduced. It is legacy implementation, not the target visual design. Inspect it to understand functionality and dependencies; do not use its layout or screenshots as the visual reference for the redesign.

The user app may be redesigned completely. Visual structure, spacing, hierarchy, navigation presentation, page composition, and component styling may all be replaced. Existing markup, containers, card layouts, and responsive arrangements do not constrain the new composition.

Preserve all existing functionality and data logic, including authentication, API and worker integration, data, routes and application state, posting behaviour, subscriptions, notifications, profile functionality, settings functionality, control logic, and bottom-sheet modal behaviour. Moving or restyling a control must preserve its action, permissions, state, and data connections.

Bottom-sheet modals are a core interaction pattern of `g.` and must remain bottom sheets on mobile. Their visual treatment may change; their behaviour must be preserved.

The redesign applies to the user app. It does not authorize a control-panel redesign or changes to backend behaviour. The established identity and usability requirements below still apply. Rules about small edits and existing conventions must not be used to preserve legacy visual layouts during the user-app redesign.

This direction update changes only `DESIGN.md`. Application implementation begins in a subsequent task that requests it.

---

## 1. Product principle

`g.` must feel like a deliberate real product.

It must NOT look like:

- a generic AI-generated SaaS dashboard
- a template marketplace layout
- a mobile app stretched into desktop
- a collection of rounded cards
- a generic admin panel
- a landing page inserted into an app
- a design created only to fill empty space

Every visible element must have a reason to exist.

Do not add decorative UI merely because the page feels empty.

Do not invent new features, statistics, labels, badges, marketing claims, icons, cards, sections, navigation items, or text unless explicitly requested.

Existing logic and functionality must be preserved unless the task explicitly requires a change.

---

## 2. Product visual identity

Keep `g.` recognizable through its restrained palette, Arimo typography, product language, and core interactions. These identity choices remain the direction while the legacy layout may be replaced.

Primary direction:

- black
- white
- grayscale
- Arimo typography
- minimal visual noise
- clean spacing
- strong alignment
- functional hierarchy

Avoid introducing unrelated color systems, gradients, glassmorphism, neon effects, glowing elements, or colorful dashboard styling unless explicitly requested.

Do not introduce a new font without permission.

---

## 3. Layout philosophy

The interface must be designed for the actual viewport.

### Desktop

Desktop must look intentionally designed for desktop.

Never:

- center a narrow mobile-sized app inside a large desktop viewport
- stretch a mobile column and call it desktop
- leave huge unused side areas without a layout reason
- force desktop users to interact with mobile navigation patterns
- stack unrelated regions vertically when horizontal grouping would improve use

Use desktop space properly through hierarchy, alignment, grouping, and appropriate multi-column structure where useful.

Do not make the interface unnecessarily wide either. Content width must remain readable and intentional.

A readable feed column within a deliberate desktop composition is appropriate. Continuous feeds and activity lists may remain vertical. Do not add side content merely to occupy available width.

### Tablet

Tablet is not "large mobile".

Tablet must receive its own sensible reflow.

Use the available width efficiently without making controls oversized or leaving large dead spaces.

Do not blindly reuse the mobile navigation or desktop grid if it produces awkward proportions.

### Mobile

Mobile must be compact, readable, and touch-friendly.

Prioritize:

- clear actions
- thumb-friendly controls
- sensible spacing
- readable text
- visible hierarchy
- minimal obstruction
- no accidental horizontal overflow

Navigation presentation may change, but primary destinations must remain easy to reach. Do not duplicate the same destinations in bottom navigation and a hamburger menu.

---

## 4. Responsive behaviour

Responsive design must work across the full width range, not only at several screenshot sizes.

Test at minimum:

- 320px
- 375px
- 430px
- 600px
- 768px
- 1024px
- 1200px
- 1440px
- 1920px

Requirements:

- no accidental horizontal page scrolling
- no clipped content
- no overlapping controls
- no broken modals
- no text escaping containers
- no oversized empty areas
- no tiny desktop content
- no stretched mobile UI
- no duplicate navigation
- no tables breaking the whole page width

Wide tables may scroll inside their own controlled container when necessary.

A single component may scroll horizontally only when the component genuinely requires it.

The page itself should not horizontally scroll under normal usage.

---

## 5. Height and viewport behaviour

If the available screen height can contain a page comfortably, do not force unnecessary vertical scrolling.

Do not create extra vertical overflow because of:

- oversized top/bottom padding
- unnecessary min-height values
- duplicated headers
- excessive section gaps
- oversized cards
- inflated form spacing

Pages may scroll naturally when content genuinely exceeds the viewport.

Do not hide content merely to eliminate scrolling.

---

## 6. Scrollbars

Where appropriate, visible browser scrollbars may be visually hidden to strengthen the app-like feel.

Scrolling functionality must remain intact.

Never disable scrolling globally just to hide a scrollbar.

Do not introduce custom decorative scrollbars unless explicitly requested.

---

## 7. Browser-like interaction artefacts

The interface should feel like an app, not an unstyled webpage.

Remove inappropriate browser-default visual artefacts where safe, including unwanted mobile tap highlight behaviour.

Interactive states must still remain accessible.

Do not remove keyboard focus visibility entirely.

Instead, provide a deliberate focus-visible style.

Use:

```css
-webkit-tap-highlight-color: transparent;
```

where appropriate.

Do not use `outline: none` globally without a replacement focus style.

---

## 8. Cards and containers

Cards are not the default solution.

Before adding a card, ask whether the same hierarchy can be achieved using:

- spacing
- typography
- borders
- dividers
- alignment
- grouping
- background contrast

Avoid:

- card inside card inside card
- a separate rounded box for every line of information
- large rounded containers around simple page sections
- floating dashboard tiles without purpose
- unnecessary shadows

Use a card only when the content genuinely represents a distinct object, group, action area, modal, or bounded piece of information.

Card styling must remain consistent across the project.

---

## 9. Border radius

Do not make everything rounded.

Avoid excessive pills.

Buttons, fields, cards, banners, tabs, modals, and navigation should not all use the same exaggerated radius.

Use a small, consistent radius scale.

Pill shapes are reserved for components that genuinely benefit from them, such as compact status chips or segmented controls.

---

## 10. Shadows and elevation

Use shadows sparingly.

Do not rely on large soft shadows to create hierarchy.

Prefer:

- spacing
- borders
- contrast
- typography

Avoid:

- floating glass cards
- giant soft shadows
- glowing shadows
- multiple competing elevation levels

---

## 11. Navigation

Navigation must match the device.

### Mobile

Choose navigation for the redesigned mobile composition while preserving routes, state, and access to existing destinations. When using bottom navigation:

- keep primary destinations easy to reach
- do not add a redundant hamburger menu
- keep labels/icons readable
- do not overcrowd it

### Desktop

Desktop navigation must use a desktop-appropriate pattern.

Do not simply copy the mobile bottom navigation to desktop.

Use persistent desktop navigation, sidebar navigation, top navigation, or another intentional structure suited to the redesigned user app. The legacy navigation presentation is replaceable.

Do not redesign navigation without understanding the existing routes and states.

---

## 12. Login and registration

Login and registration should be simple and product-like.

Do not turn authentication into a generic marketing landing page.

Requirements from the current direction:

- banner space may appear on login and registration
- username and password remain primary
- registration may include supporting legal agreement UI where required
- Terms of Use and Privacy Policy must be accessible
- footer must be present where intended
- unnecessary descriptive filler text must not be added

Do not restore removed copy such as generic explanations unless explicitly requested.

### Username help

Do not permanently display long username-format instructions under the field if the design calls for compact UI.

Use the intended info/help control beside the username label/title and show the details in a small modal, popover, or appropriate help surface.

Help UI must not obstruct the form.

---

## 13. Banner / soft promotion area

The project may include a banner used for soft promotional content or ads.

The banner must:

- feel native to the product
- fit the page composition
- not dominate the page
- not look like a random third-party block
- not destroy spacing or hierarchy
- work on login/register and other intended locations
- resize properly across mobile, tablet, and desktop

Do not invent banner content unless given.

Do not hard-code misleading fake ads.

---

## 14. Main app and product references

Learn from established social platforms at the level of content hierarchy and interaction clarity. The references below express product direction, not pixel-for-pixel specifications. Do not copy their branding, exact UI, or features that `g.` does not have. The result must still feel like `g.`.

| Area | Learn from | Design priority |
| --- | --- | --- |
| Untuk Anda / feed | X and Threads | A continuous social feed with strong post hierarchy, restrained separators, and easy interaction. Keep authorship, post content, and existing actions easy to scan without wrapping every post in a floating card. |
| Profile | X, Instagram, and Threads | Identity, bio, account information, counts/actions, and posts. Establish a clear profile hierarchy without excessive cards. |
| Langganan | X Premium | Strong plan hierarchy, concise benefits, and a clear subscription action. Use the actual plans, prices, benefits, and subscription state of `g.`; do not copy X branding or exact UI. |
| Tetapan | TikTok | Clear grouped settings categories and simple drill-down navigation. Keep existing settings reachable through their existing routes or state mechanisms; avoid a dashboard composition. |
| Notifications | X and Threads | A readable chronological activity list with clear actors, activity, time, and existing read/action states. Use real notification data and preserve notification behaviour. |

These references guide presentation only. Feed ranking, posting behaviour, subscription rules, notification delivery, and other data logic remain unchanged. A reference is not permission to invent features, counts, plans, or content.

Do not add unrelated dashboard metrics or productivity widgets.

Pages should focus on their actual function.

Do not create artificial "overview" cards just to make pages look fuller.

---

## 15. Control panel

The control panel is not a generic admin dashboard.

It includes management areas such as:

- payments
- users
- plans
- posts
- notifications
- site settings

Desktop control pages must use desktop space correctly.

Avoid:

- tiny centered content
- oversized cards
- generic KPI grids unless the data is actually required
- template dashboard widgets
- decorative charts without a requested purpose

Data-heavy views should prioritize:

- scanability
- usable table width
- filters when genuinely needed
- clear actions
- readable density

Mobile control views may simplify or stack appropriately, but should not break core administration tasks.

---

## 16. Modals and overlays

Bottom-sheet modals are a core interaction pattern of `g.`. Preserve mobile bottom sheets and all existing bottom-sheet behaviour, including their triggers, actions, dismissal rules, and retained application state. Do not replace them with centered mobile dialogs, inline sections, or full-page routes as part of a visual redesign.

Sheet spacing, hierarchy, and styling may change. Keep controls reachable with the on-screen keyboard open, account for safe areas, and preserve scrolling and focus handling. Desktop presentation may suit its viewport while retaining the same actions and state behaviour.

Use modals only for focused temporary tasks or information.

Do not move normal page content into modals without reason.

Modals must:

- fit smaller screens
- avoid viewport overflow
- allow internal scrolling when content is long
- have clear dismissal behaviour
- preserve context
- avoid giant empty padding
- use consistent dimensions

Do not make every interaction open a modal.

---

## 17. Forms

Forms should be compact, clear, and predictable.

Requirements:

- labels remain readable
- validation states are explicit
- errors appear near the relevant field
- disabled states are visually clear
- fields should not become enormous on desktop
- spacing should remain consistent
- avoid excessive helper copy
- do not hide critical requirements

Do not rely on placeholder text as the only label.

---

## 18. Buttons

Buttons must communicate hierarchy.

Use clear distinction between:

- primary action
- secondary action
- destructive action
- text/quiet action

Do not create multiple competing primary buttons in the same area.

Avoid oversized buttons unless the context requires them.

Avoid decorative gradient buttons.

Button copy should be short and action-oriented.

---

## 19. Icons

Use one consistent icon family.

Do not mix:

- emoji
- Unicode symbols
- unrelated icon packs
- random filled and outlined styles

Icons should improve recognition, not fill blank space.

Do not add sparkle icons, magic-wand icons, stars, robots, or generic AI imagery unless explicitly requested.

---

## 20. Typography

Arimo is the established font unless explicitly changed.

Typography should create hierarchy through:

- font size
- font weight
- line height
- spacing
- contrast

Do not put every heading inside a card just to create hierarchy.

Avoid unnecessarily oversized headings.

Application screens do not need giant landing-page hero typography.

Use sentence case unless product copy specifies otherwise.

---

## 21. Copywriting

Copy must sound natural and concise.

Avoid generic AI-generated wording.

Do not write phrases like:

- Unlock the power of...
- Seamless experience
- Elevate your experience
- Everything you need in one place
- Powerful tools at your fingertips
- Designed for everyone
- Experience the future of...
- Take your experience to the next level
- Effortlessly manage...
- Discover a smarter way to...

Do not add explanatory copy just because there is whitespace.

Prefer direct product language.

Preserve supplied wording exactly when the user gives exact copy.

Do not rewrite branding, names, legal labels, prices, or claims unless asked.

---

## 22. Empty states

Empty states should be useful, not theatrical.

Use:

- a short explanation
- one relevant next action if needed

Avoid:

- huge illustrations
- motivational filler
- fake statistics
- excessive marketing copy
- oversized icons

---

## 23. Loading states

Loading states should match the task.

Use restrained:

- skeletons
- spinners
- progress indicators

Do not create elaborate animations.

Avoid layout shifts where possible.

---

## 24. Notifications and feedback

Feedback should be clear and proportional.

Use appropriate:

- toast
- inline message
- badge
- notification item
- confirmation modal only when necessary

Do not show a modal for trivial success messages.

Do not overuse colored alert boxes.

---

## 25. Accessibility

The interface must remain usable with keyboard and assistive technologies.

Requirements:

- semantic elements where possible
- meaningful labels
- visible focus states
- sufficient contrast
- accessible form errors
- sensible tab order
- appropriate button/link semantics
- click targets large enough for touch

Do not sacrifice usability merely to create a visually minimal interface.

---

## 26. Animation

Animation is functional, not decorative.

Use motion for:

- state changes
- navigation
- opening/closing
- feedback
- continuity

Animations should be subtle and fast.

Avoid:

- floating elements
- constant pulsing
- glowing
- bouncing
- excessive spring effects
- animated gradients
- animation on everything

Respect `prefers-reduced-motion`.

---

## 27. Existing components

When editing an existing component:

1. Inspect it first.
2. Identify its current purpose.
3. Identify where it is reused.
4. Preserve functioning behaviour.
5. For a narrow fix, make the smallest coherent change needed. For the user-app redesign, replace visual structure as needed to meet this direction.
6. Reuse functioning logic and interaction contracts. Reuse visual patterns only when they support the new direction.
7. Include shared visual components when the redesign requires consistency, while preserving behaviour in every place they are used.
8. Keep unrelated application logic out of visual refactors.

Do not remove features because they are inconvenient to preserve.

---

## 28. Existing functionality

Visual work must not accidentally break:

- authentication
- routing
- application state
- API calls
- worker/API integration
- account state
- subscriptions
- notifications
- payments
- posts
- posting behaviour
- profile data
- settings
- control-panel functionality
- control logic
- bottom-sheet modal behaviour, including mobile bottom-sheet presentation

UI changes must remain compatible with the existing application behaviour.

Do not replace working logic with mock data.

Do not create fake data to make screenshots look populated unless explicitly requested.

---

## 29. Match the requested scope

The user-app visual redesign is an established product direction. When a task requests its implementation, a complete visual recomposition is allowed within the preservation requirements above. It is not limited to cosmetic adjustments to the legacy layout.

When the instruction is to fix one issue, fix that issue.

Do not:

- redesign the entire page
- replace the design system
- move unrelated controls
- rename existing sections
- change navigation
- rewrite content
- add decorative elements

unless the task explicitly requires it.

---

## 30. Source-first rule

Before changing any UI:

1. inspect the relevant HTML/CSS/JS
2. inspect reused components/styles
3. inspect existing breakpoints
4. inspect page relationships
5. inspect current behaviour
6. identify the smallest set of files that must change

Never assume the rendered UI from filenames alone.

If browser preview is unavailable, state that visual verification was not possible and avoid pretending the rendered result was confirmed.

---

## 31. Screenshot/reference rule

When the user supplies a screenshot or design reference:

- follow the stated purpose of the reference; the platform references in section 14 are inspiration for hierarchy and interaction, not exact layouts
- preserve elements explicitly marked as unchanged
- do not improvise over exact supplied copy
- do not replace the reference with a "similar" generic layout
- match hierarchy, spacing intent, proportions, and placement carefully
- distinguish between "inspired by" and "exactly preserve"

Screenshots of the existing UI document legacy behaviour and content unless the user explicitly identifies an element to preserve visually.

If the user says not to change something, do not change it.

---

## 32. Spacing

Use a systematic spacing scale.

Spacing must create rhythm and hierarchy.

Avoid:

- arbitrary gaps
- huge blank areas
- cramped clusters
- inconsistent form spacing
- excessive page padding on small screens
- excessive side margins that make desktop look like mobile

Sibling elements serving the same role must use consistent spacing.

---

## 33. Alignment

Strong alignment is preferred over decorative framing.

Text, controls, cards, tables, and navigation must follow clear visual axes.

Do not introduce small arbitrary offsets to make an element "look different."

Use shared container edges where appropriate.

---

## 34. Content density

The project should feel clean, not empty.

Minimalism does not mean:

- huge whitespace everywhere
- very few elements per screen
- oversized typography
- one card per row on desktop

Use an appropriate information density for the task.

The control panel may be denser than the public/user-facing app.

---

## 35. Breakpoints

The existing project currently has responsive rules around several widths.

Inspect their behaviour before changing them. The redesigned user app may replace legacy breakpoints when its content needs different layout transitions.

Before modifying breakpoints:

- identify what each existing breakpoint currently does
- check whether the problem is the breakpoint itself or the rules inside it
- prefer a small number of meaningful layout transitions
- avoid piling on many one-off media queries

Breakpoints should follow layout needs rather than device brand names.

---

## 36. CSS quality

Avoid accumulating emergency overrides.

Do not solve layout problems by repeatedly adding:

```css
!important
```

unless there is a clear unavoidable reason.

Prefer correcting:

- specificity
- structure
- inherited styles
- incorrect layout rules

Remove obsolete rules when safely replacing them.

Keep responsive rules understandable.

---

## 37. JavaScript interaction quality

Do not use JavaScript for layout problems that CSS should solve.

Use JavaScript only when behaviour genuinely requires it.

Event handling must not create duplicate listeners or conflicting state.

Do not break browser navigation or accessibility for the sake of an app-like feel.

---

## 38. Performance

Avoid adding heavy dependencies for simple UI tasks.

Prefer existing project dependencies and native browser capabilities.

Do not add an entire UI framework to implement a small component unless explicitly approved.

Avoid unnecessary animation libraries.

---

## 39. Legal/footer content

The project includes Terms of Use and Privacy Policy surfaces.

They must be reachable where intended.

Footer styling should be subtle and integrated.

Do not add conventional copyright wording if the project direction intentionally uses another label or open-source wording.

Preserve exact capitalization supplied by the user.

---

## 40. Things Codex must never do automatically

Never automatically:

- extend a requested redesign beyond its authorized surfaces
- switch the font
- add gradients
- add colorful UI
- add glassmorphism
- add giant rounded cards
- add hero sections inside app pages
- add random metrics
- add fake testimonials
- add fake users
- add fake engagement
- add feature marketing copy
- add a hamburger menu when bottom nav already covers the same routes
- convert desktop into a centered mobile layout
- remove working features
- replace real data with mock data
- change supplied wording
- add emoji as UI icons
- add AI sparkle decoration
- introduce horizontal page scrolling
- use excessive pills
- hide keyboard focus
- claim visual verification when no browser/render check was performed

---

## 41. Implementation workflow

For every UI task:

### Step 1: Read

Read:

- `AGENTS.md`
- this `DESIGN.md`
- all relevant antislop skills
- relevant project source files

### Step 2: Inspect

Understand:

- current structure
- legacy presentation and the new target direction, keeping the two distinct
- current behaviour
- affected routes
- responsive states
- reused components

### Step 3: Plan

State briefly:

- what is wrong
- what files are affected
- what will change
- what will remain unchanged

Do not create a broad redesign plan for a narrow fix.

### Step 4: Implement

Match the implementation to the requested scope. A narrow fix should remain small; the user-app redesign may replace entire visual compositions and shared styles when needed.

Preserve existing functionality.

### Step 5: Verify

Check:

- mobile
- tablet
- desktop
- wide desktop
- vertical overflow
- horizontal overflow
- navigation
- forms
- modal sizing
- focus states
- interaction states
- mobile bottom-sheet opening, actions, dismissal, scrolling, keyboard access, and retained state
- preserved authentication, API/worker integration, posting, subscriptions, notifications, profiles, settings, and control behaviour on affected paths

### Step 6: Report

Report only:

- what changed
- files changed
- anything that could not be visually verified
- any genuine follow-up issue

Do not pad the report with generic praise.

---

## 42. Final anti-slop review

Before considering any UI task complete, actively check for:

- unnecessary cards
- excessive border radius
- fake dashboard styling
- generic AI copy
- huge empty whitespace
- mobile UI on desktop
- desktop UI squeezed into mobile
- duplicate navigation
- accidental horizontal scrolling
- unnecessary vertical scrolling
- browser-default interaction artefacts
- inconsistent spacing
- inconsistent iconography
- invented content
- unnecessary gradients
- excessive shadows
- oversized headings
- inaccessible focus handling
- functionality regressions

If any appear, fix them before marking the task complete.

---

## 43. Priority order

When requirements conflict, use this order:

1. explicit instruction from the user for the current task
2. existing product functionality and data integrity
3. this `DESIGN.md`
4. `AGENTS.md` and installed antislop rules
5. existing project conventions
6. framework defaults
7. personal design preference of the coding agent

The coding agent must not substitute its own taste for the product direction.

---

## 44. Core reminder

The goal is not to make `g.` look "more designed."

The goal is to make it feel intentional, coherent, usable, responsive, and specific to `g.`.

Do less, but do it deliberately.
