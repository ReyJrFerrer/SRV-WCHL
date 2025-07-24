# Changel### Added

- Convert Next.js client components to React Router DOM for improved navigation and routing
- Replace Next.js Head component with native document.title manipulation in search results page
- Replace Next.js Head component with native document.title manipulation in chat page
- Replace Next.js Head component with native document.title manipulation in service pages (view-all, service detail, service reviews)
- Replace Next.js router with React Router DOM in booking review page
- Replace Next.js router with React Router DOM in category pages and AuthContext integration
- Replace Next.js router with React Router DOM in all booking-related pages (index, details, confirmation, book)notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Add frontend chat integration with real-time messaging, conversation management, and notification system
- Add encrypted chat system enabling direct messaging between clients and service providers after booking completion
- Add automatic canister references initialization upon successful user login for improved system connectivity
- Add provider-specific trust level descriptions in service provider profile page
- Standardize chat routing structure between client and provider interfaces for consistent navigation
- Add client analytics system with real booking data integration for profile statistics display
- Add AI-powered sentiment analysis integration in reputation canister using LLM for enhanced review quality assessment
- Add real-time reputation score display with trust level badges and explanatory text in user profile pages
- Add AI-powered sentiment analysis for review processing using LLM integration
- Add real-time reputation score display in user profiles with separate data fetching
- Optimize setCanisterReferences functions to use singleton actors and direct canister ID imports
- Implement comprehensive router navigation with nested layouts and protected routes for client and provider sections

### Fixed

- Fix infinite loading bug in provider service details page caused by callback dependency issue
- Fix authentication bug preventing authenticated canister calls by implementing identity-aware auth service
- Convert Next.js client components to React Router DOM for improved navigation and routing
- Replace Next.js Head component with native document.title manipulation in search results page
- Replace Next.js Head component with native document.title manipulation in chat page
- Replace Next.js Head component with native document.title manipulation in service pages (view-all, service detail, service reviews)
- Replace Next.js router with React Router DOM in booking review page
- Replace Next.js components with React Router DOM in category pages
- Replace bundly/ares-react with custom AuthContext in service management for better authentication control
- Convert Next.js provider components to React Router DOM for services and bookings pages
- Replace bundly/ares-react with custom AuthContext in provider service forms (add/edit)
- Convert provider workflow pages (active-service, complete-service, receipt, review) from Next.js to React Router DOM
- Add set_count update method to allow setting the counter to a specific value
- Add frontend development server scripts (`npm run start`)
- Add LLM canister implementation
- Decouple service canister with dedicated type system and interface definitions
- Add profile switching functionality for seamless client/provider role transitions
- Add enhanced security measures with user suspension, verification management, and activity tracking
- Refactor canister services with consistent actor creation and authentication handling

### Changed

- Refactor profile creation page to use centralized AuthContext and authCanisterService
- Refactor logout hook to use centralized AuthContext and React Router navigation
- Replace @bundly/ares-react with local AuthContext in chat page for better authentication control
- Replace @bundly/ares-react with local AuthContext in category pages for better authentication control

- Refactor frontend from Next.js to React with react-router-dom for improved performance and simplified architecture
- Update dependencies to latest versions
- Switched the template to Motoko for writing the backend canister
- Rewrote the devcontainer setup
- Rewrote the tests
- Rewrote the npm scripts
- Rewrote the e2e workflow
- Fix mops installation in CI workflow by using npx

## [0.1.0] - 2025-04-24

### Added

- Basic canister structure with Rust
- Counter functionality with increment and get_count methods
- Greeting functionality
- PocketIC testing infrastructure
- Vitest test runner configuration
- GitHub CI workflow for automated end-to-end tests for all methods
- Project documentation
- Add custom instructions for github copilot
