---
name: ui
description: Use when the user asks for UI work, frontend layout refinement, component styling, or interaction polish. Apply it to design and implementation tasks where Codex should follow local UI guidance, references, and assets stored in this skill folder.
---

# UI

Use this skill for UI work that should follow the local guidance collected in this folder.

## Default Use

Reach for this skill when the task involves:

- page layout or screen structure
- component styling or visual cleanup
- interaction polish
- design consistency across views
- applying local UI references, assets, or patterns

## Frontend UI Style

Keep the UI clean, modern, and slightly polished, while still simple.

### Style Goals

- Avoid generic default-looking UI.
- Avoid a plain starter app appearance.
- Keep the design minimal and functional.
- Prefer a modern SaaS-like feel over a toy or demo feel.

### Visual Direction

- Use clean spacing and clear hierarchy.
- Prefer soft surfaces, subtle borders, and light shadows.
- Rounded corners are good.
- Keep the layout airy and uncluttered.
- Use a restrained color palette.
- One strong primary accent color is enough.
- Avoid loud gradients, overly flashy elements, and gimmicky effects.

### Components

- Buttons should feel polished, not default browser-like.
- Inputs should look modern and clean.
- Panels and cards should have subtle separation from the background.
- Status indicators should be small and neat.

### Overall Feel

- Minimal
- Modern
- Slightly premium
- Not overdesigned
- Not plain template-looking

### Avoid

- Generic default Tailwind-looking layouts
- Boxy and cramped UI
- Too much text
- Too many colors
- Heavy borders everywhere
- Dashboard clutter

## Workflow

1. Read this file first.
2. Check `references/` for project-specific UI rules or patterns when relevant.
3. Reuse files from `assets/` when the task needs bundled UI resources.
4. Add scripts to `scripts/` only when a UI workflow becomes repetitive enough to justify automation.
5. Keep implementations aligned with the active project's framework and styling conventions.

## Folder Notes

- Put durable UI guidance in `references/`.
- Put reusable visual assets or starter files in `assets/`.
- Put deterministic helper scripts in `scripts/`.
- Keep this skill lean and update it as the preferred UI workflow becomes clearer.
