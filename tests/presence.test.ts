import { Cl, ClarityType } from "@stacks/transactions";
import { describe, expect, it, beforeEach } from "vitest";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("Presence Tracker Tests", () => {
  
  describe("Check-in functionality", () => {
    
    it("allows a new user to check in", () => {
      const result = simnet.callPublicFn(
        "presence-tracker",
        "check-in",
        [],
        wallet1
      );
      
      expect(result.result).toHaveClarityType(ClarityType.ResponseOk);
      
      // Verify user stats were created
      const stats = simnet.callReadOnlyFn(
        "presence-tracker",
        "get-user-stats",
        [Cl.principal(wallet1)],
        wallet1
      );
      
      expect(stats.result).toHaveClarityType(ClarityType.OptionalSome);
    });
    
    it("prevents double check-in on the same day", () => {
      // First check-in
      simnet.callPublicFn("presence-tracker", "check-in", [], wallet1);
      
      // Try to check in again immediately
      const result = simnet.callPublicFn(
        "presence-tracker",
        "check-in",
        [],
        wallet1
      );
      
      expect(result.result).toHaveClarityType(ClarityType.ResponseErr);
    });
    
    it("allows check-in after a day has passed", () => {
      // First check-in
      simnet.callPublicFn("presence-tracker", "check-in", [], wallet1);
      
      // Mine blocks to simulate a day passing (~144 blocks)
      simnet.mineEmptyBlocks(150);
      
      // Check in again
      const result = simnet.callPublicFn(
        "presence-tracker",
        "check-in",
        [],
        wallet1
      );
      
      expect(result.result).toHaveClarityType(ClarityType.ResponseOk);
    });
    
    it("increments streak when checking in consecutive days", () => {
      // Day 1
      simnet.callPublicFn("presence-tracker", "check-in", [], wallet1);
      
      // Day 2
      simnet.mineEmptyBlocks(150);
      simnet.callPublicFn("presence-tracker", "check-in", [], wallet1);
      
      // Day 3
      simnet.mineEmptyBlocks(150);
      simnet.callPublicFn("presence-tracker", "check-in", [], wallet1);
      
      const streak = simnet.callReadOnlyFn(
        "presence-tracker",
        "get-streak",
        [Cl.principal(wallet1)],
        wallet1
      );
      
      expect(streak.result).toBeOk(Cl.uint(3));
    });
    
    it("resets streak when missing a day", () => {
      // Day 1
      simnet.callPublicFn("presence-tracker", "check-in", [], wallet1);
      
      // Skip 3 days (~432 blocks)
      simnet.mineEmptyBlocks(450);
      
      // Check in after missing days
      simnet.callPublicFn("presence-tracker", "check-in", [], wallet1);
      
      const streak = simnet.callReadOnlyFn(
        "presence-tracker",
        "get-streak",
        [Cl.principal(wallet1)],
        wallet1
      );
      
      expect(streak.result).toBeOk(Cl.uint(1));
    });
  });
  
  describe("Activity logging", () => {
    
    beforeEach(() => {
      // User must check in first
      simnet.callPublicFn("presence-tracker", "check-in", [], wallet1);
    });
    
    it("logs likes correctly", () => {
      const result = simnet.callPublicFn(
        "presence-tracker",
        "log-likes",
        [Cl.uint(10)],
        wallet1
      );
      
      expect(result.result).toBeOk(Cl.uint(10));
      
      // Log more likes
      const result2 = simnet.callPublicFn(
        "presence-tracker",
        "log-likes",
        [Cl.uint(5)],
        wallet1
      );
      
      expect(result2.result).toBeOk(Cl.uint(15));
    });
    
    it("logs comments correctly", () => {
      const result = simnet.callPublicFn(
        "presence-tracker",
        "log-comments",
        [Cl.uint(3)],
        wallet1
      );
      
      expect(result.result).toBeOk(Cl.uint(3));
    });
    
    it("fails to log activity for non-existent user", () => {
      const result = simnet.callPublicFn(
        "presence-tracker",
        "log-likes",
        [Cl.uint(10)],
        wallet2  // wallet2 hasn't checked in
      );
      
      expect(result.result).toHaveClarityType(ClarityType.ResponseErr);
    });
  });
  
  describe("Badge system", () => {
    
    it("correctly tracks badge eligibility for 7-day streak", () => {
      // Simulate 7 days of check-ins
      for (let i = 0; i < 7; i++) {
        simnet.callPublicFn("presence-tracker", "check-in", [], wallet1);
        simnet.mineEmptyBlocks(150);
      }
      
      const eligible = simnet.callReadOnlyFn(
        "presence-tracker",
        "is-eligible-for-badge",
        [Cl.principal(wallet1), Cl.uint(1)],  // BADGE_WEEK_WARRIOR = 1
        wallet1
      );
      
      expect(eligible.result).toBeOk(Cl.bool(true));
    });
    
    it("allows claiming badge when eligible", () => {
      // Simulate 7 days of check-ins
      for (let i = 0; i < 7; i++) {
        simnet.callPublicFn("presence-tracker", "check-in", [], wallet1);
        simnet.mineEmptyBlocks(150);
      }
      
      const result = simnet.callPublicFn(
        "presence-tracker",
        "claim-badge",
        [Cl.uint(1)],  // BADGE_WEEK_WARRIOR
        wallet1
      );
      
      expect(result.result).toBeOk(Cl.uint(1));
      
      // Verify badge is marked as claimed
      const hasBadge = simnet.callReadOnlyFn(
        "presence-tracker",
        "has-badge",
        [Cl.principal(wallet1), Cl.uint(1)],
        wallet1
      );
      
      expect(hasBadge.result).toBeBool(true);
    });
    
    it("prevents claiming badge twice", () => {
      // Simulate 7 days of check-ins
      for (let i = 0; i < 7; i++) {
        simnet.callPublicFn("presence-tracker", "check-in", [], wallet1);
        simnet.mineEmptyBlocks(150);
      }
      
      // Claim once
      simnet.callPublicFn("presence-tracker", "claim-badge", [Cl.uint(1)], wallet1);
      
      // Try to claim again
      const result = simnet.callPublicFn(
        "presence-tracker",
        "claim-badge",
        [Cl.uint(1)],
        wallet1
      );
      
      expect(result.result).toHaveClarityType(ClarityType.ResponseErr);
    });
    
    it("prevents claiming badge when not eligible", () => {
      // Just one check-in (not eligible for 7-day streak)
      simnet.callPublicFn("presence-tracker", "check-in", [], wallet1);
      
      const result = simnet.callPublicFn(
        "presence-tracker",
        "claim-badge",
        [Cl.uint(1)],
        wallet1
      );
      
      expect(result.result).toHaveClarityType(ClarityType.ResponseErr);
    });
  });
  
  describe("Read-only functions", () => {
    
    it("returns correct global stats", () => {
      simnet.callPublicFn("presence-tracker", "check-in", [], wallet1);
      simnet.callPublicFn("presence-tracker", "check-in", [], wallet2);
      
      const stats = simnet.callReadOnlyFn(
        "presence-tracker",
        "get-global-stats",
        [],
        wallet1
      );
      
      expect(stats.result).toBeOk(Cl.tuple({
        "total-users": Cl.uint(2),
        "total-check-ins": Cl.uint(2)
      }));
    });
    
    it("correctly reports if user can check in", () => {
      const canCheckIn = simnet.callReadOnlyFn(
        "presence-tracker",
        "can-check-in",
        [Cl.principal(wallet1)],
        wallet1
      );
      
      expect(canCheckIn.result).toBeOk(Cl.bool(true));
      
      // Check in
      simnet.callPublicFn("presence-tracker", "check-in", [], wallet1);
      
      // Should not be able to check in again
      const canCheckIn2 = simnet.callReadOnlyFn(
        "presence-tracker",
        "can-check-in",
        [Cl.principal(wallet1)],
        wallet1
      );
      
      expect(canCheckIn2.result).toBeOk(Cl.bool(false));
    });
  });
});

describe("Presence Badges NFT Tests", () => {
  
  it("allows authorized minter to mint badges", () => {
    // Set presence-tracker as authorized minter
    simnet.callPublicFn(
      "presence-badges",
      "set-authorized-minter",
      [Cl.principal(`${deployer}.presence-tracker`)],
      deployer
    );
    
    // Mint via claim-badge (which calls presence-badges.mint internally)
    // First, simulate eligibility
    for (let i = 0; i < 7; i++) {
      simnet.callPublicFn("presence-tracker", "check-in", [], wallet1);
      simnet.mineEmptyBlocks(150);
    }
    
    const result = simnet.callPublicFn(
      "presence-tracker",
      "claim-badge",
      [Cl.uint(1)],
      wallet1
    );
    
    expect(result.result).toHaveClarityType(ClarityType.ResponseOk);
  });
  
  it("returns correct last token ID", () => {
    const lastId = simnet.callReadOnlyFn(
      "presence-badges",
      "get-last-token-id",
      [],
      wallet1
    );
    
    expect(lastId.result).toBeOk(Cl.uint(0));
  });
  
  it("returns correct badge name", () => {
    const name = simnet.callReadOnlyFn(
      "presence-badges",
      "get-badge-name",
      [Cl.uint(1)],
      wallet1
    );
    
    expect(name.result).toBeOk(Cl.stringAscii("Week Warrior"));
  });
});
