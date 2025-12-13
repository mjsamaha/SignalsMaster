// Zone.js configuration flags
// Fix for setFocus error in production: Disable onProperty patching to prevent Zone.js
// from interfering with Ionic's internal focus management on HTMLDivElement click handlers
// See: https://github.com/angular/angular/issues/31730
(window as any).__Zone_disable_on_property = true;

