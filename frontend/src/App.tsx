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
      <header className="header">
        <div className="logo">
          <span className="logo-emoji">🔥</span>
          <h1>Proof of Presence</h1>
        </div>
        <div className="wallet-section">
          {isConnected ? (
            <div className="wallet-connected">
              <span className="address">{shortenAddress(address || '')}</span>
              <button onClick={handleDisconnect} className="btn btn-secondary">
                Disconnect
              </button>
            </div>
          ) : (
            <button onClick={handleConnect} className="btn btn-primary" disabled={loading}>
              {loading ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </header>

      <main className="main">
        {!isConnected ? (
          <div className="welcome-section">
            <div className="welcome-card">
              <h2>Track Your Daily Presence</h2>
              <p>
                Build streaks, log your activity, and earn NFT badges for your consistency.
                Connect your Stacks wallet to get started.
              </p>
              <div className="features">
                <div className="feature">
                  <span className="feature-icon">📅</span>
                  <span>Daily Check-ins</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">🔥</span>
                  <span>Build Streaks</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">🏆</span>
                  <span>Earn NFT Badges</span>
                </div>
              </div>
              {globalStats && (
                <div className="global-stats-preview">
                  <span>{globalStats.totalUsers} users</span>
                  <span>•</span>
                  <span>{globalStats.totalCheckIns} check-ins</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="dashboard">
            {txStatus && (
              <div className="tx-status">
                <span className="status-dot"></span>
                {txStatus}
              </div>
            )}

            <div className="stats-grid">
              <div className="stat-card streak-card">
                <div className="stat-value">{userStats?.currentStreak || 0}</div>
                <div className="stat-label">Current Streak</div>
                <div className="stat-sublabel">🔥 days</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{userStats?.longestStreak || 0}</div>
                <div className="stat-label">Longest Streak</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{userStats?.totalCheckIns || 0}</div>
                <div className="stat-label">Total Check-ins</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{userStats?.totalLikes || 0}</div>
                <div className="stat-label">Total Likes</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{userStats?.totalComments || 0}</div>
                <div className="stat-label">Total Comments</div>
              </div>
            </div>

            <div className="actions-section">
              <div className="action-card check-in-card">
                <h3>Daily Check-in</h3>
                <p>Check in once per day to maintain your streak</p>
                <button
                  onClick={handleCheckIn}
                  className="btn btn-primary btn-large"
                  disabled={loading || !canUserCheckIn}
                >
                  {!canUserCheckIn ? '✓ Checked In Today' : '🔥 Check In Now'}
                </button>
              </div>

              <div className="action-card">
                <h3>Log Activity</h3>
                <div className="activity-inputs">
                  <div className="input-group">
                    <label>Likes</label>
                    <input
                      type="number"
                      min="1"
                      value={likesCount}
                      onChange={(e) => setLikesCount(parseInt(e.target.value) || 1)}
                    />
                    <button onClick={handleLogLikes} className="btn btn-secondary" disabled={loading}>
                      Log Likes
                    </button>
                  </div>
                  <div className="input-group">
                    <label>Comments</label>
                    <input
                      type="number"
                      min="1"
                      value={commentsCount}
                      onChange={(e) => setCommentsCount(parseInt(e.target.value) || 1)}
                    />
                    <button onClick={handleLogComments} className="btn btn-secondary" disabled={loading}>
                      Log Comments
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="badges-section">
              <h2>🏆 Achievement Badges</h2>
              <div className="badges-grid">
                {Object.entries(BADGE_INFO).map(([type, info]) => {
                  const badgeType = parseInt(type);
                  const hasBadge = badgeStatus?.[getBadgeKey(badgeType)] || false;
                  const isEligible = eligibility[badgeType] || false;

                  return (
                    <div
                      key={type}
                      className={`badge-card ${hasBadge ? 'owned' : ''} ${isEligible && !hasBadge ? 'eligible' : ''}`}
                    >
                      <div className="badge-emoji">{info.emoji}</div>
                      <div className="badge-name">{info.name}</div>
                      <div className="badge-description">{info.description}</div>
                      {hasBadge ? (
                        <div className="badge-owned">✓ Owned</div>
                      ) : isEligible ? (
                        <button
                          onClick={() => handleClaimBadge(badgeType)}
                          className="btn btn-claim"
                          disabled={loading}
                        >
                          Claim NFT
                        </button>
                      ) : (
                        <div className="badge-locked">🔒 Locked</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {globalStats && (
              <div className="global-stats">
                <h3>Global Stats</h3>
                <div className="global-stats-grid">
                  <div className="global-stat">
                    <span className="global-value">{globalStats.totalUsers}</span>
                    <span className="global-label">Total Users</span>
                  </div>
                  <div className="global-stat">
                    <span className="global-value">{globalStats.totalCheckIns}</span>
                    <span className="global-label">Total Check-ins</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="footer">
        <p>Built on Stacks • Secured by Bitcoin</p>
      </footer>
    </div>
  );
}

export default App;
