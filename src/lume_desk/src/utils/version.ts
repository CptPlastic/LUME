// Version utilities that read from package.json and build-time git info
// This ensures we always show the correct version without manual updates

// Import package.json to get the base version
import packageJson from '../../package.json';

// Get the base version (MAJOR.MINOR.PATCH)
export const getBaseVersion = () => packageJson.version;

// Get the app version with git hash (MAJOR.MINOR.HASH)
export const getAppVersion = () => {
  const baseVersion = packageJson.version;
  const [major, minor] = baseVersion.split('.');
  
  // Use git hash from build-time injection if available, fallback to 'dev' for development
  const gitHash = typeof __GIT_HASH__ !== 'undefined' ? __GIT_HASH__ : 'dev';
  
  return `${major}.${minor}.${gitHash}`;
};

// Get detailed version info for About/debugging
export const getVersionInfo = () => {
  const buildDate = typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : 'unknown';
  const buildTimestamp = typeof __BUILD_TIMESTAMP__ !== 'undefined' ? __BUILD_TIMESTAMP__ : 0;
  const gitHash = typeof __GIT_HASH__ !== 'undefined' ? __GIT_HASH__ : 'dev';
  
  return {
    app: getAppVersion(),
    base: getBaseVersion(), 
    gitHash,
    buildDate,
    buildTimestamp,
    isDev: gitHash === 'dev'
  };
};

// Version constants for data format compatibility
export const DATA_FORMAT_VERSION = '1.1.0';
export const FIREWORK_FORMAT_VERSION = '1.0.0';