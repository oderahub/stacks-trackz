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

;; ============================================
;; DATA STORAGE
;; ============================================

;; User stats map
(define-map user-stats principal
  {
    last-check-in: uint,      ;; Block height of last check-in
    current-streak: uint,     ;; Current consecutive days
    longest-streak: uint,     ;; Best streak achieved
    total-check-ins: uint,    ;; Total check-ins ever
    total-likes: uint,        ;; Total likes logged
    total-comments: uint      ;; Total comments logged
  }
)

;; Track claimed badges per user
(define-map user-badges
  { user: principal, badge-type: uint }
  bool
)

;; Global stats
(define-data-var total-users uint u0)
(define-data-var total-check-ins uint u0)

;; Badge contract reference (set after deployment)
(define-data-var badge-contract principal CONTRACT_OWNER)

;; ============================================
;; ADMIN FUNCTIONS
;; ============================================

;; Set the badge contract address (call after deploying both contracts)
(define-public (set-badge-contract (contract-address principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) (err u100))
    (var-set badge-contract contract-address)
    (ok true)
  )
)

;; ============================================
;; CORE FUNCTIONS
;; ============================================

;; Daily check-in function
(define-public (check-in)
  (let
    (
      (caller tx-sender)
      (current-block block-height)
      (existing-stats (map-get? user-stats caller))
    )
    (match existing-stats
      ;; User exists - update streak
      stats
        (let
          (
            (last-check-in (get last-check-in stats))
            (blocks-since-last (- current-block last-check-in))
            (current-streak (get current-streak stats))
          )
          ;; Check if already checked in today (within same day window)
          (asserts! (>= blocks-since-last BLOCKS_PER_DAY) ERR_ALREADY_CHECKED_IN)

          ;; Calculate new streak
          (let
            (
              (new-streak
                (if (<= blocks-since-last (* BLOCKS_PER_DAY u2))
                  ;; Checked in within ~48 hours - continue streak
                  (+ current-streak u1)
                  ;; Streak broken - reset
                  u1
                )
              )
              (new-longest (if (> new-streak (get longest-streak stats))
                new-streak
                (get longest-streak stats)
              ))
            )
            ;; Update user stats
            (map-set user-stats caller {
              last-check-in: current-block,
              current-streak: new-streak,
              longest-streak: new-longest,
              total-check-ins: (+ (get total-check-ins stats) u1),
              total-likes: (get total-likes stats),
              total-comments: (get total-comments stats)
            })
            ;; Update global stats
            (var-set total-check-ins (+ (var-get total-check-ins) u1))
            ;; Emit event
            (print {
              event: "check-in",
              user: caller,
              streak: new-streak,
              total-check-ins: (+ (get total-check-ins stats) u1),
              block-height: current-block
            })
            (ok {
              streak: new-streak,
              total-check-ins: (+ (get total-check-ins stats) u1)
            })
          )
        )
      ;; New user - initialize
      (begin
        (map-set user-stats caller {
          last-check-in: current-block,
          current-streak: u1,
          longest-streak: u1,
          total-check-ins: u1,
          total-likes: u0,
          total-comments: u0
        })
        ;; Update global stats
        (var-set total-users (+ (var-get total-users) u1))
        (var-set total-check-ins (+ (var-get total-check-ins) u1))
        ;; Emit event
        (print {
          event: "new-user-check-in",
          user: caller,
          streak: u1,
          block-height: current-block
        })
        (ok { streak: u1, total-check-ins: u1 })
      )
    )
  )
)

;; Log likes activity
(define-public (log-likes (count uint))
  (let
    (
      (caller tx-sender)
      (existing-stats (map-get? user-stats caller))
    )
    (match existing-stats
      stats
        (begin
          (map-set user-stats caller (merge stats {
            total-likes: (+ (get total-likes stats) count)
          }))
          (print {
            event: "likes-logged",
            user: caller,
            count: count,
            new-total: (+ (get total-likes stats) count)
          })
          (ok (+ (get total-likes stats) count))
        )
      ERR_USER_NOT_FOUND
    )
  )
)

;; Log comments activity
(define-public (log-comments (count uint))
  (let
    (
      (caller tx-sender)
      (existing-stats (map-get? user-stats caller))
    )
    (match existing-stats
      stats
        (begin
          (map-set user-stats caller (merge stats {
            total-comments: (+ (get total-comments stats) count)
          }))
          (print {
            event: "comments-logged",
            user: caller,
            count: count,
            new-total: (+ (get total-comments stats) count)
          })
          (ok (+ (get total-comments stats) count))
        )
      ERR_USER_NOT_FOUND
    )
  )
)
