---
layout: post
title: "JMESPath: A Complete Guide to JSON Query Language"
date: 2025-10-02
categories: [development, tools]
tags: [json, jmespath, query-language, data-processing]
---

# JMESPath: A Complete Guide to JSON Query Language

JMESPath (pronounced "James path") is a query language for JSON that allows you to declaratively specify how to extract and transform elements from a JSON document. Think of it as XPath for JSON, but with a more intuitive syntax designed specifically for JSON's structure.

## Why JMESPath?

Working with complex JSON structures often requires writing verbose code with nested loops and conditionals. JMESPath provides a concise, declarative way to query JSON data, making your code more readable and maintainable.

## Basic Syntax

### Simple Field Access

```json
{
  "name": "Ahmed",
  "age": 30,
  "city": "San Francisco"
}
```

```jmespath
name
// Output: "Ahmed"

age
// Output: 30
```

### Nested Field Access

```json
{
  "user": {
    "profile": {
      "name": "Ahmed",
      "email": "ahmed@example.com"
    }
  }
}
```

```jmespath
user.profile.name
// Output: "Ahmed"

user.profile.email
// Output: "ahmed@example.com"
```

## Array Operations

### Array Indexing

```json
{
  "users": ["Alice", "Bob", "Charlie", "David"]
}
```

```jmespath
users[0]
// Output: "Alice"

users[-1]
// Output: "David"

users[1:3]
// Output: ["Bob", "Charlie"]
```

### Array Projection

One of JMESPath's most powerful features is array projection, which allows you to apply an expression to every element in an array.

```json
{
  "products": [
    {"name": "Laptop", "price": 999, "category": "Electronics"},
    {"name": "Mouse", "price": 25, "category": "Electronics"},
    {"name": "Desk", "price": 299, "category": "Furniture"}
  ]
}
```

```jmespath
products[*].name
// Output: ["Laptop", "Mouse", "Desk"]

products[*].price
// Output: [999, 25, 299]
```

## Filtering

### Basic Filtering

```json
{
  "products": [
    {"name": "Laptop", "price": 999, "inStock": true},
    {"name": "Mouse", "price": 25, "inStock": true},
    {"name": "Monitor", "price": 399, "inStock": false}
  ]
}
```

```jmespath
products[?inStock].name
// Output: ["Laptop", "Mouse"]

products[?price > `100`].name
// Output: ["Laptop", "Monitor"]

products[?price < `50` && inStock]
// Output: [{"name": "Mouse", "price": 25, "inStock": true}]
```

### Complex Filtering

```jmespath
products[?price >= `100` && price <= `500`].[name, price]
// Output: [["Monitor", 399]]
```

## Pipe Expressions

Pipe expressions allow you to chain operations together:

```json
{
  "users": [
    {"name": "Alice", "age": 30, "active": true},
    {"name": "Bob", "age": 25, "active": false},
    {"name": "Charlie", "age": 35, "active": true}
  ]
}
```

```jmespath
users[?active] | [0].name
// Output: "Alice"

users[?age > `26`] | [*].name
// Output: ["Alice", "Charlie"]
```

## Multi-Select

Create new objects or arrays from existing data:

### Multi-Select List

```jmespath
products[*].[name, price]
// Output: [["Laptop", 999], ["Mouse", 25], ["Monitor", 399]]
```

### Multi-Select Hash

```jmespath
products[0].{productName: name, cost: price}
// Output: {"productName": "Laptop", "cost": 999}

products[*].{productName: name, cost: price, available: inStock}
// Output: [
//   {"productName": "Laptop", "cost": 999, "available": true},
//   {"productName": "Mouse", "cost": 25, "available": true},
//   {"productName": "Monitor", "cost": 399, "available": false}
// ]
```

## Functions

JMESPath includes built-in functions for common operations:

### String Functions

```json
{
  "users": [
    {"name": "alice", "email": "ALICE@EXAMPLE.COM"},
    {"name": "bob", "email": "BOB@EXAMPLE.COM"}
  ]
}
```

```jmespath
users[*].{name: upper(name), email: lower(email)}
// Output: [
//   {"name": "ALICE", "email": "alice@example.com"},
//   {"name": "BOB", "email": "bob@example.com"}
// ]
```

### Array Functions

```json
{
  "orders": [
    {"id": 1, "items": ["apple", "banana"]},
    {"id": 2, "items": ["orange", "grape", "melon"]},
    {"id": 3, "items": ["pear"]}
  ]
}
```

```jmespath
orders[*].length(items)
// Output: [2, 3, 1]

max(orders[*].length(items))
// Output: 3

sort(orders[*].id)
// Output: [1, 2, 3]
```

### Math Functions

```json
{
  "sales": [
    {"month": "Jan", "revenue": 1000},
    {"month": "Feb", "revenue": 1500},
    {"month": "Mar", "revenue": 1200}
  ]
}
```

```jmespath
sum(sales[*].revenue)
// Output: 3700

avg(sales[*].revenue)
// Output: 1233.33

max(sales[*].revenue)
// Output: 1500
```

## Real-World Use Cases

### 1. AWS CLI Integration

JMESPath is built into the AWS CLI for querying responses:

```bash
# Get all EC2 instance IDs in running state
aws ec2 describe-instances \
  --query 'Reservations[*].Instances[?State.Name==`running`].InstanceId' \
  --output text

# Get S3 bucket names created in 2024
aws s3api list-buckets \
  --query 'Buckets[?CreationDate>=`2024-01-01`].Name'
```

### 2. API Response Processing

```json
{
  "data": {
    "users": [
      {
        "id": 1,
        "name": "Alice",
        "posts": [
          {"id": 101, "title": "Hello World", "likes": 50},
          {"id": 102, "title": "JMESPath Tutorial", "likes": 150}
        ]
      },
      {
        "id": 2,
        "name": "Bob",
        "posts": [
          {"id": 201, "title": "Getting Started", "likes": 30}
        ]
      }
    ]
  }
}
```

```jmespath
// Get all post titles
data.users[*].posts[*].title | []
// Output: ["Hello World", "JMESPath Tutorial", "Getting Started"]

// Get posts with more than 100 likes
data.users[*].posts[?likes > `100`] | []
// Output: [{"id": 102, "title": "JMESPath Tutorial", "likes": 150}]

// Get user names with their post count
data.users[*].{name: name, postCount: length(posts)}
// Output: [
//   {"name": "Alice", "postCount": 2},
//   {"name": "Bob", "postCount": 1}
// ]
```

### 3. Log Analysis

```json
{
  "logs": [
    {"timestamp": "2025-01-15T10:30:00Z", "level": "INFO", "message": "Server started"},
    {"timestamp": "2025-01-15T10:31:00Z", "level": "ERROR", "message": "Connection failed"},
    {"timestamp": "2025-01-15T10:32:00Z", "level": "WARN", "message": "High memory usage"},
    {"timestamp": "2025-01-15T10:33:00Z", "level": "ERROR", "message": "Database timeout"}
  ]
}
```

```jmespath
// Get all error messages
logs[?level=='ERROR'].message
// Output: ["Connection failed", "Database timeout"]

// Count errors
length(logs[?level=='ERROR'])
// Output: 2

// Get recent errors with timestamps
logs[?level=='ERROR'].{time: timestamp, error: message}
```

### 4. E-commerce Data Processing

```json
{
  "orders": [
    {
      "orderId": "ORD001",
      "customer": "Alice",
      "items": [
        {"product": "Laptop", "quantity": 1, "price": 999},
        {"product": "Mouse", "quantity": 2, "price": 25}
      ]
    },
    {
      "orderId": "ORD002",
      "customer": "Bob",
      "items": [
        {"product": "Keyboard", "quantity": 1, "price": 75}
      ]
    }
  ]
}
```

```jmespath
// Calculate order totals
orders[*].{
  orderId: orderId,
  total: sum(items[*].[quantity * price][])
}
// Output: [
//   {"orderId": "ORD001", "total": 1049},
//   {"orderId": "ORD002", "total": 75}
// ]

// Find orders over $500
orders[?sum(items[*].[quantity * price][]) > `500`].orderId
// Output: ["ORD001"]
```

### 5. Configuration Management

```json
{
  "services": [
    {
      "name": "api-server",
      "instances": [
        {"id": "i-001", "status": "running", "cpu": 45, "memory": 70},
        {"id": "i-002", "status": "running", "cpu": 80, "memory": 85}
      ]
    },
    {
      "name": "web-server",
      "instances": [
        {"id": "i-003", "status": "stopped", "cpu": 0, "memory": 0}
      ]
    }
  ]
}
```

```jmespath
// Find all running instances with high CPU
services[*].instances[?status=='running' && cpu > `70`][] | [*].id
// Output: ["i-002"]

// Service health overview
services[*].{
  service: name,
  running: length(instances[?status=='running']),
  stopped: length(instances[?status=='stopped'])
}
```

## Using JMESPath in Different Languages

### Python

```python
import jmespath
import json

data = json.loads('{"users": [{"name": "Alice", "age": 30}]}')
result = jmespath.search('users[0].name', data)
print(result)  # Output: Alice
```

### JavaScript/Node.js

```javascript
const jmespath = require('jmespath');

const data = {
  users: [
    { name: 'Alice', age: 30 },
    { name: 'Bob', age: 25 }
  ]
};

const result = jmespath.search(data, 'users[?age > `26`].name');
console.log(result);  // Output: ['Alice']
```

### Go

```go
import "github.com/jmespath/go-jmespath"

data := map[string]interface{}{
    "users": []interface{}{
        map[string]interface{}{"name": "Alice", "age": 30},
    },
}

result, _ := jmespath.Search("users[0].name", data)
fmt.Println(result)  // Output: Alice
```

## Best Practices

1. **Start Simple**: Begin with basic queries and build complexity gradually
2. **Use Projections Wisely**: Flatten nested arrays when needed using `[]`
3. **Leverage Functions**: Built-in functions can simplify complex operations
4. **Test Incrementally**: Use online JMESPath testers to validate expressions
5. **Consider Performance**: Complex queries on large datasets may impact performance
6. **Document Complex Queries**: Add comments explaining non-trivial expressions

## Online Tools

- [JMESPath Official Site](https://jmespath.org/) - Interactive tutorial and specification
- [JMESPath Terminal](https://github.com/jmespath/jmespath.terminal) - CLI tool for testing
- [jp](https://github.com/jmespath/jp) - Command-line JSON processor using JMESPath

## Conclusion

JMESPath is an incredibly powerful tool for working with JSON data. Whether you're processing API responses, analyzing logs, or querying cloud infrastructure, JMESPath provides a clean, declarative syntax that makes complex data transformations simple and maintainable.

The key to mastering JMESPath is practice. Start with simple queries and gradually explore more advanced features like projections, filters, and functions. Once you're comfortable with the syntax, you'll find yourself reaching for JMESPath whenever you need to work with JSON data.

## References

- [JMESPath Specification](https://jmespath.org/specification.html)
- [JMESPath Tutorial](https://jmespath.org/tutorial.html)
- [AWS CLI JMESPath Examples](https://docs.aws.amazon.com/cli/latest/userguide/cli-usage-output-format.html)
