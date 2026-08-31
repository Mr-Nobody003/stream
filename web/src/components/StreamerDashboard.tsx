'use client';

import { useState, useEffect } from 'react';
import { 
  LiveKitRoom, 
  useLocalParticipant, 
  useParticipants,
  useConnectionState,
  useRoomContext
} from '@livekit/components-react';
import { ConnectionState, VideoPresets } from 'livekit-client';
import { MonitorUp, MonitorOff, Mic, Users, Activity, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import './StreamerDashboard.css';

interface Props {
  token: string;
}

export default function StreamerDashboard({ token }: Props) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    router.refresh();
  };

  return (
    <LiveKitRoom
      video={false}
      audio={false}
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      className="dashboard-container"
    >
      <div className="dashboard-header glass-panel">
        <div className="brand">
          <Activity color="var(--primary)" />
          <h2>Stream Control Center</h2>
        </div>
        <button onClick={handleLogout} className="btn-logout">
          <LogOut size={18} /> Logout
        </button>
      </div>
      
      <DashboardControls />
    </LiveKitRoom>
  );
}

function DashboardControls() {
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  const connectionState = useConnectionState();
  const room = useRoomContext();
  
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [mode, setMode] = useState<'screen' | 'voice' | 'both'>('both');
  const [resolution, setResolution] = useState<'144' | '240' | '360' | '480' | '720' | '1080' | '1440'>('1080');
  
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState<string>('');

  useEffect(() => {
    // Request permission to get actual device labels
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      navigator.mediaDevices.enumerateDevices().then(devs => {
        const audioInput = devs.filter(d => d.kind === 'audioinput');
        setDevices(audioInput);
        if (audioInput.length > 0) setSelectedMic(audioInput[0].deviceId);
      });
      stream.getTracks().forEach(track => track.stop());
    }).catch(e => console.error('Mic permission denied', e));
  }, []);

  // Subtract 1 because the streamer themselves is a participant
  const viewerCount = Math.max(0, participants.length - 1);

  const toggleBroadcast = async () => {
    if (!localParticipant) return;
    
    try {
      if (isBroadcasting) {
        await localParticipant.setScreenShareEnabled(false);
        await localParticipant.setMicrophoneEnabled(false);
        setIsBroadcasting(false);
      } else {
        // Start broadcast
        if (mode === 'screen' || mode === 'both') {
          // Pass audio: true to always capture system/screen audio (like game sounds)
          const res = resolution === '144' ? { width: 256, height: 144, frameRate: 15 }
                    : resolution === '240' ? { width: 426, height: 240, frameRate: 15 }
                    : resolution === '360' ? VideoPresets.h360.resolution
                    : resolution === '480' ? { width: 854, height: 480, frameRate: 30 }
                    : resolution === '720' ? VideoPresets.h720.resolution
                    : resolution === '1440' ? VideoPresets.h1440.resolution
                    : VideoPresets.h1080.resolution;
          
          await localParticipant.setScreenShareEnabled(true, { audio: true, resolution: res });
        }
        
        if (mode === 'voice' || mode === 'both') {
          if (selectedMic) {
            await room.switchActiveDevice('audioinput', selectedMic);
          }
          await localParticipant.setMicrophoneEnabled(true);
        }
        
        setIsBroadcasting(true);
      }
    } catch (e) {
      console.error('Failed to toggle broadcast', e);
      setIsBroadcasting(false);
    }
  };

  const handleMicChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const deviceId = e.target.value;
    setSelectedMic(deviceId);
    if (isBroadcasting && (mode === 'voice' || mode === 'both')) {
      await room.switchActiveDevice('audioinput', deviceId);
    }
  };

  return (
    <div className="dashboard-content">
      <div className="stats-cards">
        <div className="premium-card stat-card">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <p>Live Viewers</p>
            <h3>{viewerCount}</h3>
          </div>
        </div>

        <div className="premium-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)' }}>
            <Activity size={24} />
          </div>
          <div className="stat-info">
            <p>Connection</p>
            <h3>{connectionState === ConnectionState.Connected ? 'Excellent' : connectionState}</h3>
          </div>
        </div>
      </div>

      <div className="premium-card control-card">
        <h3>Broadcast Controls</h3>
        <p>Configure your broadcast settings before going live.</p>
        
        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: '600px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
              <label style={{ fontSize: '0.9rem', color: '#a1a1aa' }}>Broadcast Mode</label>
              <select 
                value={mode} 
                onChange={(e) => setMode(e.target.value as any)}
                className="input-field"
                disabled={isBroadcasting}
              >
                <option value="screen">Screen Only</option>
                <option value="voice">Voice Only</option>
                <option value="both">Screen & Voice</option>
              </select>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
              <label style={{ fontSize: '0.9rem', color: '#a1a1aa' }}>Microphone</label>
              <select 
                value={selectedMic} 
                onChange={handleMicChange}
                className="input-field"
                disabled={mode === 'screen'}
              >
                {devices.map(d => (
                  <option key={d.deviceId} value={d.deviceId}>{d.label || `Microphone ${d.deviceId}`}</option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
              <label style={{ fontSize: '0.9rem', color: '#a1a1aa' }}>Max Resolution</label>
              <select 
                value={resolution} 
                onChange={(e) => setResolution(e.target.value as any)}
                className="input-field"
                disabled={isBroadcasting || mode === 'voice'}
              >
                <option value="144">144p (Extremely Low)</option>
                <option value="240">240p (Very Low)</option>
                <option value="360">360p (Low)</option>
                <option value="480">480p (Standard)</option>
                <option value="720">720p (HD / Performance)</option>
                <option value="1080">1080p (Full HD)</option>
                <option value="1440">1440p (High Quality)</option>
              </select>
            </div>
          </div>

          <button 
            onClick={toggleBroadcast} 
            className={isBroadcasting ? 'btn-danger' : 'btn-primary'}
            style={{ width: '100%', maxWidth: '600px', fontSize: '1.1rem', padding: '1rem', marginTop: '1rem' }}
          >
            {isBroadcasting ? (
              <><MonitorOff size={24} /> Stop Broadcast</>
            ) : (
              <><MonitorUp size={24} /> Start Broadcast</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
