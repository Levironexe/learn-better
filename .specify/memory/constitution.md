<!--
  SYNC IMPACT REPORT
  Version change: 1.0.0 → 2.0.0 (MAJOR: all three core principles redefined;
    development scope fundamentally reversed from recreational to production-grade)
  Modified principles:
    I. "Simplicity First" → "Production Quality"
    II. "It Must Work" → "Scalability by Design"
    III. "No Production Concerns" → "Industry Best Practices"
  Removed sections: "No Production Concerns" (concept eliminated entirely)
  Added sections: updated Development Scope (production requirements now explicit)
  Templates requiring updates:
    ✅ .specify/memory/constitution.md — this file
    ✅ .specify/templates/tasks-template.md — updated "Tests are OPTIONAL" → REQUIRED per constitution
    ✅ .specify/templates/plan-template.md — updated Complexity Tracking note to reflect new context
    ✅ .specify/templates/spec-template.md — no structural changes required; success criteria examples
       already reference production metrics (concurrency, latency)
  Follow-up TODOs: none
-->

# learn-better Constitution

## Core Principles

### I. Production Quality

Every feature MUST be production-grade.
Proper error handling, structured logging, input validation at system boundaries,
and defensive coding are non-negotiable — not optional polish.
Visual and UX quality MUST meet the same bar as functional correctness.
Code that works locally but is fragile, unobservable, or insecure is
considered incomplete.

### II. Scalability by Design

Architecture MUST anticipate growth from the first implementation.
Data models, API contracts, caching strategies, and infrastructure decisions
MUST support horizontal scaling without requiring structural rewrites.
Shortcuts that create scale ceilings (e.g., in-process state, synchronous
fan-out, unindexed queries) MUST be explicitly justified and tracked as
known technical debt.

### III. Industry Best Practices

Code MUST follow established software engineering standards:
clean architecture, separation of concerns, and SOLID principles where applicable.
Security, observability, and operational readiness are first-class concerns,
not afterthoughts.
Authentication, authorization, rate limiting, and input sanitization MUST
be implemented for any feature that exposes user-facing or data-modifying surfaces.
Meaningful test coverage (unit tests for business logic, integration tests for
critical paths) is REQUIRED — not optional.

## Development Scope

This is a production-grade Next.js 15 web application. All work MUST meet
production readiness standards:

- **Authentication & Authorization**: REQUIRED for any user-facing or
  data-modifying surface
- **Security**: Input validation, output encoding, rate limiting, and secure
  defaults are IN SCOPE and non-negotiable
- **Observability**: Structured logging and error tracking MUST be in place
  before a feature is considered done
- **Testing**: Unit tests for business logic and integration tests for critical
  paths are REQUIRED; end-to-end tests are recommended for P1 user stories
- **Deployment readiness**: Code MUST be deployable to a production environment;
  CI/CD pipeline configuration is expected
- **External integrations**: MUST follow vendor best practices and include
  appropriate error handling, retries, and circuit-breaking where applicable

## Governance

This constitution supersedes all other project practices.
Amendments MUST be reviewed against all dependent templates and artifacts
before ratification. Any change that contradicts an active principle requires
a MAJOR version bump and explicit justification.

Versioning policy:

- **MAJOR**: Removal, replacement, or backward-incompatible redefinition of
  an existing principle
- **MINOR**: New principle or section added, or materially expanded guidance
- **PATCH**: Clarifications, wording fixes, or non-semantic refinements

**Version**: 2.0.0 | **Ratified**: 2026-03-18 | **Last Amended**: 2026-03-19
