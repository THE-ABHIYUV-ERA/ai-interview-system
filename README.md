# AI Interview System

## Project Purpose
An intelligent interview system with an AI interviewer avatar.

## Technology Stack
- **Frontend**: Next.js + TypeScript + Tailwind CSS
- **Backend**: Django + Django REST Framework
- **Database**: PostgreSQL
- **Authentication**: Email/password + Google OAuth + GitHub OAuth
- **AI**: LLM API
- **Voice**: Browser Speech Recognition + Speech Synthesis
- **AI Avatar**: Animated AI interviewer avatar

## Planned Phase Roadmap
- Phase 0: Project + GitHub Setup
- Phase 1: Application Foundation
- Phase 2: Authentication
- Phase 3: Candidate Dashboard
- Phase 4: Resume System
- Phase 5: Interview Setup
- Phase 6: AI Question Engine
- Phase 7: Interview Room
- Phase 8: AI Avatar
- Phase 9: Voice Interview
- Phase 10: Answer Evaluation
- Phase 11: Adaptive Interview
- Phase 12: Final Report
- Phase 13: Analytics Dashboard
- Phase 14: Admin Panel
- Phase 15: Testing + Security
- Phase 16: Docker + Deployment

## Local Development Prerequisites
- Node.js (v18+)
- Python (3.10+)
- PostgreSQL
- Git

## Local OAuth Setup

To enable Google and GitHub authentication locally, you must configure OAuth applications with each provider.

### Google OAuth
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project and configure the OAuth consent screen.
3. Go to Credentials > Create Credentials > OAuth client ID.
4. Set Authorized JavaScript origins to http://localhost:3000.
5. Set Authorized redirect URIs to http://localhost:3000/auth/callback/google.
6. Copy the generated Client ID and Client Secret into your frontend and backend .env files respectively.

### GitHub OAuth
1. Go to your GitHub account Settings > Developer Settings > OAuth Apps.
2. Click "New OAuth App".
3. Set Homepage URL to http://localhost:3000.
4. Set Authorization callback URL to http://localhost:3000/auth/callback/github.
5. Generate a new Client Secret.
6. Copy the Client ID and Client Secret into your .env files.
