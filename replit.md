# SignalsMaster - Replit Project Documentation

## Overview

**SignalsMaster** is a professional, mobile-first quiz application designed for military personnel, signalers, and cadets to learn, practice, and compete in naval signal flag recognition and knowledge. The app provides interactive training on the International Code of Signals through practice sessions and competitive leaderboards.

## Project Information

- **Type**: Angular 20 + Ionic 8 Mobile-First Web Application
- **Language**: TypeScript 5.9
- **Framework**: Angular 20.0 with Ionic Framework 8.0
- **Styling**: Tailwind CSS 3.4 + SCSS
- **Backend**: Firebase Firestore 11.10
- **Build System**: Angular CLI with npm
- **Mobile Framework**: Capacitor 7.4

## Current State

✅ **Fully Configured for Replit**
- Development server running on port 5000
- Host configured for 0.0.0.0 to work with Replit proxy
- AllowedHosts configured to accept Replit's iframe proxy
- Build optimized for production deployment
- Deployment configured as static site with www output directory

## Recent Changes

### November 23, 2025 - Replit Environment Setup
1. **Angular Configuration** - Updated `angular.json` to configure dev server:
   - Port: 5000 (required for Replit webview)
   - Host: 0.0.0.0 (required for network access)
   - AllowedHosts: ["all"] (required for Replit proxy)
   - StylePreprocessorOptions: Added src to includePaths

2. **SCSS Architecture Fix** - Resolved mixin import errors:
   - Created `src/app/theme/_mixins.scss` for shared SCSS mixins
   - Added `@import '../../theme/mixins'` to all page component SCSS files
   - Fixed "Undefined mixin" compilation errors

3. **Workflow Configuration** - Set up Angular dev server:
   - Command: `npx ng serve --disable-host-check`
   - Output: webview on port 5000
   - Status: Running successfully

4. **Deployment Configuration**:
   - Type: Static site deployment
   - Build command: `npm run build`
   - Public directory: `www`
   - Optimized for production with Angular build optimization

## Project Architecture

### Frontend Structure
```
src/app/
├── pages/                    # Feature pages
│   ├── home/                # Main landing & navigation
│   ├── practice-mode/       # Practice setup
│   ├── best-signaller/      # Competitive mode entry
│   ├── quiz/                # Main quiz interface
│   ├── practice-results/    # Practice session results
│   ├── competitive-results/ # Competitive results & leaderboard submission
│   ├── leaderboard/         # Live rankings
│   └── about/               # App information
├── core/services/
│   ├── quiz.service.ts      # Quiz logic & session management
│   ├── leaderboard.service.ts # Firebase integration
│   └── flag.service.ts      # Flag database management
├── shared/
│   ├── components/          # Reusable UI components
│   └── pipes/               # Custom pipes
└── theme/
    ├── _mixins.scss         # Shared SCSS mixins (NEW)
    ├── animations.scss      # Animation utilities
    └── responsive.scss      # Responsive utilities
```

### Key Features
- **Practice Mode**: Flexible learning with 10-100 questions per session
- **Competitive Mode**: Standardized 50-question assessment with leaderboard
- **Real-time Leaderboard**: Firebase Firestore integration
- **Rating System**: 0-100 rating based on accuracy and speed
- **Tier Classification**: Ranks from "Keep Practicing" to "Signals Master"
- **Mobile-First Design**: Optimized for 375px+ mobile devices
- **Offline-Ready**: Practice mode works without internet

### Technology Stack
- **Framework**: Angular 20.0
- **Mobile**: Ionic Framework 8.0 + Capacitor 7.4
- **Styling**: Tailwind CSS 3.4 + SCSS
- **Language**: TypeScript 5.9
- **Backend**: Firebase Firestore 11.10
- **Testing**: Karma 6.4 + Jasmine 5.1

## Development

### Running the App
The development server is configured to run automatically via the Replit workflow:
- **URL**: Click the webview preview in Replit
- **Local**: http://localhost:5000/ (within Replit container)
- **Hot Reload**: Enabled - changes will auto-reload

### Common Commands
```bash
# Install dependencies (already done)
npm install

# Start dev server (automatically running via workflow)
npm start

# Build for production
npm run build

# Run tests
npm test

# Run linter
npm run lint
```

### File Structure Notes
- Component styles are isolated - must import mixins file to use shared SCSS mixins
- Global styles in `src/global.scss` - automatically included
- Theme variables in `src/theme/variables.scss`
- Firebase config in `src/environments/environment.ts` (dev) and `environment.prod.ts` (prod)

## Firebase Integration

The app uses Firebase Firestore for:
- **Leaderboard Storage**: Real-time competitive scores
- **User Rankings**: Automatic rank calculation
- **Performance Metrics**: Accuracy, time, and rating tracking

Firebase credentials are already configured in the environment files. The app connects to the `signalsmaster-40d2f` Firebase project.

## Deployment

The app is configured for static site deployment on Replit:
1. Build command: `npm run build` - Creates optimized production build
2. Output directory: `www` - Static files ready to serve
3. Deployment type: Static - No server-side rendering needed

To publish:
1. Click the "Publish" button in Replit
2. The build will automatically run
3. Static files from `www/` will be deployed

## User Preferences

No specific user preferences configured yet. Default setup follows Angular and Ionic best practices.

## Known Issues / Notes

1. **SCSS Import Warnings**: Using deprecated `@import` instead of `@use` - This is a Sass deprecation warning but doesn't affect functionality. Can be migrated to `@use` in future updates.

2. **Firebase Injection Context Warnings**: Firebase APIs are called outside Angular injection context in some services - This is a known issue with the current implementation. The app functions correctly but may have subtle change-detection issues in edge cases.

3. **Host Check Disabled**: Using `--disable-host-check` for development - This is required for Replit's proxy environment and is safe for development.

## Resources

- [Angular 20 Documentation](https://angular.io/docs)
- [Ionic Framework Documentation](https://ionicframework.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Original Repository](https://github.com/mjsamaha/SignalsMaster)

---

*Last Updated: November 23, 2025*
