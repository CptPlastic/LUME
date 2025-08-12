<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# LUME Desktop Controller - Copilot Instructions

This is a Tauri desktop application for controlling LUME firework and lighting systems built with React, TypeScript, and Tailwind CSS.

## Project Context

- **Purpose**: Professional desktop control application for ESP32-based firework and lighting controllers
- **Safety Critical**: This application controls pyrotechnic devices - safety is the top priority
- **Multi-Controller**: Designed to manage multiple ESP32 controllers simultaneously
- **Real-time**: Provides live status monitoring and control

## Architecture

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Desktop Framework**: Tauri (Rust backend)
- **State Management**: Zustand store with persistence
- **API Communication**: Axios for REST API calls to ESP32 controllers
- **Styling**: Tailwind CSS with custom LUME color scheme

## Key Components

1. **Header**: Main navigation, connection status, emergency stop
2. **Dashboard**: Controller discovery and management interface
3. **ControllerCard**: Individual controller management and quick testing
4. **API Services**: ESP32 communication and controller discovery

## Development Guidelines

1. **Safety First**: Always implement emergency stop functionality
2. **Error Handling**: Graceful degradation and clear error messages
3. **TypeScript**: Strong typing for all components and services
4. **Responsive**: Support for different screen sizes
5. **Real-time**: Live updates for controller status and connections

## API Integration

The app communicates with ESP32 controllers using these endpoints:
- `GET /status` - System status and health
- `POST /channel?id=N` - Fire specific channel (SAFETY CRITICAL)
- `POST /emergency/stop` - Emergency stop all channels
- `POST /area?id=N` - Change active area
- `GET /version` - Firmware version info

## Color Scheme

- Primary: #FF6B35 (lume-primary) - Orange for firework controls
- Secondary: #004E89 (lume-secondary) - Blue for navigation
- Accent: #FFD23F (lume-accent) - Yellow for lights
- Danger: #E63946 (lume-danger) - Red for emergency/safety
- Success: #06D6A0 (lume-success) - Green for connected status

## Safety Considerations

- Emergency stop buttons must be prominently displayed
- Confirmation dialogs for destructive actions
- Clear visual feedback for connection status
- Graceful handling of network failures
- No firing actions when controllers are disconnected

## File Organization

- `/src/components/` - React components
- `/src/services/` - API and external service integrations
- `/src/store/` - Zustand state management
- `/src/types/` - TypeScript type definitions
- `/src-tauri/` - Tauri backend configuration
