import {
  connect,
  disconnect,
  isConnected,
  getLocalStorage,
  request,
} from '@stacks/connect';

export const CONTRACT_ADDRESS = 'SP2FY55DK4NESNH6E5CJSNZP2CQ5PZ5BX64B29FYG';
export const TRACKER_CONTRACT = 'presence-tracker';
export const BADGES_CONTRACT = 'presence-badges';
export const NETWORK = 'mainnet';
const API_URL = 'https://api.mainnet.hiro.so';

// Badge type constants
export const BADGE_TYPES = {
  WEEK_WARRIOR: 1,
  MONTHLY_MASTER: 2,
  CENTURY_CLUB: 3,
  CHATTERBOX: 4,
  LOVE_MACHINE: 5,
  OG_PRESENCE: 6,
} as const;

export const BADGE_INFO: Record<number, { name: string; emoji: string; description: string; requirement: number }> = {
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
    const stxAddress = response.addresses.find((a) => a.symbol === 'STX')?.address ||
                       response.addresses[0]?.address;
    return {
      success: true,
      addresses: response.addresses,
      stxAddress
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

export function getStoredAddress(): string | null {
  const data = getLocalStorage();
  if (data?.addresses?.stx?.[0]) {
    return data.addresses.stx[0].address;
  }
  return null;
}

// Contract interactions using request API
export async function checkIn() {
  try {
    const result = await request('stx_callContract', {
      contract: `${CONTRACT_ADDRESS}.${TRACKER_CONTRACT}`,
      functionName: 'check-in',
      functionArgs: [],
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
      functionArgs: [`u${count}`],
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
      functionArgs: [`u${count}`],
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
      functionArgs: [`u${badgeType}`],
    });
    return { success: true, txId: result.txid };
  } catch (error) {
    console.error('Claim badge failed:', error);
    return { success: false, error };
  }
}

// Read-only functions using Hiro API directly
async function callReadOnly(functionName: string, args: string[] = [], senderAddress?: string) {
  const response = await fetch(
    `${API_URL}/v2/contracts/call-read/${CONTRACT_ADDRESS}/${TRACKER_CONTRACT}/${functionName}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: senderAddress || CONTRACT_ADDRESS,
        arguments: args,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  return data.result;
}

export async function getUserStats(address: string) {
  try {
    const principalArg = `0x0516${Buffer.from(address.slice(2), 'hex').toString('hex').padStart(40, '0')}`;
    const result = await callReadOnly('get-user-stats', [principalArg], address);

    // For now, return the raw result - parsing Clarity tuples requires more work
    return result;
  } catch (error) {
    console.error('Get user stats failed:', error);
    return null;
  }
}

export async function canCheckIn(address: string): Promise<boolean> {
  try {
    // Encode principal: 0x05 (standard principal) + version byte + 20-byte hash
    const result = await callReadOnly('can-check-in',
      [`0x0516${address.slice(2).padStart(40, '0')}`],
      address
    );
    return result?.includes('03') || false; // 0x03 = true in Clarity
  } catch (error) {
    console.error('Can check-in failed:', error);
    return true; // Default to true for new users
  }
}

export async function getBadgeStatus(address: string) {
  try {
    const result = await callReadOnly('get-badge-status',
      [`0x0516${address.slice(2).padStart(40, '0')}`],
      address
    );
    return result;
  } catch (error) {
    console.error('Get badge status failed:', error);
    return null;
  }
}

export async function isEligibleForBadge(address: string, badgeType: number): Promise<boolean> {
  try {
    // Encode uint: 0x01 + 16 bytes big-endian
    const uintArg = '0x01' + badgeType.toString(16).padStart(32, '0');
    const result = await callReadOnly('is-eligible-for-badge',
      [`0x0516${address.slice(2).padStart(40, '0')}`, uintArg],
      address
    );
    return result?.includes('03') || false;
  } catch (error) {
    console.error('Is eligible for badge failed:', error);
    return false;
  }
}

export async function getGlobalStats() {
  try {
    const result = await callReadOnly('get-global-stats', []);
    return result;
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
    });
    return { success: true, txId: result.txid };
  } catch (error) {
    console.error('Deploy contract failed:', error);
    return { success: false, error };
  }
}
