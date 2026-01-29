
(impl-trait 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait.nft-trait)

;; ============================================
;; CONSTANTS
;; ============================================

(define-constant CONTRACT_OWNER tx-sender)

;; Error codes
(define-constant ERR_NOT_AUTHORIZED (err u100))
(define-constant ERR_NOT_TOKEN_OWNER (err u101))
(define-constant ERR_TOKEN_NOT_FOUND (err u102))
(define-constant ERR_INVALID_BADGE_TYPE (err u103))

;; Badge type IDs
(define-constant BADGE_WEEK_WARRIOR u1)      ;; 7-day streak
(define-constant BADGE_MONTHLY_MASTER u2)    ;; 30-day streak
(define-constant BADGE_CENTURY_CLUB u3)      ;; 100-day streak
(define-constant BADGE_CHATTERBOX u4)        ;; 100 comments
(define-constant BADGE_LOVE_MACHINE u5)      ;; 500 likes
(define-constant BADGE_OG_PRESENCE u6)       ;; 100 check-ins
