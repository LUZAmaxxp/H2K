# TODO

## Fixed Admin Login Issue
- [x] Updated `/api/user-profile` to check `isAdmin` field in better-auth user collection
- [x] Auto-create admin profile for users with `isAdmin: true`
- [x] Simplified dashboard redirect logic to rely on API

## Dockerization and Deployment
- [x] Created Dockerfile for Next.js production build
- [x] Created .dockerignore to exclude unnecessary files
- [x] Created vercel.json for Vercel Docker deployment
- [x] Built Docker image successfully
- [ ] Push code to GitHub repository
- [ ] Connect repository to Vercel and deploy
- [ ] Set environment variables in Vercel (e.g., MONGODB_URI)
- [ ] Test the deployed application

## Testing
- [ ] Test login with ayman.allouch@e-polytechnique.ma (should now access admin dashboard)
- [ ] Verify non-admin users still get redirected to sign-up
