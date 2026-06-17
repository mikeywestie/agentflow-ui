# AgentFlow UI

AgentFlow UI is the early MVP React dashboard for **AgentFlow**, an AI agent orchestration platform powered by `agentflow-api`.

The current UI focuses on proving the dashboard flow locally: viewing agents, workflows, executions, running a workflow, and inspecting the Planner -> Builder -> Reviewer trace.

## Current version

Documented state: **v0.4.0**

## Project status

This is an **early MVP UI**.

The backend is the current foundation of the project, while the UI is the next major improvement area. The goal is to keep the interface simple enough for local testing now, then improve the layout and styling with Tailwind CSS next.

## Tech stack

- React 18
- Vite 5
- React Router DOM
- Axios installed
- Browser `fetch` currently used in pages
- Inline styles for the current MVP
- Tailwind CSS planned next

## Current features

- Dashboard route at `/`
- Execution detail route at `/executions/:id`
- Shows summary counts for workflows, agents, and executions
- Lists existing agents
- Lists existing workflows and workflow steps
- Runs workflow executions against the backend
- Shows recent executions
- Links to execution details
- Displays execution status, request, agent trace, and final output
- Supports creating agents from the UI
- Supports creating workflows from selected enabled agents

## Current MVP routes

| Route | Page | Purpose |
|---|---|---|
| `/` | Dashboard | Main local dashboard for agents, workflows, and executions |
| `/executions/:id` | Execution Details | Inspect one execution and its agent trace |

## Backend dependency

The UI expects `agentflow-api` to be running locally.

Current API base URL:

```text
http://localhost:8080/api
```

This is currently hardcoded in the MVP pages and should be moved to an environment variable before deployment.

Planned improvement:

```text
VITE_API_BASE_URL=http://localhost:8080/api
```

## Local development setup

### Prerequisites

- Node.js
- npm
- Running `agentflow-api` backend
- Local PostgreSQL running through the backend Docker Compose setup

### Install dependencies

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Vite will usually serve the UI at:

```text
http://localhost:5173
```

## Recommended local startup order

1. Start PostgreSQL from `agentflow-api`.
2. Start `agentflow-api`.
3. Confirm Swagger loads at `http://localhost:8080/swagger-ui.html`.
4. Start `agentflow-ui`.
5. Open the Vite URL.
6. Run a workflow from the dashboard.
7. Open the execution detail page to review the agent trace.

## Current limitations

- UI is still an early MVP and needs visual polish.
- API URL is currently hardcoded.
- No login screen yet.
- JWT token handling is not wired into requests yet.
- Inline styles are used instead of Tailwind/CSS structure.
- No formal component library yet.
- Loading and empty states can be improved.
- Error handling is basic.
- No hosted deployment configuration yet.

## Up next

### UI improvements

- Add Tailwind CSS
- Create a stronger dashboard layout
- Add a proper sidebar/header structure
- Move repeated styles into reusable components
- Improve workflow execution form design
- Improve agent cards
- Improve workflow cards
- Improve recent execution list
- Improve execution trace layout
- Add loading, empty, and error states
- Move API base URL to `VITE_API_BASE_URL`

### Backend alignment

The UI should stay aligned with `agentflow-api` as the backend evolves. Upcoming backend work includes:

- Gemini -> OpenRouter -> Stub fallback provider chain
- `.env.example`
- Production security before hosting
- Role-based protection before hosting
- Deployment configuration notes

## Related project

Backend repository:

```text
mikeywestie/agentflow-api
```

## Portfolio note

AgentFlow UI demonstrates an early full-stack dashboard for managing AI agents, workflows, and execution traces. The current focus is functionality first, with visual and structural improvements planned next using Tailwind CSS.
