
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

;; Base URI for metadata (can be updated by owner)
(define-data-var base-uri (string-ascii 256) "https://presence-protocol.app/metadata/")

;; ============================================
;; NFT DEFINITION
;; ============================================

(define-non-fungible-token presence-badge uint)

;; ============================================
;; DATA STORAGE
;; ============================================

;; Track last token ID
(define-data-var last-token-id uint u0)

;; Map token ID to badge type
(define-map token-badge-type uint uint)

;; Map token ID to minted timestamp (block height)
(define-map token-mint-time uint uint)

;; Authorized minter (presence-tracker contract)
(define-data-var authorized-minter principal CONTRACT_OWNER)

;; ============================================
;; AUTHORIZATION
;; ============================================

;; Set the authorized minter (only presence-tracker contract should mint)
(define-public (set-authorized-minter (new-minter principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_NOT_AUTHORIZED)
    (var-set authorized-minter new-minter)
    (ok true)
  )
)

;; ============================================
;; SIP-009 REQUIRED FUNCTIONS
;; ============================================

;; Get last token ID
(define-read-only (get-last-token-id)
  (ok (var-get last-token-id))
)

;; Get token URI - returns metadata URL for the badge
(define-read-only (get-token-uri (token-id uint))
  (let ((badge-type (default-to u0 (map-get? token-badge-type token-id))))
    (ok (some (concat (var-get base-uri) (uint-to-ascii badge-type))))
  )
)

;; Get owner of token
(define-read-only (get-owner (token-id uint))
  (ok (nft-get-owner? presence-badge token-id))
)

;; Transfer token
(define-public (transfer (token-id uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-eq contract-caller sender) ERR_NOT_TOKEN_OWNER)
    (asserts! (is-some (nft-get-owner? presence-badge token-id)) ERR_TOKEN_NOT_FOUND)
    (nft-transfer? presence-badge token-id sender recipient)
  )
)

;; ============================================
;; HELPER FUNCTIONS
;; ============================================

;; Convert uint to ASCII string (for URI construction)
(define-read-only (uint-to-ascii (value uint))
  (if (<= value u9)
    (unwrap-panic (element-at "0123456789" value))
    "0"
  )
)
