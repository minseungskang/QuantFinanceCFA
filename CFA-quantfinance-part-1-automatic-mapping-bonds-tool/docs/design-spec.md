# Design Specification

## Visual Direction

The UI should feel clean, calm, and finance-oriented. Use light blue as the primary color direction, supported by neutral grays and white space.

Avoid decorative layouts. This is a working table tool, not a marketing page.

## Layout Principles

- First screen should be the actual scoring table.
- Keep controls close to the table they affect.
- Use compact but readable spacing.
- Make the ranking and score columns easy to scan.
- Avoid nested cards and heavy visual decoration.
- Use stable table dimensions so interactions do not cause layout jumping.

## Primary Screens

V1 should prioritize:

- Main ranking table.
- Expanded country/bond detail row.
- Edit metrics panel or modal.
- Weight settings panel.
- Hidden countries management view.

## Table Behavior

The table should support:

- Search by country, bond name, currency, or credit rating.
- Region filtering.
- Score sorting.
- Country A-Z sorting.
- Expand/collapse country rows.
- Pin country.
- Hide country.
- Show score components and data confidence.

## Controls

- Use buttons for clear commands such as `Export CSV`, `Import CSV`, and `Reset Local Data`.
- Use search input for text search.
- Use dropdown or segmented control for region and sort mode.
- Use sliders or numeric inputs for weight settings.
- Use toggles or icon buttons for pinned/hidden state.

## Accessibility And Readability

- Ensure table text is readable at desktop sizes.
- Keep contrast sufficient for pale blue UI elements.
- Do not rely on color alone to explain risk or ranking.
- Use clear labels for financial indicators.
- Keep UI text English-first.
