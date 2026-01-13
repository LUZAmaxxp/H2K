# GitHub Actions Workflow for Docker Deployment to Vercel

This workflow automates the process of building a Docker image for the Next.js application, pushing it to GitHub Container Registry, and deploying it to Vercel.

## Workflow Triggers

- **Push to main branch**: Triggers full build, push, and deployment
- **Pull Request to main branch**: Triggers build and push only (no deployment)

## Workflow Steps

1. **Checkout code**: Gets the latest code from the repository
2. **Set up Docker Buildx**: Enables advanced Docker build features
3. **Login to GitHub Container Registry**: Authenticates with GHCR using GITHUB_TOKEN
4. **Extract metadata**: Generates appropriate tags for the Docker image
5. **Build and push Docker image**: Creates the Docker image and pushes it to GHCR
6. **Deploy to Vercel**: Only on main branch pushes, deploys the application using Vercel CLI

## Required Secrets

Set these secrets in your GitHub repository settings:

- `VERCEL_TOKEN`: Your Vercel authentication token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID

## How to Set Up Secrets

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each of the required secrets

## Vercel Configuration

Make sure your Vercel project is configured to use Docker:

1. In Vercel dashboard, go to your project settings
2. Under "Build & Development Settings", ensure Docker is selected as the build method
3. Set environment variables like `MONGODB_URI` in Vercel's environment variables section

## Image Tags

The workflow creates the following tags:
- `latest` (for main branch)
- Branch name (e.g., `main`)
- SHA-based tags (e.g., `main-abc123def`)

Images are stored in: `ghcr.io/{username}/{repository}`

## Manual Deployment

If you need to deploy manually, you can run the Vercel CLI locally:

```bash
npm install -g vercel
vercel --prod --yes
```

Make sure you have the `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` environment variables set.
