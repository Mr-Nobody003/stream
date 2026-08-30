'use client';

import { useState } from 'react';
import { 
  LiveKitRoom, 
  useLocalParticipant, 
  useParticipants,
  useConnectionState
} from '@livekit/components-react';
import { ConnectionState } from 'livekit-client';
import { MonitorUp, MonitorOff, Users, Activity, LogOut } from 'lucide-react';
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
  const [isSharing, setIsSharing] = useState(false);
  
  // Subtract 1 because the streamer themselves is a participant
  const viewerCount = Math.max(0, participants.length - 1);

  const toggleScreenShare = async () => {
    if (!localParticipant) return;
    
    try {
      if (isSharing) {
        await localParticipant.setScreenShareEnabled(false);
        setIsSharing(false);
      } else {
        // We set screen share audio to true so viewers can hear the PC audio if supported by browser
        await localParticipant.setScreenShareEnabled(true, { audio: true });
        setIsSharing(true);
      }
    } catch (e) {
      console.error('Failed to toggle screen share', e);
      setIsSharing(false);
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
        <p>Start sharing your screen to begin the broadcast. Your viewers will see it instantly with sub-second latency.</p>
        
        <button 
          onClick={toggleScreenShare} 
          className={isSharing ? 'btn-danger' : 'btn-primary'}
          style={{ marginTop: '1.5rem', width: '100%', fontSize: '1.1rem', padding: '1rem' }}
        >
          {isSharing ? (
            <><MonitorOff size={24} /> Stop Broadcast</>
          ) : (
            <><MonitorUp size={24} /> Start Screen Share</>
          )}
        </button>
      </div>
    </div>
  );
}
