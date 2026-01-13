- [x] Import useMemo from react in therapist dashboard
- [x] Memoize timeSlots with useMemo
- [x] Memoize getAppointmentForSlot with useCallback
- [x] Memoize stats with useMemo
- [ ] Test the dashboard to ensure no excessive re-renders

## Dockerization and Deployment
- [x] Created Dockerfile for Next.js production build
- [x] Created .dockerignore to exclude unnecessary files
- [x] Created vercel.json for Vercel Docker deployment
- [x] Built Docker image successfully
- [x] Created GitHub Actions workflow for CI/CD
- [ ] Push code to GitHub repository
- [ ] Set up GitHub secrets (GITHUB_TOKEN, VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID)
- [ ] Connect repository to Vercel and deploy
- [ ] Set environment variables in Vercel (e.g., MONGODB_URI)
- [ ] Test the deployed application
