import { defineConfig } from 'cypress';

export default defineConfig({
  video: true,
  videoCompression: 32,
  videosFolder: 'cypress/videos',
  screenshotsFolder: 'cypress/screenshots',
  viewportWidth: 1280,
  viewportHeight: 800,
  e2e: {
    baseUrl: 'http://127.0.0.1:5173',
    supportFile: false,
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}'
  }
});
