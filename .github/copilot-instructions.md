# Repository Instructions

## Project Context

- This is a personal educational pet project named `Migraine Journal BE`.
- The main goal is to deepen backend development skills through practical implementation.
- The first product milestone is an authentication service with login functionality that will later be consumed by a frontend application.
- The repository is expected to evolve incrementally. Do not introduce production-scale complexity before it is justified by the current learning goal.

## Communication and Teaching

- Always communicate with the user in Ukrainian.
- Keep configuration files, code comments, documentation intended for the repository, and generated technical artifacts in English unless the user explicitly asks otherwise.
- The user is learning backend development. Explain unfamiliar concepts, framework conventions, trade-offs, and the reasons behind implementation decisions in Ukrainian.
- Prefer clear, incremental changes. When introducing a new concept, briefly explain what it does, why it is needed, and how it fits into the existing architecture.
- Do not hide important behavior behind abstractions without explaining them.
- Ask a focused clarifying question only when a decision materially affects the implementation; otherwise choose a reasonable default and state the assumption.

## Technology Direction

- Runtime and primary language: Node.js with TypeScript where appropriate.
- Backend framework: NestJS.
- NestJS concepts to practice: modules, controllers, services, DTOs, dependency injection, pipes, validation, and configuration.
- Validation: Zod, integrated with NestJS in a clear and maintainable way.
- Database: PostgreSQL.
- ORM: Prefer Prisma unless the project context gives a strong reason to choose Drizzle. Explain the trade-off before changing this decision.
- The user specifically wants to understand Node.js more deeply, so explain relevant runtime concepts such as the event loop, asynchronous I/O, promises, error propagation, process configuration, and graceful shutdown when they are encountered.

## Engineering Guidelines

- Follow NestJS conventions and keep responsibilities separated between modules, controllers, services, DTOs, validation, and persistence.
- Start with a simple, explicit architecture that is easy to debug and learn from.
- Keep authentication security-minded from the beginning: never hard-code secrets, never log passwords or tokens, validate input, hash passwords with an appropriate password-hashing algorithm, and make token/session decisions explicit.
- Use environment variables for secrets, database URLs, ports, and other environment-specific configuration. Provide safe examples without real credentials.
- Prefer structured error handling and predictable HTTP responses.
- Add focused tests for important behavior as features are implemented. Explain what each test protects.
- Use existing project conventions when they exist. Avoid unrelated refactors, speculative abstractions, and unnecessary dependencies.
- Keep public APIs and database changes deliberate. Explain migrations and schema decisions before applying them.
- Use English names for files, directories, symbols, database models, API routes, and code-level messages unless an existing convention requires otherwise.

## Development Workflow

- Before editing, inspect the nearest relevant code path and state a short hypothesis about the change.
- Make the smallest coherent change that tests that hypothesis.
- After each substantive edit, run the narrowest relevant validation first: a focused test, typecheck, lint, or build command.
- Do not claim a command passed unless it was actually run.
- When a command cannot be run because the project is not initialized yet, say so clearly and suggest the next concrete setup step.
- Keep changes scoped to the user's current request and preserve unrelated work in the repository.

## Initial Milestone: Authentication Service

The initial implementation should be developed in small learning-oriented steps:

1. Establish the NestJS application structure and configuration.
2. Connect PostgreSQL and introduce the chosen ORM with a clear schema and migration workflow.
3. Define authentication boundaries, DTOs, validation, and error behavior.
4. Implement registration and login safely, including password hashing.
5. Add token or session handling with an explicit explanation of the security and architectural choice.
6. Add focused tests and document how to run the service locally.

Do not implement all milestone steps automatically. Wait for the user's next development request and work incrementally.
