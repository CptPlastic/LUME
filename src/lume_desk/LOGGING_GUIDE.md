# LUME Logging System

The LUME frontend now includes a comprehensive logging system that captures all console output from your application.

## Features

### 🎯 Automatic Log Capture
- **Intercepts all console methods**: `console.log()`, `console.error()`, `console.warn()`, `console.info()`, `console.debug()`
- **Source tracking**: Automatically identifies which file and line number generated each log
- **Preserves original console**: All logs still appear in the browser dev tools as normal
- **Memory management**: Keeps only the latest 10,000 log entries to prevent memory issues

### 📊 Log Viewer Interface
- **Access via header**: Click the "Logs" button in the top navigation bar
- **Real-time updates**: New logs appear instantly in the viewer
- **Multiple filters**:
  - Filter by log level (error, warn, info, log, debug)
  - Search by text content
  - View stack traces for errors
- **Statistics**: Shows counts by level and time range

### 💾 Export Capabilities
- **Multiple formats**: Export as JSON, CSV, or TXT
- **Tauri integration**: In desktop app, uses native save dialog
- **Browser fallback**: Downloads files directly in web version
- **Smart naming**: Auto-generates timestamped filenames

## How to Use

### 1. Viewing Logs
1. Click the **"Logs"** button in the header (next to version info)
2. The log viewer modal will open showing all captured logs
3. Use the filter controls to find specific logs:
   - Check/uncheck log levels to filter
   - Type in the search box to filter by content
   - Toggle "Stack traces" to see error details

### 2. Exporting Logs
1. Open the log viewer
2. Click one of the export buttons:
   - **Export JSON**: Full structured data with all metadata
   - **Export CSV**: Spreadsheet-friendly format
   - **Export TXT**: Simple text format for reading

### 3. Managing Logs
- **Clear Logs**: Click "Clear Logs" to remove all captured logs
- **Auto-scroll**: Toggle to automatically scroll to newest logs
- **Real-time**: Logs update automatically as your app runs

## What Gets Captured

The logging system captures ALL console output from your LUME application, including:

- ✅ **Timeline operations**: Audio playback, seeking, cursor updates
- ✅ **Controller communications**: API calls, status updates, errors
- ✅ **Show management**: Import/export, sequence operations
- ✅ **Audio handling**: File uploads, URL linking, restoration
- ✅ **Firework operations**: Firing sequences, area management
- ✅ **Lighting effects**: Relay control, effect management
- ✅ **System operations**: Arming/disarming, emergency stops

### Example Log Categories You'll See:

```
🖱️ Timeline clicked, seeking to: 01:23.456
🎆 ARMED: Firing area 1 channel 5
💡 Starting regular lighting effect "strobe" on all relays
📤 Exporting audio for show: My Show.mp3
✅ Successfully restored audio file: background-music.mp3
❌ Failed to upload audio: Network error
```

## Log Entry Structure

Each log entry contains:
- **Timestamp**: Precise time with milliseconds
- **Level**: error, warn, info, log, or debug
- **Message**: The formatted log message
- **Source**: File name and line number (when available)
- **Stack trace**: For errors, full stack trace
- **Arguments**: Original arguments passed to console method

## Technical Details

### File Locations
- **Service**: `src/services/logging-service.ts`
- **Component**: `src/components/LogViewer.tsx`
- **Integration**: Imported in `src/main.tsx`

### Memory Management
- Maximum 10,000 log entries in memory
- Older logs automatically removed when limit reached
- Logs cleared on page refresh (not persistent)

### Performance
- Minimal overhead on console operations
- Non-blocking export operations
- Efficient filtering using React useMemo

## Troubleshooting

### Logs Not Appearing
1. Ensure you've imported the logging service in `main.tsx`
2. Check browser console for any initialization errors
3. Verify the log viewer modal is opening correctly

### Export Issues
1. **Desktop (Tauri)**: Ensure file system permissions are granted
2. **Browser**: Check if downloads are blocked by browser settings
3. **Large exports**: May take a moment for big log files

### Performance Issues
1. Clear logs periodically if you notice slowdowns
2. Reduce the `maxLogEntries` in logging service if needed
3. Use filters to reduce displayed logs instead of viewing all

## Customization

### Adjusting Log Retention
Edit `maxLogEntries` in `logging-service.ts`:
```typescript
private maxLogEntries = 10000; // Adjust this number
```

### Adding Custom Log Levels
You can extend the logging service to support custom log levels for different subsystems.

### Filtering by Source
The system automatically detects source files. You can add custom source labeling by modifying the `getSource()` method.

---

This logging system will help you debug issues, monitor system performance, and understand the flow of operations in your LUME application!
