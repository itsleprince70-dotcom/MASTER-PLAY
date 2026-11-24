# MASTER PLAY — Firestore Security Specification

## 1. Data Invariants
1. Every user document `/users/{userId}` MUST have `uid == request.auth.uid` on creation and `uid == userId`, and `uid` is immutable.
2. PII (`phoneNumber`, `email`) and financial balances (`balance`, `reservedBalance`) live strictly in `/users/{userId}/private/info`, readable/writable ONLY by the owner (`request.auth.uid == userId`) or an admin.
3. Users CANNOT self-assign `verified: true` or `certificationStatus: 'sètifye'` on `/users/{userId}`; only admins can modify certification fields.
4. User game progress `/users/{userId}/gameProgress/{gameId}` and transactions `/users/{userId}/transactions/{txId}` are owned by `userId` (`isOwner(userId) || isAdmin()`), and users cannot self-approve a pending transaction (`status: 'konfime'` on a deposit/withdrawal without admin) or tamper with another user's records.
5. Every post `/posts/{postId}` MUST have `authorUid == request.auth.uid` on creation, and `authorUid` is immutable. Only the author or an admin can edit/delete a post.
6. Every like `/posts/{postId}/likes/{userId}` and comment `/posts/{postId}/comments/{commentId}` MUST reference an existing parent `/posts/{postId}` and match `request.auth.uid`.
7. Every game score `/scores/{scoreId}` MUST have `uid == request.auth.uid` and `score >= 0`. Users cannot overwrite or delete another user's scores.
8. Competitions `/competitions/{competitionId}`, VS matches `/competitions/{competitionId}/matches/{matchId}`, and `/games/{gameId}` can only be created, modified, or deleted by admins (`isAdmin()`).
9. Notifications `/notifications/{notificationId}` are only readable (`get` and `list`) by the recipient (`resource.data.uid == request.auth.uid`) or an admin; recipients may only update the `read` field.
10. Admin audit logs `/adminAudit/{logId}` are readable and writable strictly by `isAdmin()`.
11. Default-deny catch-all `/{document=**}` blocks all unspecified paths.

## 2. The "Dirty Dozen" Attack Payloads
1. **Unauthenticated read of private PII**: `get /users/userA/private/info` without auth -> `PERMISSION_DENIED`.
2. **Cross-user PII snooping**: `get /users/userA/private/info` as `userB` -> `PERMISSION_DENIED`.
3. **Self-certification privilege escalation**: `update /users/userA` as `userA` with `{ verified: true, certificationStatus: "sètifye" }` -> `PERMISSION_DENIED`.
4. **Shadow field injection on user create**: `create /users/userA` with `{ uid: "userA", ..., isAdmin: true }` -> `PERMISSION_DENIED`.
5. **Identity spoofing on post create**: `create /posts/post1` as `userA` with `{ authorUid: "userB", ... }` -> `PERMISSION_DENIED`.
6. **Unauthorized post deletion**: `delete /posts/post1` (owned by `userA`) as `userB` -> `PERMISSION_DENIED`.
7. **ID Poisoning (oversized ID)**: `create /posts/<150-char-invalid-id!@#>` -> `PERMISSION_DENIED`.
8. **Client timestamp forgery**: `create /posts/post1` with `createdAt: "2020-01-01T00:00:00Z"` instead of `request.time` -> `PERMISSION_DENIED`.
9. **Orphaned comment write**: `create /posts/nonexistent_post/comments/c1` -> `PERMISSION_DENIED`.
10. **Blanket notification list scraping**: `list /notifications` without `where('uid', '==', request.auth.uid)` as `userA` -> `PERMISSION_DENIED`.
11. **Negative score injection**: `create /scores/s1` with `{ score: -500 }` -> `PERMISSION_DENIED`.
12. **Unauthorized competition/match/audit tampering**: `create /competitions/comp1` or `read /adminAudit/log1` as non-admin `userA` -> `PERMISSION_DENIED`.
