import { useState, useEffect, useCallback } from 'react';
import {
  connectWallet,
  disconnectWallet,
  checkConnection,
  getStoredAddress,
  checkIn,
  logLikes,
  logComments,
  claimBadge,
  getUserStats,
  canCheckIn,
  getBadgeStatus,
  getGlobalStats,
  isEligibleForBadge,
  BADGE_INFO,
  BADGE_TYPES,
} from './lib/stacks';
import './App.css';

interface UserStats {
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  totalLikes: number;
  totalComments: number;
  lastCheckIn: number;
}

interface BadgeStatus {
  'week-warrior': boolean;
  'monthly-master': boolean;
  'century-club': boolean;
  'chatterbox': boolean;
  'love-machine': boolean;
  'og-presence': boolean;
}

interface GlobalStats {
  totalUsers: number;
  totalCheckIns: number;
}

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [badgeStatus, setBadgeStatus] = useState<BadgeStatus | null>(null);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [canUserCheckIn, setCanUserCheckIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [likesCount, setLikesCount] = useState(1);
  const [commentsCount, setCommentsCount] = useState(1);
  const [eligibility, setEligibility] = useState<Record<number, boolean>>({});

  return (
    <div className="app">
      <h1>Proof of Presence</h1>
      <p>Loading...</p>
    </div>
  );
}

export default App;
