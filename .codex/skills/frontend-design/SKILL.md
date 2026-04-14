---
name: frontend-design
description: Use when the user asks to design or refine frontend pages, components, or flows in this Next.js and Tailwind project. Apply it for production-ready UI work that should feel clean, minimal, polished, responsive, and visually intentional without drifting into generic AI-looking design.
---

# Frontend Design

Use this skill for frontend design work in this codebase.
The goal is not arbitrary stylistic exploration. The default visual direction is clean, minimalistic, and product-focused, adapted to the existing Next.js App Router and Tailwind architecture.

## Core Intent

Create production-grade interfaces that:

- feel calm, sharp, and modern
- avoid generic AI aesthetics
- respect existing product and codebase constraints
- ship as real working code, not mockup-style output

## Project Fit

This skill should follow the project's frontend rules:

- use Next.js App Router conventions correctly
- default to Server Components
- add `"use client"` only when browser behavior requires it
- keep client components thin
- keep business logic out of rendering components when possible
- style with Tailwind utilities in JSX
- do not add CSS modules, styled-components, or ad hoc styling systems

## Visual Direction

Use a clean and minimal aesthetic by default.

That means:

- strong hierarchy over decorative complexity
- disciplined spacing and alignment
- restrained but intentional color
- typography that feels refined and product-appropriate
- subtle depth, not noisy ornament
- compact interfaces that still breathe

Minimal does not mean bland. The interface should still feel designed.
Use contrast, rhythm, framing, and composition to create memorability without clutter.

## Design Thinking

Before coding, lock onto the product context:

- Purpose: what the screen helps the user accomplish
- Priority: what must be seen first
- Constraints: framework, responsiveness, accessibility, loading states
- Character: how to make the screen feel polished within a minimal system

For this project, do not pick a random aesthetic direction when none is requested.
Start from clean, minimal, and useful. Only push further stylistically when the user explicitly asks for it or the surrounding UI clearly supports it.

## Frontend Aesthetic Guidance

### Typography

- Prefer typography with character and restraint.
- Avoid obvious default stacks when a more intentional choice is already available in the app.
- Keep type scale crisp and readable on mobile first.
- Use size, weight, and spacing to establish hierarchy before adding color or decoration.

### Color And Surfaces

- Use a focused palette rather than many competing accents.
- Favor neutrals, strong text contrast, and one restrained accent direction when possible.
- Use shared tokens or existing CSS variables when the app already supports them.
- Avoid trendy gradients or overly loud color effects unless the page explicitly calls for them.

### Motion

- Keep motion purposeful and light.
- Favor subtle entrances, hover feedback, and state transitions that support comprehension.
- Avoid ornamental animation that makes a minimal interface feel busy.

### Composition

- Build clean layouts with clear grouping and consistent spacing rhythm.
- Prioritize glanceability on small screens.
- Use asymmetry or visual tension sparingly and only when it improves hierarchy.
- Let whitespace do real work.

### Visual Detail

- Add depth through borders, tone shifts, shadow restraint, layering, and texture only when helpful.
- Prefer one or two thoughtful details over many decorative effects.
- Avoid the usual AI-generated look:
  - purple-heavy gradients
  - overly soft glassmorphism
  - generic hero layouts
  - repetitive card grids with no hierarchy

## Workflow

1. Inspect the current screen, component structure, and styling patterns.
2. Identify the primary user task and the highest-priority information.
3. Define a minimal visual direction that fits the existing product.
4. Implement the smallest coherent set of layout, typography, spacing, and color changes that materially improve the UI.
5. Keep code aligned with Server Component and Client Component boundaries.
6. Verify desktop and mobile behavior in-browser.
7. Validate interaction states when relevant:
   - loading
   - empty
   - error
   - hover
   - focus
   - active

## Tailwind Implementation Rules

- Keep styling directly in JSX with readable utility ordering:
  - layout
  - spacing
  - typography
  - color
  - state
- Reuse existing visual patterns before inventing new ones.
- Extract reusable components when the same UI pattern repeats.
- Reserve `src/app/globals.css` for Tailwind imports, theme tokens, and true global primitives.
- Do not introduce one-off CSS when Tailwind utilities can solve the problem cleanly.

## Next.js Implementation Rules

- Use server rendering by default.
- Keep data fetching on the server whenever possible.
- Move filtering, parsing, sorting, and normalization into `src/lib/**` instead of client UI.
- Use URL search params for shareable filter state when appropriate.
- Do not place browser-only APIs in server code.

## Accessibility And UX Guardrails

- Use semantic HTML.
- Keep interactive controls clearly labeled.
- Preserve visible focus states.
- Ensure contrast remains sufficient in supported themes.
- Do not rely on color alone for state.
- Keep controls forgiving and usable on small screens.

## Verification

When the work changes UI or interaction behavior:

1. Run the relevant project checks.
2. Verify the main user path with MCP.
3. Confirm the updated UI at mobile and desktop widths.
4. Check affected empty, loading, or error states when feasible.
5. Note anything that could not be verified.

## Output Style

When presenting finished work:

- describe the chosen minimal visual direction briefly
- summarize the main UX improvements
- mention any tradeoffs or follow-up polish worth considering
