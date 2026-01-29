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

  // Check connection on mount
  useEffect(() => {
    const connected = checkConnection();
    setIsConnected(connected);
    if (connected) {
      const storedAddr = getStoredAddress();
      setAddress(storedAddr);
    }
  }, []);

  // Fetch data when connected
  const fetchData = useCallback(async () => {
    if (!address) return;

    setLoading(true);
    try {
      const [stats, badges, global, canCheck] = await Promise.all([
        getUserStats(address),
        getBadgeStatus(address),
        getGlobalStats(),
        canCheckIn(address),
      ]);

      setUserStats(stats);
      setBadgeStatus(badges);
      setGlobalStats(global);
      setCanUserCheckIn(canCheck);

      // Check eligibility for each badge
      const eligibilityResults: Record<number, boolean> = {};
      for (const badgeType of Object.values(BADGE_TYPES)) {
        eligibilityResults[badgeType] = await isEligibleForBadge(address, badgeType);
      }
      setEligibility(eligibilityResults);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  }, [address]);

  useEffect(() => {
    if (address) {
      fetchData();
    }
  }, [address, fetchData]);

  const handleConnect = async () => {
    setLoading(true);
    const result = await connectWallet();
    if (result.success && result.stxAddress) {
      setIsConnected(true);
      setAddress(result.stxAddress);
    }
    setLoading(false);
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setIsConnected(false);
    setAddress(null);
    setUserStats(null);
    setBadgeStatus(null);
  };

  const handleCheckIn = async () => {
    setLoading(true);
    setTxStatus('Submitting check-in...');
    const result = await checkIn();
    if (result.success) {
      setTxStatus(`Check-in submitted! TX: ${result.txId?.slice(0, 10)}...`);
      setTimeout(() => fetchData(), 5000);
    } else {
      setTxStatus('Check-in failed. Please try again.');
    }
    setLoading(false);
    setTimeout(() => setTxStatus(null), 5000);
  };

  const handleLogLikes = async () => {
    setLoading(true);
    setTxStatus(`Logging ${likesCount} likes...`);
    const result = await logLikes(likesCount);
    if (result.success) {
      setTxStatus(`Likes logged! TX: ${result.txId?.slice(0, 10)}...`);
      setTimeout(() => fetchData(), 5000);
    } else {
      setTxStatus('Failed to log likes.');
    }
    setLoading(false);
    setTimeout(() => setTxStatus(null), 5000);
  };

  const handleLogComments = async () => {
    setLoading(true);
    setTxStatus(`Logging ${commentsCount} comments...`);
    const result = await logComments(commentsCount);
    if (result.success) {
      setTxStatus(`Comments logged! TX: ${result.txId?.slice(0, 10)}...`);
      setTimeout(() => fetchData(), 5000);
    } else {
      setTxStatus('Failed to log comments.');
    }
    setLoading(false);
    setTimeout(() => setTxStatus(null), 5000);
  };

  const handleClaimBadge = async (badgeType: number) => {
    setLoading(true);
    const badgeName = BADGE_INFO[badgeType as keyof typeof BADGE_INFO].name;
    setTxStatus(`Claiming ${badgeName} badge...`);
    const result = await claimBadge(badgeType);
    if (result.success) {
      setTxStatus(`Badge claimed! TX: ${result.txId?.slice(0, 10)}...`);
      setTimeout(() => fetchData(), 5000);
    } else {
      setTxStatus('Failed to claim badge.');
    }
    setLoading(false);
    setTimeout(() => setTxStatus(null), 5000);
  };

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getBadgeKey = (badgeType: number): keyof BadgeStatus => {
    const keyMap: Record<number, keyof BadgeStatus> = {
      1: 'week-warrior',
      2: 'monthly-master',
      3: 'century-club',
      4: 'chatterbox',
      5: 'love-machine',
      6: 'og-presence',
    };
    return keyMap[badgeType];
  };

  return (
    <div className="app">
      <h1>Proof of Presence</h1>
      <p>{isConnected ? `Connected: ${shortenAddress(address || '')}` : 'Not connected'}</p>
      <button onClick={isConnected ? handleDisconnect : handleConnect}>
        {isConnected ? 'Disconnect' : 'Connect'}
      </button>
      {loading && <p>Loading...</p>}
      {txStatus && <p>{txStatus}</p>}
      <p>Streak: {userStats?.currentStreak || 0}</p>
      <button onClick={handleCheckIn} disabled={!canUserCheckIn}>Check In</button>
      <button onClick={handleLogLikes}>Log {likesCount} Like(s)</button>
      <button onClick={handleLogComments}>Log {commentsCount} Comment(s)</button>
      <button onClick={() => handleClaimBadge(1)}>Claim Badge</button>
      <p>Eligibility: {JSON.stringify(eligibility)}</p>
      <p>Badges: {JSON.stringify(badgeStatus)}</p>
      <p>Badge Key Test: {getBadgeKey(1)}</p>
      <p>Global: {JSON.stringify(globalStats)}</p>
    </div>
  );
}

export default App;
