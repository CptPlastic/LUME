// Test script to generate logs for testing the real-time log viewer
// Run this in the browser console while the app is open

let logCounter = 0;

function generateTestLogs() {
  const logTypes = ['log', 'info', 'warn', 'error', 'debug'];
  const messages = [
    'Timeline seeking to position',
    'Network connectivity check',
    'Audio file processed successfully',
    'Controller communication established',
    'Show sequence validated',
    'Firework channel armed',
    'Lighting effect activated',
    'System status update',
    'User interaction logged',
    'Performance metric captured'
  ];
  
  setInterval(() => {
    logCounter++;
    const logType = logTypes[Math.floor(Math.random() * logTypes.length)];
    const message = messages[Math.floor(Math.random() * messages.length)];
    
    console[logType](`[${logCounter}] ${message} - ${new Date().toLocaleTimeString()}`);
  }, 2000); // Generate a log every 2 seconds
}

console.log('🚀 Starting log generator...');
console.log('📝 Run generateTestLogs() to start generating logs every 2 seconds');
console.log('🔄 Open the log viewer to see real-time updates');

// Make the function available globally
window.generateTestLogs = generateTestLogs;
