# Design Match Implementation Plan: hub.cyber.gov.rw

The goal is to match the project's design with `https://hub.cyber.gov.rw/` while maintaining current functionality.

## Core Design Elements
- **Color Palette**: 
  - Primary: `#084780` (Deep Blue)
  - Secondary/Success: `#007e7a` (Teal/Green)
  - Error: `#bd2c5f` (Deep Red)
  - Warning: `#d25721` (Orange)
  - Purple/Info: `#7076d0`
  - Accent: `#efcb97` (Gold/Sand)
- **Typography**: 
  - Font: `Montserrat`
  - Weights: 400, 500, 600, 700
- **UI Components**:
  - Border Radius: `6px` (Standardized)
  - Shadows: Subtle, small elevation (`0 2px 2px rgba(44, 49, 73, 0.2)`)
  - Buttons: Solid primary color, 6px radius, subtle hover elevation.
  - Sidebar: Deep blue background (`#084780fc`), white text/icons, glassy active state.
  - Header: Clean white background, subtle border, strong typography.

## Tasks

### 1. Global Styles (`src/index.css`) - [DONE]
- Update CSS variables with the new color palette.
- Set global font to Montserrat.
- Define standardized radius and transitions.
- Add "Horus" (the name from the reference CSS) style utility classes.

### 2. Sidebar Redesign (`src/components/Sidebar.css`)
- Change background to `--primary` (with slight transparency if needed).
- Update text/icon colors to white/inverted.
- Refine nav item padding and hover states.
- Match the "active" state with the glassy effect from the reference.

### 3. Header Redesign (`src/components/Header.css`)
- Align height and padding.
- Update button styles.
- Ensure typography matches the 1.1rem weight 600 style.

### 4. Component Refinement
- Update `MetricCard.css` to use the new card style.
- Update page-specific CSS files (Dashboard, Elections, etc.) to use the global design tokens consistently.

### 5. Google Fonts Integration
- Add Montserrat font to `index.html`.
