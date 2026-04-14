<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project
Simple MVP screensharing app.

Main goal:
- user opens app
- enters nickname
- one user can start screen sharing
- other users automatically see the stream

# Tech Stack
- Next.js
- React
- Tailwind CSS
- WebSocket for signaling
- WebRTC for screen streaming
- Docker for backend development

# Current Scope
Frontend first.
Do not build extra features unless requested.

For now:
- keep the app simple
- no authentication
- no database
- no TURN/SFU
- no cloud deployment setup yet

# Product Rules
- focus on functionality over UI polish
- keep UI minimal and clear
- only one active streamer at a time
- connected users should be visible in a sidebar
- nickname flow should be simple

# Frontend Rules
- use App Router
- prefer Server Components unless browser APIs require client components
- use Tailwind for styling
- avoid CSS modules unless explicitly requested
- keep components small and easy to read
- avoid overengineering

# WebRTC / Realtime Rules
- use `getDisplayMedia` for screen capture
- use `RTCPeerConnection` for peer connections
- use WebSocket only for signaling
- assume local P2P first
- keep signaling logic simple and explicit

# Backend Rules
When backend is added:
- use Node.js WebSocket server
- run backend in Docker
- use in-memory state only
- track connected users in memory
- track current active streamer in memory
- no database
- no authentication

# Code Style
- prefer clear code over clever code
- use TypeScript
- keep naming simple and descriptive
- add comments only when they help explain non-obvious logic

# Workflow
- make small incremental changes
- preserve working MVP behavior
- run lint after meaningful changes
- do not add unrelated dependencies without a reason

# Future Direction
Possible later improvements:
- Cloudflare Realtime for SFU/TURN
- move signaling server to cloud
- improve stream quality and stability
