;; ============================================
;; CONSTANTS
;; ============================================

(define-constant CONTRACT_OWNER tx-sender)

;; Error codes
(define-constant ERR_ALREADY_CHECKED_IN (err u200))
(define-constant ERR_NOT_ELIGIBLE (err u201))
(define-constant ERR_BADGE_ALREADY_CLAIMED (err u202))
(define-constant ERR_INVALID_BADGE_TYPE (err u203))
(define-constant ERR_USER_NOT_FOUND (err u204))

;; Badge type constants (must match presence-badges contract)
(define-constant BADGE_WEEK_WARRIOR u1)
(define-constant BADGE_MONTHLY_MASTER u2)
(define-constant BADGE_CENTURY_CLUB u3)
(define-constant BADGE_CHATTERBOX u4)
(define-constant BADGE_LOVE_MACHINE u5)
(define-constant BADGE_OG_PRESENCE u6)

;; Badge requirements
(define-constant STREAK_WEEK u7)
(define-constant STREAK_MONTH u30)
(define-constant STREAK_CENTURY u100)
(define-constant COMMENTS_THRESHOLD u100)
(define-constant LIKES_THRESHOLD u500)
(define-constant CHECKINS_THRESHOLD u100)

;; Approximate blocks per day (Stacks ~10 min blocks = ~144 blocks/day)
(define-constant BLOCKS_PER_DAY u144)
