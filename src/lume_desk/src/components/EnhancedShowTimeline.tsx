import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Upload, Link, Volume2, VolumeX, SkipBack, SkipForward, X, Square, ZoomIn, ZoomOut, Grid, Edit, Save, Copy, PlayCircle } from 'lucide-react';
import type { Show, AudioTrack, ShowSequence } from '../types';
import { useLumeStore } from '../store/lume-store';

// Sequence Edit Modal Component
interface SequenceEditModalProps {
  sequence: ShowSequence;
  onSave: (updates: Partial<ShowSequence>) => void;
  onCancel: () => void;
}

const SequenceEditModal: React.FC<SequenceEditModalProps> = ({ sequence, onSave, onCancel }) => {
  const { controllers } = useLumeStore();
  const [timestamp, setTimestamp] = useState(sequence.timestamp);
  const [area, setArea] = useState(sequence.area || 1);
  const [channel, setChannel] = useState(sequence.channel || 1);
  const [duration, setDuration] = useState(sequence.duration || 0);
  const [relays, setRelays] = useState<number[]>(sequence.relays || []);
  const [controllerId, setControllerId] = useState(sequence.controllerId);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const centiseconds = Math.floor((ms % 1000) / 10);
    
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
    }
    return `${remainingSeconds}.${centiseconds.toString().padStart(2, '0')}`;
  };

  const handleSave = () => {
    const updates: Partial<ShowSequence> = {
      timestamp,
      area,
      channel,
      controllerId,
    };

    if (sequence.type === 'lighting') {
      updates.duration = duration;
      if (relays.length > 0) {
        updates.relays = relays;
      }
    }

    onSave(updates);
  };

  const toggleRelay = (relayNum: number) => {
    setRelays(prev => 
      prev.includes(relayNum) 
        ? prev.filter(r => r !== relayNum)
        : [...prev, relayNum].sort((a, b) => a - b)
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Edit Sequence</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sequence Info */}
        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-2xl">
              {sequence.type === 'firework' ? '🎆' : '💡'}
            </span>
            <div>
              <h4 className="font-medium text-white">
                {sequence.type === 'firework' ? sequence.fireworkType?.name : sequence.lightingEffectType?.name}
              </h4>
              <p className="text-sm text-gray-400 capitalize">{sequence.type}</p>
            </div>
          </div>
        </div>

        {/* Edit Fields */}
        <div className="space-y-4">
          {/* Timestamp */}
          <div>
            <label htmlFor="sequence-timestamp" className="block text-sm font-medium text-gray-300 mb-2">
              Time (seconds)
            </label>
            <div className="flex items-center space-x-3">
              <input
                id="sequence-timestamp"
                type="number"
                min="0"
                step="0.01"
                value={timestamp / 1000}
                onChange={(e) => setTimestamp(parseFloat(e.target.value) * 1000 || 0)}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent"
              />
              <span className="text-sm text-gray-400 font-mono">
                {formatTime(timestamp)}
              </span>
            </div>
          </div>

          {/* Controller Selection */}
          <div>
            <label htmlFor="sequence-controller" className="block text-sm font-medium text-gray-300 mb-2">
              Controller
            </label>
            <select
              id="sequence-controller"
              value={controllerId}
              onChange={(e) => setControllerId(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent"
            >
              {/* Offline/placeholder controllers first */}
              {(controllerId.startsWith('offline-') || !controllers.some(c => c.id === controllerId)) && (
                <option value={controllerId}>
                  {(() => {
                    if (controllerId.includes('firework')) return '🎆 Offline Firework Controller';
                    if (controllerId.includes('lighting')) return '💡 Offline Lighting Controller';
                    return `📡 ${controllerId}`;
                  })()}
                </option>
              )}
              
              {/* Real controllers */}
              {controllers
                .filter(c => {
                  // Show controllers of the same type or any connected controller
                  if (sequence.type === 'firework') {
                    return c.type === 'firework';
                  } else if (sequence.type === 'lighting') {
                    return c.type === 'lights';
                  }
                  return true;
                })
                .map(controller => (
                  <option key={controller.id} value={controller.id}>
                    {controller.status === 'connected' ? '🟢' : '🔴'} {controller.name} ({controller.type})
                  </option>
                ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              {controllerId.startsWith('offline-') 
                ? 'Using offline controller - will need to be reassigned when controllers are connected' 
                : 'Controller assignment for this sequence'
              }
            </p>
          </div>

          {/* Area & Channel */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="sequence-area" className="block text-sm font-medium text-gray-300 mb-2">
                Area (1-99)
              </label>
              <input
                id="sequence-area"
                type="number"
                min="1"
                max="99"
                value={area}
                onChange={(e) => setArea(parseInt(e.target.value) || 1)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent"
              />
            </div>
            
            <div>
              <label htmlFor="sequence-channel" className="block text-sm font-medium text-gray-300 mb-2">
                Channel (1-12)
              </label>
              <input
                id="sequence-channel"
                type="number"
                min="1"
                max="12"
                value={channel}
                onChange={(e) => setChannel(parseInt(e.target.value) || 1)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Lighting-specific fields */}
          {sequence.type === 'lighting' && (
            <>
              {/* Duration */}
              <div>
                <label htmlFor="sequence-duration" className="block text-sm font-medium text-gray-300 mb-2">
                  Duration (seconds)
                </label>
                <input
                  id="sequence-duration"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={duration / 1000}
                  onChange={(e) => setDuration(parseFloat(e.target.value) * 1000 || 1000)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent"
                />
              </div>

              {/* Relay Selection */}
              <fieldset>
                <legend className="block text-sm font-medium text-gray-300 mb-3">
                  Relay Channels (1-12)
                </legend>
                <div className="grid grid-cols-6 gap-2">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(relayNum => (
                    <button
                      key={relayNum}
                      type="button"
                      onClick={() => toggleRelay(relayNum)}
                      className={`p-2 text-sm font-medium rounded-lg border transition-colors ${
                        relays.includes(relayNum)
                          ? 'bg-lume-primary border-lume-primary text-white'
                          : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                      }`}
                      aria-pressed={relays.includes(relayNum)}
                    >
                      {relayNum}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {relays.length === 0 ? 'No channels selected (will use all relays)' : `Selected: ${relays.join(', ')}`}
                </p>
              </fieldset>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-lume-primary hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface EnhancedShowTimelineProps {
  show: Show;
  isPlaying: boolean;
  currentTime: number;
  onSequenceMove: (sequenceId: string, newTimestamp: number) => void;
  onSequenceDelete: (sequenceId: string) => void;
  onSequenceUpdate: (sequenceId: string, updates: Partial<ShowSequence>) => void;
  onAudioUpload: (audioTrack: AudioTrack) => Promise<void>;
  onAudioRemove: () => void;
  onAudioMove: (newStartOffset: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (timestamp: number) => void;
}

export const EnhancedShowTimeline: React.FC<EnhancedShowTimelineProps> = ({
  show,
  isPlaying,
  currentTime,
  onSequenceMove,
  onSequenceDelete,
  onSequenceUpdate,
  onAudioUpload,
  onAudioRemove,
  onAudioMove,
  onPlay,
  onPause,
  onSeek
}) => {
  // Access store for manual audio restoration and sequence operations
  const { restoreShowAudio, addShowSequence } = useLumeStore();
  // State
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [isDraggingAudio, setIsDraggingAudio] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [testAudio, setTestAudio] = useState<HTMLAudioElement | null>(null);
  const [isTestPlaying, setIsTestPlaying] = useState(false);
  const [zoom, setZoom] = useState(1); // Zoom level (1 = normal, 2 = 2x, 0.5 = 0.5x)
  const [showGrid, setShowGrid] = useState(true);
  const [timelineWidth, setTimelineWidth] = useState(800);
  const [audioWaveform, setAudioWaveform] = useState<number[]>([]);
  const [editingSequence, setEditingSequence] = useState<ShowSequence | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(currentTime); // Track cursor position for "play from cursor"

  // Refs
  const timelineRef = useRef<HTMLDivElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // Timeline configuration - standardize all track heights for proper alignment
  const TRACK_HEIGHT = 70; // Height of each track (standardized)
  const RULER_HEIGHT = 50; // Height of time ruler
  const WAVEFORM_HEIGHT = 70; // Height of audio waveform (matches track height)
  const MIN_SEQUENCE_WIDTH = 20; // Minimum width for sequences
  
  // Calculate timeline dimensions with minimum width for scrolling
  useEffect(() => {
    const updateWidth = () => {
      if (timelineRef.current?.parentElement) {
        const containerWidth = timelineRef.current.parentElement.clientWidth;
        // Calculate timeline width based on content and zoom level
        // Use the max duration to determine how much width we need
        const baseWidth = Math.max(1200, containerWidth - 80);
        // For zoom, we need more pixels per unit of time
        const zoomedWidth = baseWidth * zoom;
        setTimelineWidth(zoomedWidth);
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [zoom]); // Add zoom dependency

  // Calculate max duration with zoom
  const maxSequenceDuration = Math.max(
    ...show.sequences.map(s => {
      let endTime = s.timestamp;
      if (s.type === 'firework' && s.fireworkType) {
        endTime += s.fireworkType.duration;
      } else if (s.type === 'lighting') {
        const duration = s.duration || (s.lightingEffectType?.duration || 5000);
        endTime += duration;
      }
      return endTime;
    }),
    60000 // Minimum 1 minute
  );
  
  const maxDuration = show.audio?.duration || maxSequenceDuration;
  // When zoomed in, we show the same duration but with more pixels per unit time
  const zoomedDuration = maxDuration;

  // Convert timestamp to pixel position
  const timestampToPixel = useCallback((timestamp: number) => {
    return (timestamp / zoomedDuration) * timelineWidth;
  }, [zoomedDuration, timelineWidth]);

  // Convert pixel position to timestamp
  const pixelToTimestamp = useCallback((pixel: number) => {
    return (pixel / timelineWidth) * zoomedDuration;
  }, [zoomedDuration, timelineWidth]);

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.5, 10));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.5, 0.1));
  const handleZoomReset = () => setZoom(1);

  // Handle sequence dragging
  const handleMouseDown = (e: React.MouseEvent, sequenceId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(sequenceId);
    
    const rect = timelineRef.current?.getBoundingClientRect();
    if (rect) {
      const sequence = show.sequences.find(s => s.id === sequenceId);
      if (sequence) {
        const sequencePixel = timestampToPixel(sequence.timestamp);
        const offset = e.clientX - rect.left - sequencePixel;
        setDragOffset(offset);
      }
    }
  };

  // Handle audio dragging
  const handleAudioMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingAudio(true);
    
    const rect = timelineRef.current?.getBoundingClientRect();
    if (rect && show.audio) {
      const audioStartPixel = timestampToPixel(show.audio.startOffset || 0);
      setDragOffset(e.clientX - rect.left - audioStartPixel);
    }
  };

  // Handle resize start for lighting effects
  const handleResizeStart = (e: React.MouseEvent, sequenceId: string) => {
    e.stopPropagation();
    setIsResizing(sequenceId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();

    // Handle dragging sequences
    if (isDragging) {
      const newPixel = Math.max(0, Math.min(timelineWidth, e.clientX - rect.left - dragOffset));
      const newTimestamp = Math.max(0, pixelToTimestamp(newPixel));
      onSequenceMove(isDragging, newTimestamp);
    }

    // Handle dragging audio
    if (isDraggingAudio) {
      const newPixel = Math.max(0, Math.min(timelineWidth, e.clientX - rect.left - dragOffset));
      const newStartOffset = Math.max(0, pixelToTimestamp(newPixel));
      onAudioMove(newStartOffset);
    }

    // Handle resizing
    if (isResizing) {
      const sequence = show.sequences.find(s => s.id === isResizing);
      if (sequence && sequence.type === 'lighting') {
        const sequenceStartPixel = timestampToPixel(sequence.timestamp);
        const mousePixel = e.clientX - rect.left;
        const newWidthPixel = Math.max(MIN_SEQUENCE_WIDTH, mousePixel - sequenceStartPixel);
        const newDuration = Math.max(500, pixelToTimestamp(newWidthPixel));
        
        onSequenceUpdate(isResizing, { duration: newDuration });
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
    setIsDraggingAudio(false);
    setIsResizing(null);
    setDragOffset(0);
  };

  // Handle timeline seeking
  const handleTimelineClick = (e: React.MouseEvent) => {
    if (isDragging || isDraggingAudio || isResizing) return;
    
    const rect = timelineRef.current?.getBoundingClientRect();
    if (rect) {
      const clickPixel = e.clientX - rect.left;
      const clickTimestamp = pixelToTimestamp(clickPixel);
      const finalTimestamp = Math.min(Math.max(0, clickTimestamp), maxDuration);
      console.log('🖱️ Timeline clicked, seeking to:', formatTime(finalTimestamp));
      onSeek(finalTimestamp);
      setCursorPosition(finalTimestamp); // Update cursor position
    }
  };

  // Handle mouse move to show cursor position
  const handleTimelineMouseMove = (e: React.MouseEvent) => {
    if (isDragging || isResizing) return;
    
    const rect = timelineRef.current?.getBoundingClientRect();
    if (rect) {
      const mousePixel = e.clientX - rect.left;
      const mouseTimestamp = pixelToTimestamp(mousePixel);
      const clampedTimestamp = Math.min(Math.max(0, mouseTimestamp), maxDuration);
      setCursorPosition(clampedTimestamp);
      console.log('🖱️ Cursor position updated to:', formatTime(clampedTimestamp));
    }
  };

  // Play from cursor position
  const handlePlayFromCursor = () => {
    console.log('🎯 Play from cursor requested at:', formatTime(cursorPosition));
    console.log('🎯 Current time before seek:', formatTime(currentTime));
    
    // First seek to cursor position
    onSeek(cursorPosition);
    
    // Wait a bit longer and then start playback
    setTimeout(() => {
      console.log('🎯 Starting playback from cursor position');
      onPlay();
    }, 200); // Increased delay for more reliable seeking
  };

  // Audio handling (same as original)
  const handleTestAudio = () => {
    if (isTestPlaying && testAudio) {
      testAudio.pause();
      testAudio.currentTime = 0;
      setIsTestPlaying(false);
      setTestAudio(null);
    } else {
      const audioElement = new Audio();
      if (show.audio?.url) {
        audioElement.src = show.audio.url;
      } else if (show.audio?.file) {
        audioElement.src = URL.createObjectURL(show.audio.file);
      }
      
      audioElement.volume = 0.5;
      
      audioElement.addEventListener('ended', () => {
        setIsTestPlaying(false);
        setTestAudio(null);
      });
      
      audioElement.addEventListener('error', (e) => {
        console.error('Test audio failed:', e);
        setIsTestPlaying(false);
        setTestAudio(null);
      });
      
      audioElement.play().then(() => {
        setIsTestPlaying(true);
        setTestAudio(audioElement);
      }).catch(e => {
        console.error('Test audio failed:', e);
        setIsTestPlaying(false);
        setTestAudio(null);
      });
    }
  };

  const handleAudioUpload = (file: File) => {
    const audioTrack: AudioTrack = {
      id: `audio_${Date.now()}`,
      name: file.name,
      file,
      duration: 0,
      format: file.name.split('.').pop()?.toLowerCase() || 'unknown',
      size: file.size,
      uploadedAt: new Date()
    };

    const audio = new Audio();
    audio.onloadedmetadata = async () => {
      audioTrack.duration = audio.duration * 1000;
      try {
        await onAudioUpload(audioTrack);
        console.log('✅ Audio uploaded successfully');
      } catch (error) {
        console.error('❌ Failed to upload audio:', error);
        alert('Failed to save audio file.');
      }
    };
    audio.src = URL.createObjectURL(file);
  };

  const handleAudioLink = () => {
    if (!audioUrl.trim()) return;

    const audioTrack: AudioTrack = {
      id: `audio_${Date.now()}`,
      name: audioUrl.split('/').pop() || 'Linked Audio',
      url: audioUrl,
      duration: 0,
      format: audioUrl.split('.').pop()?.toLowerCase() || 'unknown',
      uploadedAt: new Date()
    };

    const audio = new Audio();
    audio.onloadedmetadata = async () => {
      audioTrack.duration = audio.duration * 1000;
      try {
        await onAudioUpload(audioTrack);
        setShowAudioModal(false);
        setAudioUrl('');
        console.log('✅ Audio URL linked successfully');
      } catch (error) {
        console.error('❌ Failed to link audio URL:', error);
        alert('Failed to save audio link.');
      }
    };
    audio.onerror = () => {
      alert('Failed to load audio from URL. Please check the URL and try again.');
    };
    audio.src = audioUrl;
  };

  // Format time for display
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Generate time markers based on zoom with better precision
  const getTimeMarkers = () => {
    const markers = [];
    // More granular intervals based on zoom level for better precision
    let interval;
    if (zoom >= 4) {
      interval = 500; // 0.5 second intervals at high zoom
    } else if (zoom >= 2) {
      interval = 1000; // 1 second intervals
    } else if (zoom >= 1) {
      interval = 2500; // 2.5 second intervals
    } else if (zoom >= 0.5) {
      interval = 5000; // 5 second intervals
    } else {
      interval = 10000; // 10 second intervals at low zoom
    }
    
    const markerCount = Math.floor(zoomedDuration / interval);
    
    for (let i = 0; i <= markerCount; i++) {
      const timestamp = i * interval;
      if (timestamp <= zoomedDuration) {
        markers.push(timestamp);
      }
    }
    return markers;
  };

  // Generate audio waveform data with precise timing alignment
  const generateWaveform = useCallback(async (audioFile: File | string) => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AudioContextClass();
      let audioBuffer: AudioBuffer;

      if (typeof audioFile === 'string') {
        // URL
        const response = await fetch(audioFile);
        const arrayBuffer = await response.arrayBuffer();
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      } else {
        // File
        const arrayBuffer = await audioFile.arrayBuffer();
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      }

      const channelData = audioBuffer.getChannelData(0); // Use first channel
      
      // Calculate samples based on timeline width and zoom for precise alignment
      // Use a fixed resolution that scales with zoom to maintain consistent pixel alignment
      const pixelsPerSecond = timelineWidth / (maxDuration / 1000);
      const samplesPerSecond = pixelsPerSecond * zoom;
      const totalSamples = Math.floor((audioBuffer.duration * samplesPerSecond));
      const blockSize = Math.floor(channelData.length / totalSamples);
      
      const waveformData: number[] = [];

      for (let i = 0; i < totalSamples; i++) {
        const start = i * blockSize;
        const end = Math.min(start + blockSize, channelData.length);
        let sum = 0;

        for (let j = start; j < end; j++) {
          sum += Math.abs(channelData[j]);
        }

        waveformData.push(sum / (end - start));
      }

      // Normalize waveform data
      const max = Math.max(...waveformData);
      const normalized = waveformData.map(val => max > 0 ? val / max : 0);
      
      setAudioWaveform(normalized);
      console.log(`✅ Generated ${normalized.length} waveform samples for ${audioBuffer.duration}s audio`);
    } catch (error) {
      console.error('Failed to generate waveform:', error);
      setAudioWaveform([]);
    }
  }, [timelineWidth, zoom, maxDuration]);

  // Generate waveform when audio changes
  useEffect(() => {
    if (show.audio?.file) {
      generateWaveform(show.audio.file);
    } else if (show.audio?.url) {
      generateWaveform(show.audio.url);
    } else {
      setAudioWaveform([]);
    }
  }, [show.audio, generateWaveform, zoom]);

  // Update cursor position when current time changes (if not currently dragging)
  useEffect(() => {
    if (!isDragging && !isResizing) {
      setCursorPosition(currentTime);
    }
  }, [currentTime, isDragging, isResizing]);

  // Sequence editing functions
  const handleEditSequence = (sequence: ShowSequence) => {
    setEditingSequence(sequence);
    setShowEditModal(true);
  };

  const handleSaveSequenceEdit = (updates: Partial<ShowSequence>) => {
    if (editingSequence) {
      onSequenceUpdate(editingSequence.id, updates);
      setEditingSequence(null);
      setShowEditModal(false);
    }
  };

  const handleCancelSequenceEdit = () => {
    setEditingSequence(null);
    setShowEditModal(false);
  };

  // Sequence duplication function
  const handleDuplicateSequence = (sequence: ShowSequence) => {
    // Calculate a good offset for the duplicate (5 seconds after original)
    const duplicateOffset = 5000; // 5 seconds in milliseconds
    const newTimestamp = sequence.timestamp + duplicateOffset;
    
    // Create a new sequence based on the original
    const duplicateSequence: Omit<ShowSequence, 'id'> = {
      type: sequence.type,
      timestamp: newTimestamp,
      controllerId: sequence.controllerId,
      area: sequence.area,
      channel: sequence.channel,
      delay: sequence.delay || 0,
      repeat: sequence.repeat || 1,
      // Copy type-specific properties
      ...(sequence.type === 'firework' && {
        fireworkTypeId: sequence.fireworkTypeId,
        fireworkType: sequence.fireworkType
      }),
      ...(sequence.type === 'lighting' && {
        lightingEffectTypeId: sequence.lightingEffectTypeId,
        lightingEffectType: sequence.lightingEffectType,
        duration: sequence.duration,
        relays: sequence.relays ? [...sequence.relays] : undefined
      })
    };

    addShowSequence(duplicateSequence);
    console.log('✨ Duplicated sequence:', sequence.type, 'at', formatTime(newTimestamp));
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (testAudio) {
        testAudio.pause();
        testAudio.currentTime = 0;
        setTestAudio(null);
        setIsTestPlaying(false);
      }
    };
  }, [testAudio]);

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Enhanced Timeline Editor</h2>
          <div className="flex items-center space-x-4 mt-1">
            <span className="text-sm text-gray-400">
              {show.sequences.length} sequence{show.sequences.length !== 1 ? 's' : ''}
            </span>
            <span className="text-xs text-gray-500">
              🎆 {show.sequences.filter(s => s.type === 'firework').length} firework{show.sequences.filter(s => s.type === 'firework').length !== 1 ? 's' : ''} • 
              💡 {show.sequences.filter(s => s.type === 'lighting').length} lighting
            </span>
          </div>
        </div>
        
        {/* Zoom and Display Controls */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-gray-700 rounded-lg p-2">
            <button
              onClick={handleZoomOut}
              className="p-1 text-gray-400 hover:text-white transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-gray-300 font-mono min-w-[3rem] text-center">
              {zoom.toFixed(1)}x
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1 text-gray-400 hover:text-white transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomReset}
              className="px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors"
              title="Reset Zoom"
            >
              1:1
            </button>
          </div>
          
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded-lg transition-colors ${showGrid ? 'bg-lume-primary text-white' : 'bg-gray-700 text-gray-400 hover:text-white'}`}
            title="Toggle Grid"
          >
            <Grid className="w-4 h-4" />
          </button>

          {/* Audio Controls */}
          {show.audio ? (
            <div className="flex items-center space-x-2 text-sm text-gray-300 bg-gray-700 px-3 py-2 rounded-lg">
              <Volume2 className="w-4 h-4" />
              <span>{show.audio.name}</span>
              {(!show.audio.file && !show.audio.url) && (
                <button
                  onClick={async () => {
                    console.log('🔄 Manual audio restoration requested');
                    try {
                      await restoreShowAudio();
                      console.log('✅ Manual restoration completed');
                    } catch (error) {
                      console.error('❌ Manual restoration failed:', error);
                    }
                  }}
                  className="text-yellow-400 hover:text-yellow-300 ml-2"
                  title="Manually restore audio file"
                >
                  <Upload className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleTestAudio}
                className={`${isTestPlaying ? 'text-red-400 hover:text-red-300' : 'text-blue-400 hover:text-blue-300'} ml-2`}
                title={isTestPlaying ? "Stop test audio" : "Test audio playback"}
              >
                {isTestPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                onClick={onAudioRemove}
                className="text-red-400 hover:text-red-300 ml-1"
                title="Remove audio"
              >
                <VolumeX className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <input
                type="file"
                ref={audioInputRef}
                accept="audio/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAudioUpload(file);
                }}
                className="hidden"
              />
              <button
                onClick={() => audioInputRef.current?.click()}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Audio</span>
              </button>
              <button
                onClick={() => setShowAudioModal(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
              >
                <Link className="w-4 h-4" />
                <span>Link Audio</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        <button
          onClick={() => onSeek(0)}
          className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          title="Go to beginning"
        >
          <SkipBack className="w-4 h-4" />
        </button>
        
        <button
          onClick={isPlaying ? onPause : onPlay}
          className="p-3 bg-lume-primary hover:bg-orange-600 text-white rounded-lg transition-colors"
          title={isPlaying ? "Pause" : "Play from current position"}
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>

        <button
          onClick={handlePlayFromCursor}
          disabled={isPlaying}
          className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={`Play from cursor position (${formatTime(cursorPosition)})`}
        >
          <PlayCircle className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => onSeek(maxDuration)}
          className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          title="Go to end"
        >
          <SkipForward className="w-4 h-4" />
        </button>
        
        <div className="text-sm text-gray-300 font-mono">
          {formatTime(currentTime)} / {formatTime(maxDuration)}
        </div>
      </div>

      {/* Enhanced Timeline Container */}
      <div className="relative w-full">
        {/* Track Labels - positioned outside timeline */}
        <div className="flex mb-2">
          <div className="w-20 flex flex-col justify-center">
            <div className="text-xs text-gray-400 text-center mb-1">Tracks</div>
          </div>
          <div className="flex-1">
            <div className="text-xs text-gray-400 text-center">Timeline</div>
          </div>
        </div>

        <div className="flex">
          {/* Track Labels Column */}
          <div className="w-20 flex flex-col bg-gray-800 border border-gray-600 rounded-l-lg">
            {/* Audio Label */}
            {show.audio && (
              <div className="flex items-center justify-center border-b border-gray-600" style={{ height: WAVEFORM_HEIGHT }}>
                <span className="text-xs text-green-300 font-bold">AUDIO</span>
              </div>
            )}
            {/* Firework Label */}
            <div className="flex items-center justify-center border-b border-gray-600" style={{ height: TRACK_HEIGHT }}>
              <span className="text-xs text-orange-300 font-bold">PYRO</span>
            </div>
            {/* Lighting Label */}
            <div className="flex items-center justify-center" style={{ height: TRACK_HEIGHT }}>
              <span className="text-xs text-blue-300 font-bold">ILLUME</span>
            </div>
          </div>

          {/* Timeline Area */}
          <div className="flex-1 bg-gray-900 rounded-r-lg overflow-x-auto overflow-y-hidden border-t border-r border-b border-gray-600">
            {/* Time Ruler */}
            <div className="relative bg-gray-800 border-b border-gray-600" style={{ height: RULER_HEIGHT, minWidth: timelineWidth }}>
              {/* Time markers - thinner and more precise */}
              {getTimeMarkers().map((timestamp) => {
                const isMainMarker = timestamp % (zoom >= 2 ? 5000 : 10000) === 0; // Major markers every 5-10 seconds
                const pixelPosition = timestampToPixel(timestamp);
                return (
                  <div key={`marker-${timestamp}`} className="absolute flex flex-col items-center">
                    <div
                      className={`bg-gray-500 ${isMainMarker ? 'w-0.5' : 'w-px'}`}
                      style={{
                        left: pixelPosition,
                        height: isMainMarker ? RULER_HEIGHT - 8 : RULER_HEIGHT - 12
                      }}
                    />
                    {isMainMarker && (
                      <span
                        className="text-xs text-gray-300 mt-1 absolute top-1 font-mono"
                        style={{ left: pixelPosition - 20 }}
                      >
                        {formatTime(timestamp)}
                      </span>
                    )}
                  </div>
                );
              })}
              
              {/* Current time indicator in ruler */}
              <div
                className="absolute top-0 w-1 bg-red-500 z-20"
                style={{ 
                  left: timestampToPixel(currentTime),
                  height: RULER_HEIGHT 
                }}
              >
                <div className="absolute -top-1 -left-2 w-5 h-3 bg-red-500 rounded-b-sm" />
              </div>
            </div>

        {/* Audio Waveform Track */}
        {show.audio && (
          <div 
            className="relative bg-gray-900 border-b border-gray-600"
            style={{ height: WAVEFORM_HEIGHT, width: timelineWidth, minWidth: timelineWidth }}
          >
            {/* Draggable Audio Container */}
            {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
            <div 
              className={`absolute bg-gradient-to-r from-blue-900/20 to-blue-800/20 border-2 border-blue-500/30 hover:border-blue-400/50 rounded cursor-move transition-all group ${
                isDraggingAudio ? 'opacity-75 scale-105 border-blue-400' : ''
              }`}
              style={{
                left: timestampToPixel(show.audio.startOffset || 0),
                width: timestampToPixel(show.audio.duration),
                top: 0,
                height: '100%',
                zIndex: 15
              }}
              onMouseDown={handleAudioMouseDown}
              title={`🎵 ${show.audio.name} - Drag to reposition`}
            >
              {/* Audio name and offset info */}
              <div className="absolute top-1 left-2 text-xs text-blue-300 pointer-events-none">
                🎵 {show.audio.name}
                {show.audio.startOffset && show.audio.startOffset > 0 && (
                  <span className="block text-blue-400 opacity-90">
                    starts at {formatTime(show.audio.startOffset)}
                  </span>
                )}
              </div>
              
              {/* Drag handle indicator */}
              <div className="absolute top-1 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="text-blue-300 text-xs">⋮⋮</div>
              </div>
            </div>

            {/* Waveform Visualization - positioned to match audio container exactly */}
            {audioWaveform.length > 0 && (
              <svg
                width={timelineWidth}
                height={WAVEFORM_HEIGHT}
                className="absolute left-0 top-0 z-10"
                viewBox={`0 0 ${timelineWidth} ${WAVEFORM_HEIGHT}`}
                style={{ width: timelineWidth, height: WAVEFORM_HEIGHT }}
              >
                <defs>
                  {/* Bright, high-contrast waveform gradient */}
                  <linearGradient id="waveformGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="1.0" />
                    <stop offset="25%" stopColor="#34d399" stopOpacity="0.9" />
                    <stop offset="50%" stopColor="#6ee7b7" stopOpacity="0.8" />
                    <stop offset="75%" stopColor="#34d399" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="1.0" />
                  </linearGradient>
                  
                  {/* Glowing effect */}
                  <filter id="waveformGlow">
                    <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                    <feMerge> 
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                {/* Background waveform bars for better visibility */}
                {audioWaveform.map((amplitude, index) => {
                  // Calculate position based on audio duration and start offset with consistent scaling
                  const audioStartOffset = show.audio?.startOffset || 0;
                  const audioTimePosition = (index / audioWaveform.length) * (show.audio?.duration || 0);
                  const timelineTimePosition = audioStartOffset + audioTimePosition;
                  
                  // Use consistent pixel calculation with the timeline
                  const x = timestampToPixel(timelineTimePosition);
                  
                  // Only render bars that are within the audio track bounds
                  const audioEndTime = audioStartOffset + (show.audio?.duration || 0);
                  if (timelineTimePosition < audioStartOffset || timelineTimePosition > audioEndTime) {
                    return null;
                  }
                  
                  const centerY = WAVEFORM_HEIGHT / 2;
                  const height = Math.max(2, amplitude * (WAVEFORM_HEIGHT * 0.8)); // Use more conservative height
                  const topY = centerY - height / 2;
                  
                  // Calculate bar width to ensure proper coverage without gaps
                  const timePerBar = (show.audio?.duration || 0) / audioWaveform.length;
                  const barWidth = Math.max(1, timestampToPixel(timePerBar));
                  
                  return (
                    <rect
                      key={`waveform-${timelineTimePosition}-${index}`}
                      x={x}
                      y={topY}
                      width={barWidth}
                      height={height}
                      fill="url(#waveformGradient)"
                      filter="url(#waveformGlow)"
                    />
                  );
                })}
                
                {/* Center line for reference - positioned with audio */}
                <line
                  x1={timestampToPixel(show.audio?.startOffset || 0)}
                  y1={WAVEFORM_HEIGHT / 2}
                  x2={timestampToPixel((show.audio?.startOffset || 0) + (show.audio?.duration || 0))}
                  y2={WAVEFORM_HEIGHT / 2}
                  stroke="#10b981"
                  strokeWidth="0.5"
                  opacity="0.3"
                />
              </svg>
            )}
            
            {/* Audio duration indicator - subtle visual indicator aligned with container */}
            <div
              className="absolute top-0 h-full bg-blue-500/5 border-r border-blue-400/20 pointer-events-none"
              style={{ 
                left: timestampToPixel(show.audio.startOffset || 0),
                width: timestampToPixel(show.audio.duration) 
              }}
            />
          </div>
        )}

        {/* Main Timeline Tracks */}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
        <div
          ref={timelineRef}
          className="relative cursor-pointer"
          tabIndex={0}
          aria-label="Timeline editor - Click to seek, use arrow keys to navigate, space to play/pause"
          style={{ 
            height: TRACK_HEIGHT * 2 + 20, // Two tracks + padding
            width: timelineWidth,
            minWidth: timelineWidth
          }}
          onClick={handleTimelineClick}
          onKeyDown={(e) => {
            const step = 1000; // 1 second step
            if (e.key === 'ArrowLeft') {
              e.preventDefault();
              onSeek(Math.max(0, currentTime - step));
            } else if (e.key === 'ArrowRight') {
              e.preventDefault();
              onSeek(Math.min(maxDuration, currentTime + step));
            } else if (e.key === 'Home') {
              e.preventDefault();
              onSeek(0);
            } else if (e.key === 'End') {
              e.preventDefault();
              onSeek(maxDuration);
            } else if (e.key === ' ') {
              e.preventDefault();
              isPlaying ? onPause() : onPlay();
            }
          }}
          onMouseMove={(e) => {
            handleMouseMove(e);
            handleTimelineMouseMove(e);
          }}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Grid lines - thinner and more precise */}
          {showGrid && getTimeMarkers().map((timestamp) => {
            const isMainGrid = timestamp % (zoom >= 2 ? 5000 : 10000) === 0;
            const pixelPosition = timestampToPixel(timestamp);
            return (
              <div
                key={`grid-${timestamp}`}
                className={`absolute top-0 bottom-0 ${isMainGrid ? 'w-px bg-gray-700/60' : 'w-px bg-gray-700/30'} pointer-events-none z-0`}
                style={{ left: pixelPosition }}
              />
            );
          })}

          {/* Firework Track */}
          <div className="absolute top-0 left-0 right-0" style={{ height: TRACK_HEIGHT, zIndex: 1 }}>
            <div className="h-full bg-orange-900/10 border-b border-gray-600">
              {/* Firework Sequences */}
              {show.sequences.filter(s => s.type === 'firework').map((sequence) => {
                const isCurrentlyPlaying = isPlaying && currentTime >= sequence.timestamp && 
                  currentTime <= sequence.timestamp + (sequence.fireworkType?.duration || 1000);
                
                return (
                  /* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */
                  <div
                    key={sequence.id}
                    className={`absolute top-3 bottom-3 rounded cursor-move border flex items-center justify-between transition-all group shadow-lg pointer-events-auto z-50 ${
                      isDragging === sequence.id ? 'opacity-50 scale-105 z-[60]' : ''
                    } ${
                      isCurrentlyPlaying 
                        ? 'bg-orange-400 border-orange-300 shadow-orange-500/50 scale-110 z-[55] animate-pulse' 
                        : 'bg-orange-500 hover:bg-orange-400 border-orange-400 hover:shadow-orange-500/30'
                    }`}
                    style={{
                      left: timestampToPixel(sequence.timestamp),
                      width: Math.max(MIN_SEQUENCE_WIDTH, timestampToPixel(sequence.fireworkType?.duration || 1000))
                    }}
                    onMouseDown={(e) => handleMouseDown(e, sequence.id)}
                    title={`${sequence.fireworkType?.name || 'Firework'} at ${formatTime(sequence.timestamp)} (Ch:${sequence.channel}, Area:${sequence.area})`}
                  >
                    {/* Precise timing indicator */}
                    <div className="absolute -top-6 left-0 text-xs text-orange-300 font-mono bg-gray-800 px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {formatTime(sequence.timestamp)}
                    </div>
                    
                    <span className="text-xs font-medium truncate px-2 text-white">
                      {sequence.fireworkType?.name || 'Firework'}
                    </span>
                    <div className="flex items-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateSequence(sequence);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-white hover:text-green-300 p-1 mr-1 transition-opacity"
                        title="Duplicate sequence"
                      >
                        <Copy size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditSequence(sequence);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-white hover:text-blue-300 p-1 mr-1 transition-opacity"
                        title="Edit sequence"
                      >
                        <Edit size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSequenceDelete(sequence.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-white hover:text-red-300 p-1 mr-1 transition-opacity"
                        title="Delete sequence"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lighting Track */}
          <div className="absolute bottom-0 left-0 right-0" style={{ height: TRACK_HEIGHT, zIndex: 1 }}>
            <div className="h-full bg-blue-900/10 border-b border-gray-600">
              {/* Lighting Sequences */}
              {show.sequences.filter(s => s.type === 'lighting').map((sequence) => {
                const isCurrentlyPlaying = isPlaying && currentTime >= sequence.timestamp && 
                  currentTime <= sequence.timestamp + (sequence.duration || sequence.lightingEffectType?.duration || 1000);
                
                const sequenceDuration = sequence.duration || sequence.lightingEffectType?.duration || 5000;
                
                return (
                  /* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */
                  <div
                    key={sequence.id}
                    className={`absolute top-3 bottom-3 rounded cursor-move border flex items-center justify-between transition-all group shadow-lg pointer-events-auto z-50 ${
                      isDragging === sequence.id ? 'opacity-50 scale-105 z-[60]' : ''
                    } ${
                      isCurrentlyPlaying 
                        ? 'bg-blue-400 border-blue-300 shadow-blue-500/50 scale-110 z-[55] animate-pulse' 
                        : 'bg-blue-500 hover:bg-blue-400 border-blue-400 hover:shadow-blue-500/30'
                    }`}
                    style={{
                      left: timestampToPixel(sequence.timestamp),
                      width: Math.max(MIN_SEQUENCE_WIDTH, timestampToPixel(sequenceDuration))
                    }}
                    onMouseDown={(e) => handleMouseDown(e, sequence.id)}
                    title={`${sequence.lightingEffectType?.name || 'Lighting'} at ${formatTime(sequence.timestamp)} (${formatTime(sequenceDuration)}) Ch:${sequence.channel}, Area:${sequence.area}`}
                  >
                    {/* Precise timing indicator */}
                    <div className="absolute -top-6 left-0 text-xs text-blue-300 font-mono bg-gray-800 px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {formatTime(sequence.timestamp)}
                    </div>
                    
                    <span className="text-xs font-medium truncate px-2 text-white">
                      {sequence.lightingEffectType?.name || 'Lighting'}
                    </span>
                    <div className="flex items-center">
                      {/* Resize handle */}
                      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
                      <div
                        className="w-1 h-6 bg-blue-300 hover:bg-blue-200 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity mr-1 rounded"
                        onMouseDown={(e) => handleResizeStart(e, sequence.id)}
                        title="Drag to adjust duration"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateSequence(sequence);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-white hover:text-green-300 p-1 mr-1 transition-opacity"
                        title="Duplicate sequence"
                      >
                        <Copy size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditSequence(sequence);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-white hover:text-blue-300 p-1 mr-1 transition-opacity"
                        title="Edit sequence"
                      >
                        <Edit size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSequenceDelete(sequence.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-white hover:text-red-300 p-1 mr-1 transition-opacity"
                        title="Delete sequence"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current time playhead - positioned consistently across all tracks */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-40 shadow-lg pointer-events-none"
            style={{ left: timestampToPixel(currentTime) }}
          >
            <div className="absolute -top-2 -left-2 w-5 h-4 bg-red-500 rounded-b-lg border border-red-400" />
            {/* Current time display */}
            <div className="absolute -top-8 -left-8 bg-red-500 text-white text-xs px-1 rounded text-center font-mono">
              {formatTime(currentTime)}
            </div>
          </div>

          {/* Cursor position indicator (preview) - positioned consistently */}
          {!isPlaying && Math.abs(cursorPosition - currentTime) > 100 && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 z-30 opacity-90 pointer-events-none"
              style={{ left: timestampToPixel(cursorPosition) }}
            >
              <div className="absolute -top-1 -left-1 w-3 h-2 bg-yellow-400 rounded-b-sm opacity-90" />
              {/* Precise time indicator */}
              <div className="absolute -top-6 -left-8 bg-yellow-400 text-black text-xs px-1 rounded text-center font-mono">
                {formatTime(cursorPosition)}
              </div>
            </div>
          )}

          {/* Playback progress overlay */}
          {isPlaying && (
            <div
              className="absolute top-0 bottom-0 bg-red-500/5 z-5 pointer-events-none"
              style={{ 
                left: 0,
                width: timestampToPixel(currentTime) 
              }}
            />
          )}
        </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between mt-4 text-sm text-gray-400">
        <div className="flex items-center space-x-4">
          <span>Zoom: {zoom.toFixed(1)}x</span>
          <span>Duration: {formatTime(zoomedDuration)} visible</span>
          <span>Total: {formatTime(maxDuration)}</span>
          {/* Audio Debug Info */}
          {show.audio && (
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-gray-500">•</span>
              <span className={(() => {
                if (show.audio.file) return 'text-green-400';
                if (show.audio.url) return 'text-blue-400';
                return 'text-red-400';
              })()}>
                Audio: {(() => {
                  if (show.audio.file) return 'File ✓';
                  if (show.audio.url) return 'URL ✓';
                  return 'Missing ✗';
                })()}
              </span>
              {show.audio.id && (
                <span className="text-gray-500">ID: {show.audio.id.slice(-6)}</span>
              )}
            </div>
          )}
        </div>
        
        {isPlaying && (
          <div className="flex items-center space-x-2 text-green-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Playing</span>
          </div>
        )}
      </div>

      {/* Audio Link Modal */}
      {showAudioModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-white mb-4">Link Audio Track</h3>
            <input
              type="url"
              placeholder="Enter audio URL (mp3, wav, etc.)"
              value={audioUrl}
              onChange={(e) => setAudioUrl(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent mb-4"
            />
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowAudioModal(false);
                  setAudioUrl('');
                }}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAudioLink}
                disabled={!audioUrl.trim()}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Link Audio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sequence Edit Modal */}
      {showEditModal && editingSequence && (
        <SequenceEditModal
          sequence={editingSequence}
          onSave={handleSaveSequenceEdit}
          onCancel={handleCancelSequenceEdit}
        />
      )}
    </div>
  );
};