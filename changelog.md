# Changelog

## [1.2.0] - 2026-01-11
### Added
- **Social Media Integration**: Added Instagram and TikTok links to Home Hero section.

### Changed
- **Admin Panel Layout Overhaul**:
    - **Full Width Layout**: Removed `max-w-3xl` restriction from all tabs (Schedule, Services, Appointments, Products, Gallery, Settings) for better screen real estate usage.
    - **Grid Layout**: "Working Hours" and "Breaks" are now displayed side-by-side on desktop (2-column grid).
    - **Barber List**: Added horizontal padding preventing action icon clipping.
    - **Gallery Grid**: Increased image density (columns) for a more compact view.
- **Marquee Component**:
    - **Infinite Loop**: Implemented a robust, gap-free infinite loop by removing `min-width` constraints and significantly increasing content duplication.
    - **Animation**: Tuned speed to 60s for better readability.
- **Branding**:
    - Updated Browser Tab Title to "ספר העמק".
    - Updated Favicon to `logo.png`.

### Fixed
- **Admin Structure**: Fixed a critical syntax error (extra `</div>`) that caused "Services" content to leak into the "Schedule" tab.
- **UI Glitches**: Fixed clipping of "Edit" and "Delete" icons on Admin barber cards.


## [1.2.1] - 2026-01-11
### Added
- **UI UX Enhancements**:
    - **Modal Close Button**: Added a highly visible "X" button to the main booking sheet (Home) and generic modals for easier dismissal.
    - **Admin - Collapsible Sections**: "Weekly Hours" and "Breaks & Exceptions" sections in Admin > Schedule are now collapsible and default to collapsed for a cleaner view.
    - **Smart Barber Link**: "Add Break" in Admin now defaults to the currently selected barber from the main filter.

### Changed
- **Marquee Improved**:
    - Replaced CSS animation with robust inline-style logic to force a seamless, gap-free infinite loop (0% -> -50%).
    - Increased scroll speed to 10s for a faster, more dynamic look.


## [1.1.0] - 2026-01-01
### Added
- **Gallery System Enhanced**:
    - **Tagging**: Admin can now add custom tags/descriptions to gallery images (default: "New Style").
    - **Delete Confirmation**: Added safety modal before deleting images.
    - **Edit Mode**: Inline editing for image tags in Admin.
- **Service Management**:
    - **Notes Display**: Added visibility for service notes (הערות) in the Admin services list.

### Changed
- **Admin UI Polish**:
    - **Spacing**: Increased top padding for better visual hierarchy.
    - **Header**: Removed glass effect from Admin header for a cleaner, spacious look.
- **Mobile UX**:
    - **Barber Cards**: Team images are now colorful by default on mobile for better engagement.

## [1.0.0] - 2025-12-31
### Added
- **Barber Management System**: 
    - Full CRUD (Create, Read, Update, Delete) for barbers in Admin Panel.
    - Image Upload functionality for barber profiles.
    - Automatic data seeding for initial setup.
- **Gallery Component**: New responsive gallery section on Home page with customer photos.
- **Deployment**: Configured Firebase Hosting and deployed live to `sapar-haemek.web.app`.
- **Git Integration**: Initialized repository and pushed to GitHub main branch.

### Changed
- **Database Migration**: Migrated hardcoded barber data to Firebase Firestore.
- **Admin UI**:
    - Improved TimePicker UX with correct RTL/LTR support.
    - Added "From/To" labels for blocked hours.
    - Displayed barber images in appointment lists.
- **Home Page**: Updated "Team" section to fetch dynamic barber data.

### Fixed
- Fixed build errors related to unused imports.
- Resolved type mismatches in Booking service (`string | number` IDs).

## [0.1.0] - Initial Setup
- Initialized React + TypeScript project with Vite.
- Ported basic configuration.
