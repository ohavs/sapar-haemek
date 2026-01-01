# Changelog

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
