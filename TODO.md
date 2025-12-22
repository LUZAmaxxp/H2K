# TODO

## Fixed Admin Login Issue
- [x] Updated `/api/user-profile` to check `isAdmin` field in better-auth user collection
- [x] Auto-create admin profile for users with `isAdmin: true`
- [x] Simplified dashboard redirect logic to rely on API

## Testing
- [ ] Test login with ayman.allouch@e-polytechnique.ma (should now access admin dashboard)
- [ ] Verify non-admin users still get redirected to sign-up
