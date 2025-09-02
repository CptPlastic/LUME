import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Upload, Link, Volume2, VolumeX, SkipBack, SkipForward, X, Square } from 'lucide-react';
import type { Show, AudioTrack, ShowSequence } from '../types';

interface ShowTimelineProps {
  show: Show;
  isPlaying: boolean;
  currentTime: number; // Current playback time in milliseconds
  onSequenceMove: (sequenceId: string, newTimestamp: number) => void;
  onSequenceDelete: (sequenceId: string) => void;
  onSequenceUpdate: (sequenceId: string, updates: Partial<ShowSequence>) => void;
  onAudioUpload: (audioTrack: AudioTrack) => Promise<void>;
  onAudioRemove: () => void;
  onAudioMove: (newStartOffset: number) => void; // New prop for moving audio
  onPlay: () => void;
  onPause: () => void;
  onSeek: (timestamp: number) => void;
}

export const ShowTimeline: React.FC<ShowTimelineProps> = ({
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
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [isDraggingAudio, setIsDraggingAudio] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [testAudio, setTestAudio] = useState<HTMLAudioElement | null>(null);
  const [isTestPlaying, setIsTestPlaying] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // Calculate timeline dimensions - use container width instead of fixed width
  const [timelineWidth, setTimelineWidth] = React.useState(600);
  
  // Calculate max duration - prioritize audio duration
  const maxSequenceDuration = Math.max(
    ...show.sequences.map(s => {
      let endTime = s.timestamp;
      if (s.type === 'firework' && s.fireworkType) {
        endTime += s.fireworkType.duration;
      } else if (s.type === 'lighting') {
        // Use custom duration if available, otherwise use effect type duration
        const duration = s.duration || (s.lightingEffectType?.duration ? s.lightingEffectType.duration * 1000 : 5000);
        endTime += duration;
      }
      return endTime;
    }),
    60000 // Minimum 1 minute
  );
  
  const maxDuration = show.audio?.duration || maxSequenceDuration;

  // Update timeline width based on container
  useEffect(() => {
    const updateWidth = () => {
      if (timelineRef.current?.parentElement) {
        const containerWidth = timelineRef.current.parentElement.clientWidth;
        setTimelineWidth(Math.max(600, containerWidth - 40)); // Leave some padding
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Cleanup test audio on unmount
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

  // Convert timestamp to pixel position
  const timestampToPixel = (timestamp: number) => {
    const elementWidth = timelineRef.current?.clientWidth || timelineWidth;
    return (timestamp / maxDuration) * elementWidth;
  };

  // Convert pixel position to timestamp
  const pixelToTimestamp = (pixel: number) => {
    const elementWidth = timelineRef.current?.clientWidth || timelineWidth;
    return (pixel / elementWidth) * maxDuration;
  };

  // Handle sequence dragging
  const handleMouseDown = (e: React.MouseEvent, sequenceId: string) => {
    e.preventDefault();
    setIsDragging(sequenceId);
    
    const rect = timelineRef.current?.getBoundingClientRect();
    if (rect) {
      const sequence = show.sequences.find(s => s.id === sequenceId);
      if (sequence) {
        const sequencePixel = timestampToPixel(sequence.timestamp);
        setDragOffset(e.clientX - rect.left - sequencePixel);
      }
    }
  };

  // Handle audio dragging
  const handleAudioMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent timeline click
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
    
    const sequence = show.sequences.find(s => s.id === sequenceId);
    if (sequence && sequence.type === 'lighting') {
      const currentDuration = sequence.duration || sequence.lightingEffectType?.duration || 5000;
      // Store the initial duration for reference
      console.log('Starting resize from duration:', currentDuration);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const elementWidth = rect.width;

    // Handle dragging sequences
    if (isDragging) {
      const newPixel = Math.max(0, Math.min(elementWidth, e.clientX - rect.left - dragOffset));
      const newTimestamp = Math.max(0, pixelToTimestamp(newPixel));
      onSequenceMove(isDragging, newTimestamp);
    }

    // Handle dragging audio
    if (isDraggingAudio) {
      const newPixel = Math.max(0, Math.min(elementWidth, e.clientX - rect.left - dragOffset));
      const newStartOffset = Math.max(0, pixelToTimestamp(newPixel));
      onAudioMove(newStartOffset);
    }

    // Handle resizing
    if (isResizing) {
      const sequence = show.sequences.find(s => s.id === isResizing);
      if (sequence && sequence.type === 'lighting') {
        const sequenceStartPixel = timestampToPixel(sequence.timestamp);
        const mousePixel = e.clientX - rect.left;
        const newWidthPixel = Math.max(30, mousePixel - sequenceStartPixel); // Minimum 30px width
        const newDuration = Math.max(500, pixelToTimestamp(newWidthPixel)); // Minimum 0.5 seconds
        
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

  // Handle test audio playback
  const handleTestAudio = () => {
    if (isTestPlaying && testAudio) {
      // Stop test audio
      testAudio.pause();
      testAudio.currentTime = 0;
      setIsTestPlaying(false);
      setTestAudio(null);
    } else {
      // Play test audio
      const audioElement = new Audio();
      if (show.audio?.url) {
        audioElement.src = show.audio.url;
      } else if (show.audio?.file) {
        audioElement.src = URL.createObjectURL(show.audio.file);
      }
      
      audioElement.volume = 0.5; // Set to 50% volume
      
      // Set up event listeners
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

  // Handle timeline seeking
  const handleTimelineClick = (e: React.MouseEvent) => {
    if (isDragging || isDraggingAudio) return;
    
    const rect = timelineRef.current?.getBoundingClientRect();
    if (rect) {
      const clickPixel = e.clientX - rect.left;
      const clickTimestamp = pixelToTimestamp(clickPixel);
      onSeek(clickTimestamp);
    }
  };

  // Handle audio file upload
  const handleAudioUpload = (file: File) => {
    const audioTrack: AudioTrack = {
      id: `audio_${Date.now()}`,
      name: file.name,
      file,
      duration: 0, // Will be calculated after loading
      format: file.name.split('.').pop()?.toLowerCase() || 'unknown',
      size: file.size,
      uploadedAt: new Date()
    };

    // Create audio element to get duration
    const audio = new Audio();
    audio.onloadedmetadata = async () => {
      audioTrack.duration = audio.duration * 1000; // Convert to milliseconds
      try {
        await onAudioUpload(audioTrack);
        console.log('✅ Audio uploaded and stored successfully');
      } catch (error) {
        console.error('❌ Failed to upload audio:', error);
        alert('Failed to save audio file. It will be lost on page reload.');
      }
    };
    audio.src = URL.createObjectURL(file);
  };

  // Handle audio URL linking
  const handleAudioLink = () => {
    if (!audioUrl.trim()) return;

    const audioTrack: AudioTrack = {
      id: `audio_${Date.now()}`,
      name: audioUrl.split('/').pop() || 'Linked Audio',
      url: audioUrl,
      duration: 0, // Will be calculated after loading
      format: audioUrl.split('.').pop()?.toLowerCase() || 'unknown',
      uploadedAt: new Date()
    };

    // Create audio element to get duration
    const audio = new Audio();
    audio.onloadedmetadata = async () => {
      audioTrack.duration = audio.duration * 1000; // Convert to milliseconds
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

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      {/* Playback Status */}
      {isPlaying && (
        <div className="bg-lume-primary/20 border border-lume-primary/30 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-white font-medium">Show Playing</span>
              {show.audio && (
                <div className="flex items-center space-x-2 text-blue-300">
                  <Volume2 size={16} />
                  <span className="text-sm">{show.audio.name}</span>
                </div>
              )}
            </div>
            <div className="text-gray-300 text-sm font-mono">
              {formatTime(currentTime)} / {formatTime(maxDuration)}
            </div>
          </div>
          
          {/* Currently Playing Sequences */}
          {(() => {
            const currentSequences = show.sequences.filter(seq => 
              currentTime >= seq.timestamp && 
              currentTime <= seq.timestamp + (seq.fireworkType?.duration || seq.lightingEffectType?.duration || 1000)
            );
            
            if (currentSequences.length > 0) {
              return (
                <div className="mt-2 flex flex-wrap gap-2">
                  {currentSequences.map(seq => (
                    <div key={seq.id} className="bg-white/10 px-2 py-1 rounded text-xs text-white">
                      {seq.type === 'firework' ? '🎆' : '💡'} {seq.fireworkType?.name || seq.lightingEffectType?.name}
                    </div>
                  ))}
                </div>
              );
            }
            return null;
          })()}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Audio & Playback Controls</h2>
          <div className="flex items-center space-x-4 mt-1">
            <span className="text-sm text-gray-400">
              {show.sequences.length} sequence{show.sequences.length !== 1 ? 's' : ''}
            </span>
            {show.sequences.length > 0 && (
              <span className="text-xs text-gray-500">
                🎆 {show.sequences.filter(s => s.type === 'firework').length} firework{show.sequences.filter(s => s.type === 'firework').length !== 1 ? 's' : ''} • 
                💡 {show.sequences.filter(s => s.type === 'lighting').length} lighting
              </span>
            )}
          </div>
        </div>
        
        {/* Audio Controls */}
        <div className="flex items-center space-x-3">
          {show.audio ? (
            <div className="flex items-center space-x-2 text-sm text-gray-300 bg-gray-700 px-3 py-2 rounded-lg">
              <Volume2 className="w-4 h-4" />
              <span>{show.audio.name}</span>
              {show.audio.file && !show.audio.url && (
                <span className="text-xs text-green-400 bg-green-900/30 px-2 py-1 rounded" title="File saved - persists on reload">
                  💾 Saved
                </span>
              )}
              {show.audio.url && (
                <span className="text-xs text-blue-400 bg-blue-900/30 px-2 py-1 rounded" title="Linked from URL">
                  🔗 Linked
                </span>
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
        >
          <SkipBack className="w-4 h-4" />
        </button>
        
        <button
          onClick={isPlaying ? onPause : onPlay}
          className="p-3 bg-lume-primary hover:bg-orange-600 text-white rounded-lg transition-colors"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
        
        <button
          onClick={() => onSeek(maxDuration)}
          className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          <SkipForward className="w-4 h-4" />
        </button>
        
        <div className="text-sm text-gray-300 font-mono">
          {formatTime(currentTime)} / {formatTime(maxDuration)}
        </div>
      </div>

      {/* Timeline Container */}
      <div className="relative w-full">
        {/* Time Scale */}
        <div className="flex justify-between text-xs text-gray-400 mb-2 w-full">
          {Array.from({ length: 11 }, (_, i) => (
            <span key={i} className="flex-shrink-0">
              {formatTime((maxDuration / 10) * i)}
            </span>
          ))}
        </div>

        {/* Timeline Track */}
        <div
          ref={timelineRef}
          className="relative h-32 bg-gray-700 rounded-lg cursor-pointer w-full border-2 border-gray-600 shadow-lg"
          onClick={handleTimelineClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          role="slider"
          tabIndex={0}
          aria-label="Timeline scrubber"
          aria-valuemin={0}
          aria-valuemax={maxDuration}
          aria-valuenow={currentTime}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') onSeek(Math.max(0, currentTime - 1000));
            if (e.key === 'ArrowRight') onSeek(Math.min(maxDuration, currentTime + 1000));
          }}
        >
          {/* Audio Waveform */}
          {show.audio && (
            <div 
              className={`absolute bg-gradient-to-r from-blue-900/30 to-blue-800/30 rounded-lg cursor-move border-2 border-blue-500/30 hover:border-blue-400/50 transition-all group ${
                isDraggingAudio ? 'opacity-75 scale-105' : ''
              }`}
              style={{
                left: timestampToPixel(show.audio.startOffset || 0),
                width: timestampToPixel(show.audio.duration),
                top: 0,
                height: '100%'
              }}
              onMouseDown={handleAudioMouseDown}
              title={`🎵 ${show.audio.name} - Drag to reposition`}
            >
              <div className="text-xs text-blue-300 p-2 pointer-events-none">
                🎵 {show.audio.name}
                {show.audio.startOffset && show.audio.startOffset > 0 && (
                  <span className="ml-2 text-blue-400">
                    (starts at {formatTime(show.audio.startOffset)})
                  </span>
                )}
              </div>
              {/* Drag handle indicator */}
              <div className="absolute top-1 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="text-blue-300 text-xs">⋮⋮</div>
              </div>
            </div>
          )}

          {/* Current Time Indicator */}
          <div
            className={`absolute top-0 bottom-0 w-1 z-20 transition-all duration-75 ${
              isPlaying ? 'bg-red-500 shadow-lg shadow-red-500/50' : 'bg-lume-primary'
            }`}
            style={{ left: timestampToPixel(currentTime) }}
          >
            {/* Playback Head */}
            <div className={`absolute -top-2 -left-2 w-5 h-5 rounded-full border-2 ${
              isPlaying ? 'bg-red-500 border-red-300 animate-pulse' : 'bg-lume-primary border-orange-300'
            }`} />
          </div>

          {/* Playback Progress Fill */}
          {isPlaying && (
            <div
              className="absolute top-0 bottom-0 bg-gradient-to-r from-lume-primary/20 to-lume-primary/10 z-10 transition-all duration-75"
              style={{ width: timestampToPixel(currentTime) }}
            />
          )}

          {/* Firework Sequences */}
          {show.sequences.filter(s => s.type === 'firework').map((sequence) => {
            const isCurrentlyPlaying = isPlaying && currentTime >= sequence.timestamp && 
              currentTime <= sequence.timestamp + (sequence.fireworkType?.duration || 1000);
            
            return (
              <div
                key={sequence.id}
                className={`absolute top-4 h-6 rounded cursor-move border flex items-center justify-between transition-all group ${
                  isDragging === sequence.id ? 'opacity-50' : ''
                } ${
                  isCurrentlyPlaying 
                    ? 'bg-orange-400 border-orange-300 shadow-lg shadow-orange-500/50 scale-110 z-30' 
                    : 'bg-orange-500 hover:bg-orange-400 border-orange-400'
                }`}
                style={{
                  left: timestampToPixel(sequence.timestamp),
                  width: Math.max(60, timestampToPixel(sequence.fireworkType?.duration || 1000))
                }}
                onMouseDown={(e) => handleMouseDown(e, sequence.id)}
                title={`${sequence.fireworkType?.name || 'Firework'} at ${formatTime(sequence.timestamp)}`}
              >
                <span className={`text-xs font-medium truncate px-2 flex items-center ${
                  isCurrentlyPlaying ? 'text-white animate-pulse' : 'text-white'
                }`}>
                  🎆 {sequence.fireworkType?.name || 'Firework'}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSequenceDelete(sequence.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-white hover:text-red-300 p-1 transition-opacity"
                  title="Delete sequence"
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}

          {/* Lighting Sequences */}
          {show.sequences.filter(s => s.type === 'lighting').map((sequence) => {
            const isCurrentlyPlaying = isPlaying && currentTime >= sequence.timestamp && 
              currentTime <= sequence.timestamp + (sequence.duration || sequence.lightingEffectType?.duration || 1000);
            
            const sequenceDuration = sequence.duration || sequence.lightingEffectType?.duration || 5000;
            
            return (
              <div
                key={sequence.id}
                className={`absolute bottom-4 h-6 rounded cursor-move border flex items-center justify-between transition-all group ${
                  isDragging === sequence.id ? 'opacity-50' : ''
                } ${
                  isCurrentlyPlaying 
                    ? 'bg-blue-400 border-blue-300 shadow-lg shadow-blue-500/50 scale-110 z-30' 
                    : 'bg-blue-500 hover:bg-blue-400 border-blue-400'
                }`}
                style={{
                  left: timestampToPixel(sequence.timestamp),
                  width: Math.max(60, timestampToPixel(sequenceDuration))
                }}
                onMouseDown={(e) => handleMouseDown(e, sequence.id)}
                title={`${sequence.lightingEffectType?.name || 'Lighting'} at ${formatTime(sequence.timestamp)} (${formatTime(sequenceDuration)})`}
              >
                <span className={`text-xs font-medium truncate px-2 flex items-center ${
                  isCurrentlyPlaying ? 'text-white animate-pulse' : 'text-white'
                }`}>
                  💡 {sequence.lightingEffectType?.name || 'Lighting'}
                </span>
                <div className="flex items-center">
                  {/* Resize handle for lighting effects */}
                  <div
                    className="w-1 h-4 bg-blue-300 hover:bg-blue-200 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity mr-1"
                    onMouseDown={(e) => handleResizeStart(e, sequence.id)}
                    title="Drag to adjust duration"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSequenceDelete(sequence.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-white hover:text-red-300 p-1 transition-opacity"
                    title="Delete sequence"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Timeline Labels */}
        <div className="flex justify-between text-xs text-gray-400 mt-2 w-full">
          <span>Fireworks (Top)</span>
          <span>Lighting (Bottom)</span>
        </div>
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
    </div>
  );
};
