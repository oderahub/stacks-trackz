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
