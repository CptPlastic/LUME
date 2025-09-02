// Version utilities that read from package.json
// This ensures we always show the correct version without hardcoding

// Import package.json to get the version
import packageJson from '../../package.json';

export const getAppVersion = () => packageJson.version;

// Version constants for data format compatibility
export const DATA_FORMAT_VERSION = '1.1.0';
export const FIREWORK_FORMAT_VERSION = '1.0.0';