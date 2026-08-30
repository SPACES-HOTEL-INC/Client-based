# Spaces Guest App

the first file is my logo for the spaces development web application, secondly is a video reference of the platform you're to build and lastly is an image of the home toggle pattern of the preferable currency.  NO BACKEND SYSTEM STRUCTURE IN THIS DEVELOPMENT, IT'S STRICTLY A FRONTEND DEVELOPMENT                                                                                            SPACES GUEST WEB APP — MASTER ARCHITECTURAL & UI SPECIFICATION

Build a modern, highly responsive client-facing web and mobile application for "SPACES" (a digital real estate and hospitality booking platform) using React, Vite, TypeScript, Tailwind CSS, and Capacitor.

Color & Brand Tokens:

Primary Background / Splash Color: Rich Deep Blue (#003399 or Tailwind bg-blue-900) matching the immersive splash screen reference.

Logo Mark (The Arch): Custom arch vector emblem (spaces_preview_dark.png) styled with a Solid Black container/icon mark followed immediately by crisp White typography spelling "Spaces".

Neutral / Accent UI: Clean card backdrops (bg-white or bg-slate-900 dark-mode support), slate typography, and teal interactive highlights.

2. Screen-by-Screen User Journey & Structure

A. The Splash & Boot Screen (/splash)

Visuals: Fullscreen deep blue background (bg-blue-900).

Centerpiece: Smooth, luxury animated splash screen featuring the custom Spaces brand mark — the black arch emblem paired with the white "Spaces" text and subtitle "Elite stays, shortlets & experiences" centered on a rich dark blue backdrop.

Animation & Visual Behavior:

1. Entrance (0s – 0.6s):

   - Logo mark and subtitle smoothly fade in from opacity 0 to 1 with a gentle spring scale transition (from scale 0.95 to 1.0).

B. Main App Layout & Bottom Navigation

Navigation Bar: Fixed at the bottom of the viewport with clean icons and typography:

Home (Dashboard & Quick Explore)

Search (Advanced filtering, destination & room search)

Bookings (Active, completed, and pending guest stays)

Support (In-app live chat and help center)

Profile (User preferences, dual-currency toggles, account settings)

C. Home Page (/home)

Upper-Left Greeting: Directly inspired by GTBank mobile apps. Prominently displays the personalized greeting on the top left:

"Hello, Abubakar!" (with fallback to guest profile name).

Quick Service Grid: Rounded icon cards for exploring stays, event spaces, shortlets, and local dining packages.

Featured Carousel: Highlighted premium properties with high-resolution imagery and instant pricing badges.

Framework: React with Vite and Tailwind CSS.

Data Flow: Set up mock state management or React Query for fetching property listings, room availability, and booking status.

Mobile Native Readiness: Ensure touch-friendly target sizes, pull-to-refresh interactions, and clean viewport handling for Capacitor iOS/Android builds.

Create the main Discovery & Search Page for the SPACES client app:

1. Search Bar Header: Include dynamic location inputs (City/State), Check-in/Check-out date pickers, and Guest count selectors.

2. Filter System:

   - Filter drawer/modal for mobile + sidebar for desktop.

   - Filter criteria: Price range slider, Property Type (Hotel, Shortlet, Villa, Resort), Star Rating, and Amenities (Wi-Fi, Pool, Gym, Breakfast, etc.).

3. Layout Views:

   - Grid View: Property cards displaying dynamic image carousels, property title, location badge, star rating, starting price per night, and a quick-save/favorite heart button.

   - Map View Toggle: Interactive map integration showing price markers for listed properties.

4. Empty & Skeleton States: Add sleek skeleton loaders during data fetch and friendly empty states when no properties match the active filters.

Build the Property Details Page and Room Selection interface for SPACES clients:

1. Hero Section: Full-width high-res image gallery with a grid view + "View All Photos" modal overlay.

2. Property Overview: Display property title, full address with map view trigger, star rating, verified host badge, detailed description, and categorized facilities (Bathroom, Media & Tech, Room Amenities, Food & Drink).

3. Available Rooms Section:

   - Card layout listing distinct room types (e.g., Executive Suite, Deluxe Room).

   - Show room specs: Max occupancy, bed type, sq footage, key amenities, and night rate.

   - Dynamic price calculation based on selected check-in/out dates.

4. Floating Sticky Booking Bar (Mobile Bottom / Desktop Right Sidebar): Shows total price summary and a prominent "Book Now" CTA button.

Booking Flow Depth: 2b (Full flow: Select dates/guests → summary → Paystack-style Wema bank transfer / Card payment modal → Confirmed booking reservation with dynamic booking reference code).

Authentication: 3a FULL AUTH (Modern Flow):

Provide a slick, modern Login / Signup modal & screen (Email/Password & Email + OTP verification flow).

Support "Continue as Guest" so user can immediately browse with default greeting "Hello, Abubakar!".

Sync auth state so signing in updates the upper-left GTBank-style greeting to the logged-in user's first name, and links all past/future bookings to their profile account.

Currency: 4a (Dual Currency Toggle: NGN ₦ ↔ USD $, default to NGN across all room pricing and totals).

Logo: 5a (Recreate custom Arch emblem as a clean vector SVG — solid black arch icon with white text Spaces on deep blue background #003399).

2. Core Layout, Branding & Architecture Rules:

Splash / Entrance Screen: Inspired by Chowdeck splash screens. Deep Blue background (#003399) with a smooth entrance animation displaying the Black Arch emblem SVG + White "Spaces" text, fading out after 2 seconds into the main app.

Header: Top-left GTBank style personalized greeting: "Hello, [User First Name]!" (e.g. "Hello, Abubakar!").

Bottom Navigation: Fixed bottom bar with 5 items: Home, Search, Bookings (replaces "Orders"), Support, and Profile.

Tech Stack: React + Vite + Tailwind CSS (mobile-first responsive design, touch-friendly, optimized for Capacitor PWA packaging).

This task is strictly for the Guest Web Application Frontend (Client-side PWA). Do not write external backend code, database schemas, or server routes.

Please focus 100% on the frontend UI/UX using React, Vite, and Tailwind CSS with local state / mock data for API calls. Here is the strict breakdown of what needs to be built:

Splash Screen: Deep Blue background (#003399) with the animated black arch logo SVG and white "Spaces" text, fading out after 2 seconds (Chowdeck style).

Header: Top-left GTBank style personalized welcome message: "Hello, Abubakar!" (or user's first name upon login).

Bottom Navigation: Fixed bottom bar with 5 tabs: Home, Search, Bookings, Support, and Profile.

Authentication (Client-side): A modern Auth modal/drawer (Email/Password, Email + OTP UI flow, "Continue as Guest") using local React state / localStorage.

Core Views:

Home: Quick service categories, featured luxury shortlets/suites, search bar.

Search: Interactive filterable listing view with price toggle (NGN ₦ ↔ USD $).

Bookings: Bookings (Active, completed, and pending guest stays)reservation passes.

Support: In-app live chat UI mockup and help desk FAQ.

Profile: Currency toggle, personal details, booking history, and auth actions.

Booking & Payment Flow: Date/guest picker modal leading to a simulated Paystack/Wema bank transfer payment screen with confirmation state.

Please build the frontend application components immediately without touching backend server files.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1d35d081-c41e-4876-bb74-c9858df3bc34).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
