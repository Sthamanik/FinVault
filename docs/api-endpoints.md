# API Endpoints

## Base URL
```
http://localhost:5001/api/v1
```

## Authentication

Protected routes require a valid JWT access token sent as an HTTP-only cookie (`accessToken`):

Tokens are issued on login and stored as cookies automatically. On access token expiry, the middleware attempts refresh automatically using the refresh token cookie.

---

## Health Check

### GET /health

Check if the server is running.

**Auth required:** No

**Response 200:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-03-17T11:00:00.000Z"
}
```

---

## Admin

### POST /admin/login

Login as admin.

**Auth required:** No
**Rate limit:** 5 requests per 15 minutes

**Request body:**
```json
{
  "email": "admin@example.com",
  "password": "Admin@1234"
}
```

**Response 200:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Admin logged in successfully",
  "data": {
    "_id": "...",
    "email": "admin@example.com"
  }
}
```

**Response 401:**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

### POST /admin/logout

Logout admin and clear cookies.

**Auth required:** Yes

**Response 200:**
```json
{
  "success": true,
  "message": "Admin logged out successfully",
  "data": null
}
```

---

### GET /admin/me

Get current logged in admin.

**Auth required:** Yes

**Response 200:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "email": "admin@example.com",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### PATCH /admin/change-password

Change admin password.

**Auth required:** Yes

**Request body:**
```json
{
  "currentPassword": "OldPass@123",
  "newPassword": "NewPass@123"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": null
}
```

**Response 400:**
```json
{
  "success": false,
  "message": "Invalid old password"
}
```

---

## Dashboard

### GET /dashboard

Get admin dashboard summary.

**Auth required:** Yes

**Response 200:**
```json
{
  "success": true,
  "data": {
    "counts": {
      "blogs": 10,
      "services": 5,
      "team": 8,
      "rewards": 3,
      "contacts": 24,
      "careers": 4,
      "applications": 47
    },
    "recent": {
      "contacts": [...],
      "applications": [...]
    },
    "breakdowns": {
      "contacts": { "new": 10, "read": 8, "resolved": 6 },
      "applications": { "pending": 20, "reviewed": 15, "shortlisted": 8, "rejected": 4 }
    }
  }
}
```

---

## Blogs

### GET /blogs

Get all blogs with pagination.

**Auth required:** No
**Query params:** `page`, `limit`, `status`, `category`, `tag`, `search`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "blogs": [
      {
        "_id": "...",
        "title": "Market Trends",
        "slug": "market-trends",
        "content": "...",
        "author": "Admin",
        "status": "published",
        "tags": ["finance"],
        "category": "markets",
        "featuredImage": {
          "url": "https://r2.example.com/...",
          "public_id": "..."
        },
        "readTime": 3,
        "createdAt": "...",
        "updatedAt": "..."
      }
    ],
    "pagination": {
      "total": 10,
      "page": 1,
      "limit": 10,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

---

### GET /blogs/slug/:slug

Get a single blog by slug.

**Auth required:** No

**Response 200:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Response 404:**
```json
{
  "success": false,
  "message": "Blog not found"
}
```

---

### GET /blogs/:id

Get a single blog by ID.

**Auth required:** Yes

**Response 200:**
```json
{
  "success": true,
  "data": { ... }
}
```

---

### POST /blogs

Create a new blog.

**Auth required:** Yes
**Content-Type:** `multipart/form-data`

**Request fields:**
| Field | Type | Required |
|---|---|---|
| `title` | string | Yes |
| `content` | string | Yes |
| `author` | string | No (default: Admin) |
| `status` | `draft` \| `published` | No (default: `draft`) |
| `category` | string | No |
| `tags` | string[] | No |
| `metaTitle` | string | No |
| `metaDescription` | string | No |
| `featuredImage` | file (JPEG/PNG/WEBP) | No |

**Response 201:**
```json
{
  "success": true,
  "message": "Blog created successfully",
  "data": { ... }
}
```

---

### PATCH /blogs/:id

Update a blog.

**Auth required:** Yes
**Content-Type:** `multipart/form-data`

All fields optional — same as create.

**Response 200:**
```json
{
  "success": true,
  "message": "Blog updated successfully",
  "data": { ... }
}
```

---

### PATCH /blogs/:id/delete

Soft delete a blog.

**Auth required:** Yes

**Response 200:**
```json
{
  "success": true,
  "message": "Blog deleted successfully",
  "data": null
}
```

---

### PATCH /blogs/:id/restore

Restore a soft-deleted blog.

**Auth required:** Yes

**Response 200:**
```json
{
  "success": true,
  "message": "Blog restored successfully",
  "data": null
}
```

---

### DELETE /blogs/:id/hard-delete

Permanently delete a soft-deleted blog.

**Auth required:** Yes

**Response 200:**
```json
{
  "success": true,
  "message": "Blog deleted permanently",
  "data": null
}
```

---

## Services

### GET /services

Get all services with pagination.

**Auth required:** No
**Query params:** `page`, `limit`, `isActive`, `search`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "services": [
      {
        "_id": "...",
        "title": "Wealth Management",
        "slug": "wealth-management",
        "shortDescription": "...",
        "longDescription": "...",
        "ctaLink": "https://example.com",
        "investmentFocus": "Growth",
        "industriesPortfolio": ["Technology", "Finance & Banking"],
        "isActive": true,
        "order": 1,
        "image": { "url": "...", "public_id": "..." },
        "createdAt": "...",
        "updatedAt": "..."
      }
    ],
    "pagination": { ... }
  }
}
```

---

### GET /services/slug/:slug

Get a single service by slug.

**Auth required:** No

**Response 200:**
```json
{
  "success": true,
  "data": { ... }
}
```

---

### GET /services/:id

Get a single service by ID.

**Auth required:** Yes

**Response 200:**
```json
{
  "success": true,
  "data": { ... }
}
```

---

### POST /services

Create a new service.

**Auth required:** Yes
**Content-Type:** `multipart/form-data`

**Request fields:**
| Field | Type | Required |
|---|---|---|
| `title` | string | Yes |
| `shortDescription` | string | Yes |
| `longDescription` | string | No |
| `ctaLink` | string (URL) | No |
| `investmentFocus` | string | No |
| `industriesPortfolio` | string[] | No |
| `isActive` | boolean | No (default: `true`) |
| `order` | number | No (default: `0`) |
| `image` | file (JPEG/PNG/WEBP) | No |

Valid `industriesPortfolio` values: `Technology`, `Healthcare & Pharmaceuticals`, `Finance & Banking`, `Real Estate`, `Energy & Utilities`, `Consumer Goods & Retail`, `Infrastructure & Construction`, `Agriculture & Commodities`, `Manufacturing & Industrials`, `Telecommunications`

**Response 201:**
```json
{
  "success": true,
  "message": "Service created successfully",
  "data": { ... }
}
```

---

### PATCH /services/:id

Update a service.

**Auth required:** Yes
**Content-Type:** `multipart/form-data`

All fields optional.

**Response 200:**
```json
{
  "success": true,
  "message": "Service updated successfully",
  "data": { ... }
}
```

---

### PATCH /services/:id/delete

Soft delete a service.

**Auth required:** Yes

**Response 200:**
```json
{
  "success": true,
  "message": "Service deleted successfully",
  "data": null
}
```

---

### PATCH /services/:id/restore

Restore a soft-deleted service.

**Auth required:** Yes

**Response 200:**
```json
{
  "success": true,
  "message": "Service restored successfully",
  "data": null
}
```

---

### DELETE /services/:id/hard-delete

Permanently delete a soft-deleted service.

**Auth required:** Yes

**Response 200:**
```json
{
  "success": true,
  "message": "Service deleted permanently",
  "data": null
}
```

---

### PATCH /services/:id/toggle-active

Toggle a service's active status.

**Auth required:** Yes

**Response 200:**
```json
{
  "success": true,
  "message": "Service status toggled successfully",
  "data": {
    "_id": "...",
    "isActive": false,
    ...
  }
}
```

---

## Careers

### GET /careers

Get all job openings.

**Auth required:** No
**Query params:** `page`, `limit`, `isActive`, `search`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "careers": [
      {
        "_id": "...",
        "title": "Senior Analyst",
        "slug": "senior-analyst",
        "department": "Investment",
        "location": "NYC",
        "type": "full-time",
        "description": "...",
        "requirements": ["5+ years experience"],
        "openings": 2,
        "isActive": true,
        "createdAt": "...",
        "updatedAt": "..."
      }
    ],
    "pagination": { ... }
  }
}
```

---

### GET /careers/slug/:slug

Get a single job opening by slug.

**Auth required:** No

**Response 200:**
```json
{
  "success": true,
  "data": { ... }
}
```

---

### GET /careers/:id

Get a single job opening by ID.

**Auth required:** Yes

**Response 200:**
```json
{
  "success": true,
  "data": { ... }
}
```

---

### POST /careers

Create a new job opening.

**Auth required:** Yes

**Request body:**
```json
{
  "title": "Senior Analyst",
  "department": "Investment",
  "location": "NYC",
  "type": "full-time",
  "description": "Analyze markets and investments.",
  "requirements": ["Finance degree", "5+ years experience"],
  "openings": 2,
  "isActive": true
}
```

Valid `type` values: `full-time`, `part-time`, `contract`, `internship`

**Response 201:**
```json
{
  "success": true,
  "message": "Career created successfully",
  "data": { ... }
}
```

**Response 409:**
```json
{
  "success": false,
  "message": "Duplicate value on: title, department, location, type"
}
```

---

### PATCH /careers/:id

Update a job opening.

**Auth required:** Yes

All fields optional.

**Response 200:**
```json
{
  "success": true,
  "message": "Career updated successfully",
  "data": { ... }
}
```

---

### PATCH /careers/:id/delete

Soft delete a job opening.

**Auth required:** Yes

**Response 200:**
```json
{
  "success": true,
  "message": "Career deleted successfully",
  "data": null
}
```

---

### PATCH /careers/:id/restore

Restore a soft-deleted job opening.

**Auth required:** Yes

**Response 200:**
```json
{
  "success": true,
  "message": "Career restored successfully",
  "data": null
}
```

---

### DELETE /careers/:id/hard-delete

Permanently delete a soft-deleted job opening.

**Auth required:** Yes

**Response 200:**
```json
{
  "success": true,
  "message": "Career deleted permanently",
  "data": null
}
```

---

### PATCH /careers/:id/toggle-active

Toggle a job opening's active status.

**Auth required:** Yes

**Response 200:**
```json
{
  "success": true,
  "message": "Career status toggled successfully",
  "data": {
    "_id": "...",
    "isActive": false,
    ...
  }
}
```

---

## Applications

### POST /applications/:jobId

Submit a job application.

**Auth required:** No
**Content-Type:** `multipart/form-data`
**Rate limit:** 30 requests per hour

**Request fields:**
| Field | Type | Required |
|---|---|---|
| `name` | string | Yes |
| `email` | string (email) | Yes |
| `phone` | string | No |
| `coverLetter` | string (min 100 chars) | No |
| `resume` | file (PDF only) | Yes |
| `coverLetterFile` | file (PDF only) | No |

**Response 201:**
```json
{
  "success": true,
  "message": "Application submitted",
  "data": {
    "_id": "...",
    "jobId": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "status": "pending",
    "resume": { "url": "...", "public_id": "..." },
    "createdAt": "..."
  }
}
```

**Response 409:**
```json
{
  "success": false,
  "message": "Application already exists"
}
```

**Response 404:**
```json
{
  "success": false,
  "message": "Job not found"
}
```

---

### GET /applications

Get all applications.

**Auth required:** Yes
**Query params:** `page`, `limit`, `status`, `jobId`, `search`

Valid `status` values: `pending`, `reviewed`, `shortlisted`, `rejected`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "applications": [ ... ],
    "pagination": { ... }
  }
}
```

---

### GET /applications/:id

Get a single application by ID.

**Auth required:** Yes

**Response 200:**
```json
{
  "success": true,
  "data": { ... }
}
```

---

### PATCH /applications/:id/status

Update application status.

**Auth required:** Yes

**Request body:**
```json
{
  "status": "shortlisted"
}
```

Valid values: `pending`, `reviewed`, `shortlisted`, `rejected`

**Response 200:**
```json
{
  "success": true,
  "message": "Application status updated",
  "data": { ... }
}
```

---

### PATCH /applications/:id/delete

Soft delete an application.

**Auth required:** Yes

**Response 200:**
```json
{
  "success": true,
  "message": "Application deleted successfully",
  "data": null
}
```

---

### PATCH /applications/:id/restore

Restore a soft-deleted application.

**Auth required:** Yes

**Response 200:**
```json
{
  "success": true,
  "message": "Application restored successfully",
  "data": null
}
```

---

### DELETE /applications/:id/hard-delete

Permanently delete a soft-deleted application.

**Auth required:** Yes

**Response 200:**
```json
{
  "success": true,
  "message": "Application deleted permanently",
  "data": null
}
```

---

## Contacts

### POST /contacts

Submit a contact form.

**Auth required:** No
**Rate limit:** 30 requests per hour

**Request body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "subject": "General Inquiry",
  "message": "I would like to know more about your services."
}
```

Valid `subject` values: `Portfolio Management`, `Mutual Fund Advisory`, `Retirement Planning`, `Tax Planning`, `Wealth Management`, `Stock Market Advisory`, `General Inquiry`, `Partnership`

**Response 201:**
```json
{
  "success": true,
  "message": "Contact submitted successfully",
  "data": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "subject": "General Inquiry",
    "status": "new",
    "createdAt": "..."
  }
}
```

---

### GET /contacts

Get all contact submissions.

**Auth required:** Yes
**Query params:** `page`, `limit`, `status`, `search`

Valid `status` values: `new`, `read`, `resolved`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "contacts": [ ... ],
    "pagination": { ... }
  }
}
```

---

### GET /contacts/:id

Get a single contact by ID.

**Auth required:** Yes

**Response 200:**
```json
{
  "success": true,
  "data": { ... }
}
```

---

### PATCH /contacts/:id/status

Update contact status.

**Auth required:** Yes

**Request body:**
```json
{
  "status": "read"
}
```

Valid values: `new`, `read`, `resolved`

**Response 200:**
```json
{
  "success": true,
  "message": "Contact status updated",
  "data": { ... }
}
```

---

### PATCH /contacts/:id/delete

Soft delete a contact.

**Auth required:** Yes

**Response 200:**
```json
{
  "success": true,
  "message": "Contact deleted successfully",
  "data": null
}
```

---

### PATCH /contacts/:id/restore

Restore a soft-deleted contact.

**Auth required:** Yes

**Response 200:**
```json
{
  "success": true,
  "message": "Contact restored successfully",
  "data": null
}
```

---

### DELETE /contacts/:id/hard-delete

Permanently delete a soft-deleted contact.

**Auth required:** Yes

**Response 200:**
```json
{
  "success": true,
  "message": "Contact deleted permanently",
  "data": null
}
```

---

## Rewards

### GET /rewards

Get all rewards with pagination.

**Auth required:** No
**Query params:** `page`, `limit`, `search`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "rewards": [
      {
        "_id": "...",
        "title": "Best Fund Manager",
        "issuer": "Finance Awards",
        "description": "Awarded for top performance",
        "image": { "url": "...", "public_id": "..." },
        "credentialUrl": "https://example.com/credential",
        "issueDate": "2024-01-01T00:00:00.000Z",
        "createdAt": "...",
        "updatedAt": "..."
      }
    ],
    "pagination": { ... }
  }
}
```

---

### GET /rewards/:id

Get a single reward by ID.

**Auth required:** No

**Response 200:**
```json
{
  "success": true,
  "data": { ... }
}
```

---

### POST /rewards

Create a new reward.

**Auth required:** Yes
**Content-Type:** `multipart/form-data`

**Request fields:**
| Field | Type | Required |
|---|---|---|
| `title` | string | Yes |
| `issuer` | string | Yes |
| `description` | string | No |
| `credentialUrl` | string (URL) | No |
| `issueDate` | date | No |
| `image` | file (JPEG/PNG/WEBP) | No |

**Response 201:**
```json
{
  "success": true,
  "message": "Reward created successfully",
  "data": { ... }
}
```

---

### PATCH /rewards/:id

Update a reward.

**Auth required:** Yes
**Content-Type:** `multipart/form-data`

All fields optional.

**Response 200:**
```json
{
  "success": true,
  "message": "Reward updated successfully",
  "data": { ... }
}
```

---

### PATCH /rewards/:id/delete

Soft delete a reward.

**Auth required:** Yes

**Response 200:**
```json
{
  "success": true,
  "message": "Reward deleted successfully",
  "data": null
}
```

---

### PATCH /rewards/:id/restore

Restore a soft-deleted reward.

**Auth required:** Yes

**Response 200:**
```json
{
  "success": true,
  "message": "Reward restored successfully",
  "data": null
}
```

---

### DELETE /rewards/:id/hard-delete

Permanently delete a soft-deleted reward.

**Auth required:** Yes

**Response 200:**
```json
{
  "success": true,
  "message": "Reward deleted permanently",
  "data": null
}
```

---

## Teams

### GET /teams

Get all team members.

**Auth required:** No
**Query params:** `page`, `limit`, `isActive`, `search`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "teams": [
      {
        "_id": "...",
        "name": "Jordan Lee",
        "role": "Portfolio Manager",
        "bio": "Experienced in equities.",
        "profilePhoto": { "url": "...", "public_id": "..." },
        "socialLinks": {
          "linkedin": "https://linkedin.com/in/...",
          "twitter": "https://twitter.com/..."
        },
        "isActive": true,
        "order": 1,
        "createdAt": "...",
        "updatedAt": "..."
      }
    ],
    "pagination": { ... }
  }
}
```

---

### GET /teams/:id

Get a single team member by ID.

**Auth required:** No

**Response 200:**
```json
{
  "success": true,
  "data": { ... }
}
```

---

### POST /teams

Create a new team member.

**Auth required:** Yes
**Content-Type:** `multipart/form-data`

**Request fields:**
| Field | Type | Required |
|---|---|---|
| `name` | string | Yes |
| `role` | string | Yes |
| `phone` | string | Yes |
| `bio` | string | No |
| `socialLinks.linkedin` | string (URL) | No |
| `socialLinks.twitter` | string (URL) | No |
| `isActive` | boolean | No (default: `true`) |
| `order` | number | No (default: `0`) |
| `profilePhoto` | file (JPEG/PNG/WEBP) | No |

**Response 201:**
```json
{
  "success": true,
  "message": "Team member created successfully",
  "data": { ... }
}
```

---

### PATCH /teams/:id

Update a team member.

**Auth required:** Yes
**Content-Type:** `multipart/form-data`

All fields optional.

**Response 200:**
```json
{
  "success": true,
  "message": "Team member updated successfully",
  "data": { ... }
}
```

---

### PATCH /teams/:id/delete

Soft delete a team member.

**Auth required:** Yes

**Response 200:**
```json
{
  "success": true,
  "message": "Team member deleted successfully",
  "data": null
}
```

---

### PATCH /teams/:id/restore

Restore a soft-deleted team member.

**Auth required:** Yes

**Response 200:**
```json
{
  "success": true,
  "message": "Team member restored successfully",
  "data": null
}
```

---

### DELETE /teams/:id/hard-delete

Permanently delete a soft-deleted team member.

**Auth required:** Yes

**Response 200:**
```json
{
  "success": true,
  "message": "Team member deleted permanently",
  "data": null
}
```

---

### PATCH /teams/:id/toggle-active

Toggle a team member's active status.

**Auth required:** Yes

**Response 200:**
```json
{
  "success": true,
  "message": "Team status toggled successfully",
  "data": {
    "_id": "...",
    "isActive": false,
    ...
  }
}
```

---

## Common Error Responses

### 400 Validation Error
```json
{
  "statusCode": 400,
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email address" }
  ]
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "success": false,
  "message": "Please login first"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "success": false,
  "message": "Resource not found"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "success": false,
  "message": "Duplicate value on: field"
}
```

### 429 Rate Limited
```json
{
  "success": false,
  "message": "Too many requests, please try again later."
}
```

### 500 Server Error
```json
{
  "statusCode": 500,
  "success": false,
  "message": "Internal server error"
}
```