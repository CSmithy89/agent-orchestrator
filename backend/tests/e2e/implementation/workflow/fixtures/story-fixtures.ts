/**
 * Realistic story fixtures for E2E tests
 * Covers: simple feature, complex multi-file, API integration, ambiguous requirements
 */

/**
 * Simple Feature Story: Single file change, <50 LOC
 * Tests basic workflow: context → implementation → tests → review → PR → merge
 */
export const simpleFeatureStory = `# Story 1.1: User Input Validation

---
id: 1-1-user-input-validation
title: User Input Validation
epic: epic-1
status: ready-for-dev
priority: high
estimate: 1
---

## Story

As a **Backend Service**,
I want **comprehensive input validation for user registration**,
so that **invalid data is rejected before processing**.

## Acceptance Criteria

### AC1: Email Validation
- [ ] Email format validated using regex
- [ ] Invalid emails rejected with clear error message
- [ ] Test coverage >80%

### AC2: Password Strength Validation
- [ ] Password minimum 8 characters
- [ ] Password requires uppercase, lowercase, number
- [ ] Weak passwords rejected with helpful message

## Tasks / Subtasks

- [ ] **Task 1: Implement email validation function** (AC: #1)
  - [ ] Create validateEmail() function in src/validation/email.ts
  - [ ] Use standard email regex pattern
  - [ ] Return validation result with error message
  - [ ] Write unit tests for valid/invalid emails

- [ ] **Task 2: Implement password strength validation** (AC: #2)
  - [ ] Create validatePassword() function in src/validation/password.ts
  - [ ] Check length, uppercase, lowercase, numbers
  - [ ] Return validation result with helpful message
  - [ ] Write unit tests for weak/strong passwords

## Dev Agent Record

### Context Reference

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
`;

/**
 * Complex Story: Multiple files, database migration, >200 LOC
 * Tests complex workflow with multiple components
 */
export const complexMultiFileStory = `# Story 2.1: RESTful API Endpoints for User Management

---
id: 2-1-user-management-api
title: User Management RESTful API
epic: epic-2
status: ready-for-dev
priority: high
estimate: 3
---

## Story

As a **Frontend Application**,
I want **complete RESTful API endpoints for user management (CRUD operations)**,
so that **I can create, read, update, and delete user accounts**.

## Acceptance Criteria

### AC1: Create User Endpoint
- [ ] POST /api/users endpoint implemented
- [ ] Request validation (email, password, name)
- [ ] User created in database
- [ ] Returns 201 with user object (excluding password)
- [ ] Database migration for users table

### AC2: Get User Endpoint
- [ ] GET /api/users/:id endpoint implemented
- [ ] Returns 200 with user object
- [ ] Returns 404 if user not found
- [ ] Password excluded from response

### AC3: Update User Endpoint
- [ ] PUT /api/users/:id endpoint implemented
- [ ] Partial updates supported
- [ ] Email uniqueness validated
- [ ] Returns 200 with updated user

### AC4: Delete User Endpoint
- [ ] DELETE /api/users/:id endpoint implemented
- [ ] Soft delete implemented (deleted_at timestamp)
- [ ] Returns 204 on success
- [ ] Returns 404 if user not found

### AC5: Comprehensive Testing
- [ ] Unit tests for controller methods
- [ ] Integration tests for all endpoints
- [ ] Test coverage >80%

## Tasks / Subtasks

- [ ] **Task 1: Create database migration for users table** (AC: #1, #4)
  - [ ] Create migration file db/migrations/001_create_users_table.sql
  - [ ] Define users table schema (id, email, password, name, created_at, updated_at, deleted_at)
  - [ ] Add unique index on email

- [ ] **Task 2: Implement User model** (AC: #1-4)
  - [ ] Create src/models/User.ts with TypeScript types
  - [ ] Define UserCreate, UserUpdate, UserResponse types
  - [ ] Implement toResponse() to exclude password

- [ ] **Task 3: Implement User repository** (AC: #1-4)
  - [ ] Create src/repositories/UserRepository.ts
  - [ ] Implement create(), findById(), update(), delete() methods
  - [ ] Use parameterized queries for SQL injection prevention

- [ ] **Task 4: Implement User controller** (AC: #1-4)
  - [ ] Create src/controllers/UserController.ts
  - [ ] Implement createUser(), getUser(), updateUser(), deleteUser()
  - [ ] Add request validation and error handling

- [ ] **Task 5: Define API routes** (AC: #1-4)
  - [ ] Create src/routes/users.ts
  - [ ] Define POST /api/users, GET /api/users/:id, PUT /api/users/:id, DELETE /api/users/:id
  - [ ] Register routes in main app

- [ ] **Task 6: Write comprehensive tests** (AC: #5)
  - [ ] Unit tests for UserRepository
  - [ ] Unit tests for UserController
  - [ ] Integration tests for all endpoints
  - [ ] Test error cases (404, validation errors, duplicate email)

## Dev Agent Record

### Context Reference

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
`;

/**
 * API Integration Story: External API client integration
 * Tests external dependency handling and security
 */
export const apiIntegrationStory = `# Story 3.1: Stripe Payment Integration

---
id: 3-1-stripe-payment-integration
title: Stripe Payment Gateway Integration
epic: epic-3
status: ready-for-dev
priority: high
estimate: 2
---

## Story

As a **E-commerce Service**,
I want **Stripe payment gateway integration for processing payments**,
so that **customers can securely purchase products using credit cards**.

## Acceptance Criteria

### AC1: Stripe Client Configuration
- [ ] Stripe API client configured with API key from environment
- [ ] API key never hardcoded in source code
- [ ] API key validated on startup
- [ ] Error handling for missing/invalid API key

### AC2: Create Payment Intent Endpoint
- [ ] POST /api/payments/intent endpoint implemented
- [ ] Creates Stripe PaymentIntent with amount and currency
- [ ] Returns client secret for frontend
- [ ] Error handling for Stripe API failures

### AC3: Confirm Payment Endpoint
- [ ] POST /api/payments/confirm endpoint implemented
- [ ] Confirms payment using payment intent ID
- [ ] Updates order status on successful payment
- [ ] Returns payment result with status

### AC4: Webhook Handler for Payment Events
- [ ] POST /api/webhooks/stripe endpoint implemented
- [ ] Validates webhook signature
- [ ] Handles payment_intent.succeeded event
- [ ] Updates database on successful payment

### AC5: Testing with Mocks
- [ ] Unit tests mock Stripe API calls
- [ ] Integration tests use Stripe test fixtures
- [ ] Tests cover success and failure scenarios
- [ ] Security review validates API key handling
- [ ] Test coverage >80%

## Tasks / Subtasks

- [ ] **Task 1: Configure Stripe client** (AC: #1)
  - [ ] Create src/integrations/stripe/StripeClient.ts
  - [ ] Load API key from process.env.STRIPE_API_KEY
  - [ ] Initialize Stripe client with API version
  - [ ] Add startup validation for API key

- [ ] **Task 2: Implement payment intent creation** (AC: #2)
  - [ ] Create src/services/PaymentService.ts
  - [ ] Implement createPaymentIntent(amount, currency)
  - [ ] Call Stripe API to create payment intent
  - [ ] Error handling for API failures

- [ ] **Task 3: Implement payment confirmation** (AC: #3)
  - [ ] Add confirmPayment(paymentIntentId) to PaymentService
  - [ ] Retrieve payment intent from Stripe
  - [ ] Update order status in database
  - [ ] Return payment result

- [ ] **Task 4: Implement webhook handler** (AC: #4)
  - [ ] Create src/controllers/StripeWebhookController.ts
  - [ ] Validate webhook signature using Stripe
  - [ ] Handle payment_intent.succeeded event
  - [ ] Update order in database

- [ ] **Task 5: Define payment routes** (AC: #2-4)
  - [ ] Create src/routes/payments.ts
  - [ ] Define POST /api/payments/intent, POST /api/payments/confirm
  - [ ] Create src/routes/webhooks.ts for POST /api/webhooks/stripe

- [ ] **Task 6: Write tests with Stripe mocks** (AC: #5)
  - [ ] Unit tests for PaymentService with mocked Stripe client
  - [ ] Integration tests for payment endpoints with test fixtures
  - [ ] Tests for webhook signature validation
  - [ ] Security tests for API key handling

## Dev Agent Record

### Context Reference

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
`;

/**
 * Ambiguous Requirements Story: Triggers human escalation
 * Tests low confidence or critical issues escalation
 */
export const ambiguousRequirementsStory = `# Story 4.1: Advanced Recommendation Algorithm

---
id: 4-1-recommendation-algorithm
title: Advanced Product Recommendation Engine
epic: epic-4
status: ready-for-dev
priority: medium
estimate: 3
---

## Story

As a **E-commerce Platform**,
I want **an intelligent product recommendation algorithm**,
so that **users see personalized product suggestions based on their behavior**.

## Acceptance Criteria

### AC1: Recommendation Algorithm Implementation
- [ ] Algorithm analyzes user purchase history
- [ ] Algorithm considers browsing behavior
- [ ] Algorithm weights recent activity higher
- [ ] "Smart" scoring mechanism for relevance

### AC2: Real-time Recommendation Generation
- [ ] GET /api/recommendations/:userId endpoint
- [ ] Returns top 10 recommended products
- [ ] Response time <500ms for good UX
- [ ] Recommendations refresh based on user activity

### AC3: Performance and Quality
- [ ] Recommendation quality meets business expectations
- [ ] Algorithm handles edge cases gracefully
- [ ] Test coverage for core logic

## Tasks / Subtasks

- [ ] **Task 1: Design recommendation algorithm** (AC: #1)
  - [ ] Research collaborative filtering approaches
  - [ ] Define scoring formula (unclear - needs clarification)
  - [ ] Determine weighting factors for recency
  - [ ] Handle cold start problem for new users

- [ ] **Task 2: Implement recommendation engine** (AC: #1-2)
  - [ ] Create src/services/RecommendationEngine.ts
  - [ ] Implement scoring algorithm (details ambiguous)
  - [ ] Optimize for <500ms response time
  - [ ] Cache recommendations

- [ ] **Task 3: Create recommendation endpoint** (AC: #2)
  - [ ] Implement GET /api/recommendations/:userId
  - [ ] Fetch user history and behavior data
  - [ ] Generate recommendations using engine
  - [ ] Return top 10 products

- [ ] **Task 4: Testing and validation** (AC: #3)
  - [ ] Unit tests for recommendation engine
  - [ ] Integration tests for endpoint
  - [ ] Performance tests for response time
  - [ ] Manual testing for recommendation quality

## Dev Notes

**Ambiguity Warning**: This story has vague requirements that may trigger escalation:
- "Smart" scoring mechanism is not well-defined
- Business expectations for quality are unclear
- Algorithm design choices require product owner input
- May require human review for algorithm validation

## Dev Agent Record

### Context Reference

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
`;

/**
 * Story Fixtures for Dependency Chain Testing
 */
export const dependencyStoryA = `# Story 5.1: Base Authentication Service

---
id: 5-1-base-auth-service
title: Base Authentication Service
epic: epic-5
status: ready-for-dev
priority: high
estimate: 2
---

## Story

As a **Backend Application**,
I want **a base authentication service with JWT token generation**,
so that **other services can authenticate users**.

## Acceptance Criteria

### AC1: JWT Token Generation
- [ ] generateToken(userId, email) creates JWT
- [ ] Token includes user ID and email in payload
- [ ] Token expires in 24 hours
- [ ] Secret key loaded from environment

### AC2: Token Verification
- [ ] verifyToken(token) validates JWT
- [ ] Returns decoded payload on success
- [ ] Throws error for invalid/expired tokens

## Tasks / Subtasks

- [ ] **Task 1: Implement AuthService** (AC: #1-2)
  - [ ] Create src/services/AuthService.ts
  - [ ] Implement generateToken() using jsonwebtoken
  - [ ] Implement verifyToken() with error handling
  - [ ] Load JWT_SECRET from environment

- [ ] **Task 2: Write tests** (AC: #1-2)
  - [ ] Unit tests for token generation
  - [ ] Unit tests for token verification
  - [ ] Test expired token handling

## Dev Agent Record

### Context Reference

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
`;

export const dependencyStoryB = `# Story 5.2: Protected API Endpoints

---
id: 5-2-protected-endpoints
title: Protected API Endpoints with JWT Middleware
epic: epic-5
status: drafted
priority: high
estimate: 2
dependencies:
  - 5-1-base-auth-service
---

## Story

As a **API Developer**,
I want **JWT middleware for protecting API endpoints**,
so that **only authenticated users can access protected resources**.

## Acceptance Criteria

### AC1: Authentication Middleware
- [ ] Middleware extracts JWT from Authorization header
- [ ] Middleware verifies token using AuthService
- [ ] Middleware attaches user to request object
- [ ] Middleware returns 401 for missing/invalid token

### AC2: Protected Endpoint Example
- [ ] GET /api/profile endpoint requires authentication
- [ ] Returns current user's profile
- [ ] Returns 401 if not authenticated

## Tasks / Subtasks

- [ ] **Task 1: Implement auth middleware** (AC: #1)
  - [ ] Create src/middleware/authMiddleware.ts
  - [ ] Extract token from "Bearer <token>" header
  - [ ] Call AuthService.verifyToken()
  - [ ] Attach decoded user to req.user

- [ ] **Task 2: Create protected endpoint** (AC: #2)
  - [ ] Create GET /api/profile route
  - [ ] Apply authMiddleware to route
  - [ ] Return user profile from req.user

- [ ] **Task 3: Write tests** (AC: #1-2)
  - [ ] Unit tests for middleware
  - [ ] Integration tests for protected endpoint
  - [ ] Test 401 for missing/invalid token

## Dev Agent Record

### Context Reference

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
`;

/**
 * Story Fixtures for Parallel Execution Testing (3 independent stories)
 */
export const parallelStory1 = `# Story 6.1: Logging Service

---
id: 6-1-logging-service
title: Structured Logging Service
epic: epic-6
status: ready-for-dev
priority: medium
estimate: 1
---

## Story

As a **Backend Developer**,
I want **structured logging for application events**,
so that **logs are searchable and analyzable**.

## Acceptance Criteria

### AC1: Logger Implementation
- [ ] Logger supports info, warn, error levels
- [ ] Logs include timestamp, level, message, metadata
- [ ] Logs output as JSON for parsing

## Tasks / Subtasks

- [ ] **Task 1: Implement Logger** (AC: #1)
  - [ ] Create src/utils/logger.ts
  - [ ] Implement log(), info(), warn(), error()
  - [ ] Format logs as JSON

- [ ] **Task 2: Write tests** (AC: #1)
  - [ ] Unit tests for all log levels

## Dev Agent Record

### File List
`;

export const parallelStory2 = `# Story 6.2: Email Service

---
id: 6-2-email-service
title: Email Notification Service
epic: epic-6
status: ready-for-dev
priority: medium
estimate: 1
---

## Story

As a **Backend Application**,
I want **email sending service using SMTP**,
so that **users receive email notifications**.

## Acceptance Criteria

### AC1: Email Sender
- [ ] sendEmail(to, subject, body) sends email
- [ ] Uses nodemailer with SMTP config
- [ ] Error handling for send failures

## Tasks / Subtasks

- [ ] **Task 1: Implement EmailService** (AC: #1)
  - [ ] Create src/services/EmailService.ts
  - [ ] Configure nodemailer transport
  - [ ] Implement sendEmail()

- [ ] **Task 2: Write tests** (AC: #1)
  - [ ] Unit tests with mocked SMTP

## Dev Agent Record

### File List
`;

export const parallelStory3 = `# Story 6.3: Health Check Endpoint

---
id: 6-3-health-check
title: Application Health Check Endpoint
epic: epic-6
status: ready-for-dev
priority: low
estimate: 1
---

## Story

As a **DevOps Engineer**,
I want **health check endpoint for monitoring**,
so that **I can verify application status**.

## Acceptance Criteria

### AC1: Health Check Endpoint
- [ ] GET /health returns 200 OK
- [ ] Response includes status and uptime
- [ ] Response format is JSON

## Tasks / Subtasks

- [ ] **Task 1: Implement health check** (AC: #1)
  - [ ] Create src/routes/health.ts
  - [ ] Return { status: "healthy", uptime: process.uptime() }

- [ ] **Task 2: Write tests** (AC: #1)
  - [ ] Integration test for GET /health

## Dev Agent Record

### File List
`;
