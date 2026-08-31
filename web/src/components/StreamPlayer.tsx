'use client';

import { useState } from 'react';
import { 
  LiveKitRoom, 
  VideoTrack, 
  useTracks,
  useParticipants,
  RoomAudioRenderer,
  StartAudio
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { Users, Volume2, VolumeX, Activity, Mic } from 'lucide-react';
import './StreamPlayer.css';

interface Props {
  token: string;
}

export default function StreamPlayer({ token }: Props) {
  return (
    <LiveKitRoom
      video={false}
      audio={false}
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      className="player-container"
    >
      <PlayerContent />
    </LiveKitRoom>
  );
}

function PlayerContent() {
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showStats, setShowStats] = useState(false);
  
  const participants = useParticipants();
  
  // Track screen and mic
  const tracks = useTracks([Track.Source.ScreenShare, Track.Source.Microphone, Track.Source.ScreenShareAudio]);

  const screenVideoTrack = tracks.find((t) => t.source === Track.Source.ScreenShare);
  const micAudioTrack = tracks.find((t) => t.source === Track.Source.Microphone);
  
  // Subtract 1 for the streamer if they are in the room
  const viewerCount = Math.max(0, participants.length - 1);
  
  const hasVideo = !!screenVideoTrack;
  const hasAudio = !!micAudioTrack || tracks.some(t => t.source === Track.Source.ScreenShareAudio);
  const isStreamLive = hasVideo || hasAudio;

  const toggleMute = () => setIsMuted(!isMuted);

  return (
    <div className="stream-layout">
      <div className="video-section">
        <div className="video-wrapper">
          {hasVideo ? (
            <VideoTrack trackRef={screenVideoTrack} className="video-element" />
          ) : isStreamLive && hasAudio ? (
            <div className="offline-placeholder">
              <Mic size={48} color="var(--primary)" style={{ opacity: 0.8, marginBottom: '1rem' }} />
              <h2>Voice Broadcast</h2>
              <p>The streamer is broadcasting audio only.</p>
            </div>
          ) : (
            <div className="offline-placeholder">
              <Activity size={48} color="var(--primary)" style={{ opacity: 0.5, marginBottom: '1rem' }} />
              <h2>Stream is Offline</h2>
              <p>Waiting for the streamer to start broadcasting...</p>
            </div>
          )}

          {/* Player Overlay Controls */}
          <div className="player-controls">
            <div className="controls-left">
              <button onClick={toggleMute} className="control-btn">
                {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  if (parseFloat(e.target.value) > 0) setIsMuted(false);
                }}
                className="volume-slider"
              />
            </div>
            
            <div className="controls-right">
              <button onClick={() => setShowStats(!showStats)} className="control-btn text-btn">
                Stats
              </button>
              <div className="live-indicator">
                <span className={`pulse ${isStreamLive ? 'active' : ''}`}></span>
                LIVE
              </div>
            </div>
          </div>
          
          {showStats && isStreamLive && (
             <div className="stats-overlay glass-panel">
               <h4>Stream Stats</h4>
               {hasVideo && <p>Resolution: {screenVideoTrack?.publication.dimensions?.width}x{screenVideoTrack?.publication.dimensions?.height}</p>}
               <p>Video: {hasVideo ? 'Active' : 'Inactive'}</p>
               <p>Audio: {hasAudio ? 'Active' : 'Inactive'}</p>
             </div>
          )}
        </div>
      </div>

      <div className="sidebar">
        <div className="premium-card sidebar-card">
          <div className="sidebar-header">
            <h3>Spectators</h3>
            <div className="spectator-count">
              <Users size={16} /> {viewerCount}
            </div>
          </div>
          <div className="chat-placeholder">
            <p className="text-muted">Chat is disabled for this broadcast.</p>
          </div>
        </div>
      </div>
      
      {/* Renders audio if screen audio or mic is shared */}
      <RoomAudioRenderer volume={isMuted ? 0 : volume} />
      
      {/* Handles browser autoplay policy for audio-only streams */}
      <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}>
        <StartAudio label="Connect" className="btn-primary" />
      </div>
    </div>
  );
}
