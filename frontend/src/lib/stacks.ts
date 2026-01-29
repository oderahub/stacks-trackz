import {
  connect,
  disconnect,
  isConnected,
  getLocalStorage,
  request
} from '@stacks/connect';
import {
  Cl,
  fetchCallReadOnlyFunction,
  cvToValue
} from '@stacks/transactions';

// Contract configuration - UPDATE THESE AFTER DEPLOYMENT
export const CONTRACT_ADDRESS = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'; // Change to your deployed address
export const TRACKER_CONTRACT = 'presence-tracker';
export const BADGES_CONTRACT = 'presence-badges';
export const NETWORK = 'testnet'; // or 'mainnet'

// Badge type constants
export const BADGE_TYPES = {
  WEEK_WARRIOR: 1,
  MONTHLY_MASTER: 2,
  CENTURY_CLUB: 3,
  CHATTERBOX: 4,
  LOVE_MACHINE: 5,
  OG_PRESENCE: 6,
} as const;

export const BADGE_INFO = {
  1: { name: 'Week Warrior', emoji: '🔥', description: '7-day streak', requirement: 7 },
  2: { name: 'Monthly Master', emoji: '🌟', description: '30-day streak', requirement: 30 },
  3: { name: 'Century Club', emoji: '💯', description: '100-day streak', requirement: 100 },
  4: { name: 'Chatterbox', emoji: '💬', description: '100 comments', requirement: 100 },
  5: { name: 'Love Machine', emoji: '❤️', description: '500 likes', requirement: 500 },
  6: { name: 'OG Presence', emoji: '🏆', description: '100 check-ins', requirement: 100 },
};

// Wallet connection
export async function connectWallet() {
  try {
    const response = await connect();
    return {
      success: true,
      addresses: response.addresses,
      stxAddress: response.addresses.find(a => a.symbol === 'STX')?.address ||
                  response.addresses[0]?.address
    };
  } catch (error) {
    console.error('Wallet connection failed:', error);
    return { success: false, error };
  }
}

export function disconnectWallet() {
  disconnect();
}

export function checkConnection() {
  return isConnected();
}

export function getStoredAddress() {
  const data = getLocalStorage();
  if (data?.addresses?.stx?.[0]) {
    return data.addresses.stx[0].address;
  }
  return null;
}

// Contract interactions
export async function checkIn() {
  try {
    const result = await request('stx_callContract', {
      contract: `${CONTRACT_ADDRESS}.${TRACKER_CONTRACT}`,
      functionName: 'check-in',
      functionArgs: [],
      network: NETWORK,
    });
    return { success: true, txId: result.txid };
  } catch (error) {
    console.error('Check-in failed:', error);
    return { success: false, error };
  }
}

export async function logLikes(count: number) {
  try {
    const result = await request('stx_callContract', {
      contract: `${CONTRACT_ADDRESS}.${TRACKER_CONTRACT}`,
      functionName: 'log-likes',
      functionArgs: [Cl.uint(count)],
      network: NETWORK,
    });
    return { success: true, txId: result.txid };
  } catch (error) {
    console.error('Log likes failed:', error);
    return { success: false, error };
  }
}

export async function logComments(count: number) {
  try {
    const result = await request('stx_callContract', {
      contract: `${CONTRACT_ADDRESS}.${TRACKER_CONTRACT}`,
      functionName: 'log-comments',
      functionArgs: [Cl.uint(count)],
      network: NETWORK,
    });
    return { success: true, txId: result.txid };
  } catch (error) {
    console.error('Log comments failed:', error);
    return { success: false, error };
  }
}

export async function claimBadge(badgeType: number) {
  try {
    const result = await request('stx_callContract', {
      contract: `${CONTRACT_ADDRESS}.${TRACKER_CONTRACT}`,
      functionName: 'claim-badge',
      functionArgs: [Cl.uint(badgeType)],
      network: NETWORK,
    });
    return { success: true, txId: result.txid };
  } catch (error) {
    console.error('Claim badge failed:', error);
    return { success: false, error };
  }
}

// Read-only functions
export async function getUserStats(address: string) {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: TRACKER_CONTRACT,
      functionName: 'get-user-stats',
      functionArgs: [Cl.principal(address)],
      network: NETWORK,
      senderAddress: address,
    });

    const value = cvToValue(result);
    if (value) {
      return {
        lastCheckIn: value['last-check-in'],
        currentStreak: value['current-streak'],
        longestStreak: value['longest-streak'],
        totalCheckIns: value['total-check-ins'],
        totalLikes: value['total-likes'],
        totalComments: value['total-comments'],
      };
    }
    return null;
  } catch (error) {
    console.error('Get user stats failed:', error);
    return null;
  }
}

export async function canCheckIn(address: string) {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: TRACKER_CONTRACT,
      functionName: 'can-check-in',
      functionArgs: [Cl.principal(address)],
      network: NETWORK,
      senderAddress: address,
    });

    return cvToValue(result);
  } catch (error) {
    console.error('Can check-in failed:', error);
    return true; // Default to true for new users
  }
}

export async function getBadgeStatus(address: string) {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: TRACKER_CONTRACT,
      functionName: 'get-badge-status',
      functionArgs: [Cl.principal(address)],
      network: NETWORK,
      senderAddress: address,
    });

    return cvToValue(result);
  } catch (error) {
    console.error('Get badge status failed:', error);
    return null;
  }
}

export async function isEligibleForBadge(address: string, badgeType: number) {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: TRACKER_CONTRACT,
      functionName: 'is-eligible-for-badge',
      functionArgs: [Cl.principal(address), Cl.uint(badgeType)],
      network: NETWORK,
      senderAddress: address,
    });

    return cvToValue(result);
  } catch (error) {
    console.error('Is eligible for badge failed:', error);
    return false;
  }
}

export async function getGlobalStats() {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: TRACKER_CONTRACT,
      functionName: 'get-global-stats',
      functionArgs: [],
      network: NETWORK,
      senderAddress: CONTRACT_ADDRESS,
    });

    const value = cvToValue(result);
    return {
      totalUsers: value['total-users'],
      totalCheckIns: value['total-check-ins'],
    };
  } catch (error) {
    console.error('Get global stats failed:', error);
    return null;
  }
}

// Deploy contracts via wallet
export async function deployContract(contractName: string, clarityCode: string) {
  try {
    const result = await request('stx_deployContract', {
      name: contractName,
      clarityCode: clarityCode,
      network: NETWORK,
    });
    return { success: true, txId: result.txid };
  } catch (error) {
    console.error('Deploy contract failed:', error);
    return { success: false, error };
  }
}
