# API Endpoints

## Base URL

```
http://localhost:5001/api/v1
```

## Authentication

Protected routes require a valid JWT access token sent as an HTTP-only cookie (`accessToken`) or as a Bearer token in the `Authorization` header:

```
Authorization: Bearer <accessToken>
```

Tokens are issued on login and stored as cookies automatically.

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
**Rate limit:** 5 requests per hour

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
    "admin": {
      "_id": "...",
      "email": "admin@example.com"
    },
    "accessToken": "...",
    "refreshToken": "..."
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

### POST /admin/refresh-token

Get a new access token using a refresh token.

**Auth required:** No

**Request body:**
```json
{
  "refreshToken": "..."
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Access token refreshed",
  "data": {
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

**Response 401:**
```json
{
  "success": false,
  "message": "Invalid refresh token"
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

## Blogs

### GET /blogs

Get all published blogs with pagination.

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
        "content": "...",
        "author": "Admin",
        "status": "published",
        "tags": ["finance"],
        "category": "markets",
        "featuredImage": {
          "url": "https://cloudinary.com/...",
          "public_id": "..."
        },
        "slug": "market-trends",
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

### GET /blogs/:id

Get a single blog by ID.

**Auth required:** No

**Response 200:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "title": "Market Trends",
    "content": "...",
    "author": "Admin",
    "status": "published",
    "featuredImage": { "url": "...", "public_id": "..." },
    "createdAt": "...",
    "updatedAt": "..."
  }
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

### POST /blogs

Create a new blog.

**Auth required:** Yes  
**Content-Type:** `multipart/form-data`

**Request fields:**
| Field | Type | Required |
|---|---|---|
| `title` | string | Yes |
| `content` | string | Yes |
| `author` | string | No |
| `status` | `draft` \| `published` | No (default: `draft`) |
| `category` | string | No |
| `tags` | string[] | No |
| `metaTitle` | string | No |
| `metaDescription` | string | No |
| `featuredImage` | file | No |

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

All fields are optional (same as create).

**Response 200:**
```json
{
  "success": true,
  "message": "Blog updated successfully",
  "data": { ... }
}
```

---

### DELETE /blogs/:id

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
        "shortDescription": "...",
        "longDescription": "...",
        "ctaLink": "https://example.com",
        "investmentFocus": "Growth",
        "industriesPortfolio": ["technology", "healthcare"],
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

### GET /services/:id

Get a single service by ID.

**Auth required:** No

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
| `image` | file | No |

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
  "data": { ... }
}
```

---

### DELETE /services/:id

Soft delete a service.

**Auth required:** Yes

**Response 200:**
```json
{
  "success": true,
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

### GET /careers/:id

Get a single job opening by ID.

**Auth required:** No

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
  "data": { ... }
}
```

**Response 409:**
```json
{
  "success": false,
  "message": "Duplicate career: Career already exists"
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
  "data": { ... }
}
```

---

### DELETE /careers/:id

Soft delete a job opening.

**Auth required:** Yes

**Response 200:**
```json
{
  "success": true,
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
| `resume` | file (PDF) | Yes |
| `coverLetterFile` | file | No |

**Response 201:**
```json
{
  "success": true,
  "message": "Application submitted successfully",
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

Valid `status` values: `pending`, `reviewed`, `shortlisted`, `rejected`, `hired`

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

**Response 200:**
```json
{
  "success": true,
  "data": { ... }
}
```

---

### DELETE /applications/:id

Soft delete an application.

**Auth required:** Yes

**Response 200:**
```json
{
  "success": true,
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

**Response 201:**
```json
{
  "success": true,
  "message": "Contact created successfully",
  "data": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "subject": "General Inquiry",
    "status": "unread",
    "createdAt": "..."
  }
}
```

---

### GET /contacts

Get all contact submissions.

**Auth required:** Yes  
**Query params:** `page`, `limit`, `status`, `search`

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

Valid status values: `unread`, `read`, `resolved`

**Response 200:**
```json
{
  "success": true,
  "data": { ... }
}
```

---

### DELETE /contacts/:id

Soft delete a contact.

**Auth required:** Yes

**Response 200:**
```json
{
  "success": true,
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
| `image` | file | No |

**Response 201:**
```json
{
  "success": true,
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
  "data": { ... }
}
```

---

### DELETE /rewards/:id

Soft delete a reward.

**Auth required:** Yes

**Response 200:**
```json
{
  "success": true,
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
| `bio` | string | No |
| `socialLinks.linkedin` | string (URL) | No |
| `socialLinks.twitter` | string (URL) | No |
| `isActive` | boolean | No (default: `true`) |
| `order` | number | No |
| `profilePhoto` | file | No |

**Response 201:**
```json
{
  "success": true,
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
  "data": { ... }
}
```

---

### DELETE /teams/:id

Soft delete a team member.

**Auth required:** Yes

**Response 200:**
```json
{
  "success": true,
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
  "message": "Unauthorized request"
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