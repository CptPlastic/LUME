import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

// Get git commit hash for version
function getGitHash(): string {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return 'unknown'
  }
}

// Get build date
function getBuildDate(): string {
  return new Date().toISOString().split('T')[0] // YYYY-MM-DD format
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    '__GIT_HASH__': JSON.stringify(getGitHash()),
    '__BUILD_DATE__': JSON.stringify(getBuildDate()),
    '__BUILD_TIMESTAMP__': JSON.stringify(Date.now())
  }
})
