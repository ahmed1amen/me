---
layout: post
title: "API Design Best Practices: Building Interfaces That Last"
date: 2024-02-20 09:15:00 +0200
categories: [Engineering, API]
tags: [api-design, rest, graphql, microservices, best-practices]
author: Ahmed Amen Ramadan
excerpt: "Good API design is like good architecture—it should be intuitive, scalable, and stand the test of time."
---

After designing APIs for systems serving millions of requests per day, I've learned that **good API design is like good architecture—it should be intuitive, scalable, and stand the test of time**.

Here are the principles I follow when designing APIs that developers actually want to use.

## 1. Design for Your Users, Not Your Database

**Bad API Design** (database-driven):
```json
GET /api/user_profiles?user_id=123
{
  "user_profile_id": 456,
  "user_id": 123,
  "first_name": "John",
  "last_name": "Doe",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-02-20T09:15:00Z"
}
```

**Good API Design** (user-driven):
```json
GET /api/users/123/profile
{
  "id": 123,
  "name": "John Doe",
  "joinedAt": "2024-01-15T10:30:00Z"
}
```

The second version focuses on what the client needs, not how you store the data internally.

## 2. Consistency is King

Choose conventions and stick to them religiously:

### URL Patterns
```bash
# Resources (nouns, not verbs)
GET    /api/users           # List users
POST   /api/users           # Create user  
GET    /api/users/123       # Get specific user
PUT    /api/users/123       # Update user
DELETE /api/users/123       # Delete user

# Nested resources
GET    /api/users/123/posts # User's posts
POST   /api/users/123/posts # Create post for user
```

### Response Formats
```json
{
  "data": { ... },           // Always wrap data
  "meta": {                  // Consistent metadata
    "timestamp": "2024-02-20T09:15:00Z",
    "version": "v1"
  },
  "errors": []               // Even when empty
}
```

## 3. Version from Day One

I learned this the hard way. **Always version your APIs**, even v1:

```bash
# URL versioning (simple and visible)
GET /api/v1/users/123

# Header versioning (cleaner URLs)
GET /api/users/123
Accept: application/vnd.yourapi.v1+json
```

## 4. Error Handling That Actually Helps

Generic error messages are useless. Be specific and actionable:

```json
// Bad ❌
{
  "error": "Invalid request"
}

// Good ✅
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "value": "not-an-email",
      "expected": "Valid email address (e.g., user@example.com)"
    },
    "documentation": "https://docs.yourapi.com/errors#validation-error"
  }
}
```

## 5. HTTP Status Codes Matter

Use them correctly and consistently:

```javascript
// Success
200 OK          // General success
201 Created     // Resource created
204 No Content  // Success, but no data to return

// Client Errors
400 Bad Request     // Invalid request format
401 Unauthorized    // Authentication required
403 Forbidden       // Authenticated but not allowed
404 Not Found       // Resource doesn't exist
409 Conflict        // Resource already exists
422 Unprocessable   // Valid format, invalid data

// Server Errors  
500 Internal Error  // Our fault
503 Service Unavailable // Temporarily down
```

## 6. Pagination for Performance

Never return unlimited results:

```json
GET /api/users?page=1&limit=20

{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1543,
    "totalPages": 78,
    "hasNext": true,
    "hasPrevious": false,
    "nextPage": "/api/users?page=2&limit=20",
    "previousPage": null
  }
}
```

## 7. Security by Design

### Authentication
```bash
# JWT in headers (not URLs!)
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Rate Limiting
```json
// Include rate limit info in responses
{
  "data": { ... },
  "rateLimit": {
    "limit": 1000,
    "remaining": 999,
    "resetTime": "2024-02-20T10:00:00Z"
  }
}
```

### Input Validation
```javascript
// Validate everything, trust nothing
const userSchema = {
  email: { type: 'email', required: true },
  age: { type: 'integer', min: 13, max: 120 },
  name: { type: 'string', minLength: 2, maxLength: 50 }
};
```

## 8. Documentation as Code

Use tools like OpenAPI/Swagger to keep docs in sync:

```yaml
# openapi.yml
paths:
  /users/{id}:
    get:
      summary: Get user by ID
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        200:
          description: User found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
```

## 9. Testing Your API

Write tests that think like your users:

```javascript
describe('User API', () => {
  test('should create user with valid data', async () => {
    const userData = { name: 'John', email: 'john@example.com' };
    const response = await api.post('/users', userData);
    
    expect(response.status).toBe(201);
    expect(response.data.id).toBeDefined();
    expect(response.data.name).toBe('John');
  });
  
  test('should reject invalid email', async () => {
    const userData = { name: 'John', email: 'not-an-email' };
    const response = await api.post('/users', userData);
    
    expect(response.status).toBe(400);
    expect(response.data.error.field).toBe('email');
  });
});
```

## 10. Performance Considerations

### Field Selection
```bash
# Let clients choose what they need
GET /api/users/123?fields=id,name,email
```

### Caching Headers
```bash
# Cache static data aggressively
Cache-Control: public, max-age=3600

# Cache dynamic data carefully  
Cache-Control: private, max-age=300
```

### Async for Heavy Operations
```json
// For operations that take time
POST /api/users/123/export
{
  "jobId": "abc123",
  "status": "processing",
  "estimatedCompletion": "2024-02-20T09:20:00Z",
  "statusUrl": "/api/jobs/abc123"
}
```

## Common Mistakes to Avoid

1. **Exposing internal IDs** → Use UUIDs or encode them
2. **Ignoring HTTP methods** → POST for everything is wrong
3. **No input validation** → Garbage in, security issues out
4. **Chatty APIs** → One request shouldn't require 10 more
5. **No backwards compatibility** → Breaking changes break trust

## GraphQL vs REST: When to Choose What

**Use REST when:**
- Simple, well-defined resources
- Caching is important
- Team is familiar with REST patterns

**Use GraphQL when:**
- Clients need different data shapes
- Multiple data sources to aggregate
- Strong typing is valuable

## Conclusion

Great API design is about empathy—understanding how developers will use your interface and making their lives easier. It's not about showing off your technical skills; it's about creating tools that solve real problems elegantly.

Remember: **APIs are forever**. The extra time you spend designing them well upfront will save you (and your users) countless hours later.

---

*Have you encountered APIs that made you want to quit programming? Or ones that were so well-designed they made your day? I'd love to hear your stories.*