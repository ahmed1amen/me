---
layout: post
title: "Carbone.io: Self-Hosted Document Generation Made Easy"
date: 2025-10-01
categories: [development, backend]
tags: [document-generation, pdf, templates, nodejs, self-hosted, automation]
---

# Carbone.io: Self-Hosted Document Generation Made Easy

Document generation is a common requirement in enterprise applications—invoices, contracts, reports, certificates, and more. While there are many SaaS solutions available, privacy concerns, compliance requirements, and cost considerations often make self-hosted solutions more attractive. Enter Carbone.io, a powerful, open-source document generation engine that you can run on your own infrastructure.

## What is Carbone?

Carbone is a template-based document generator that creates PDF, DOCX, XLSX, ODT, ODS, and other formats from JSON data. It uses LibreOffice-compatible templates with a simple templating syntax, making it accessible to non-developers while remaining powerful enough for complex use cases.

### Key Features

- **Template-Based**: Use familiar tools like Microsoft Word, Excel, or LibreOffice to design templates
- **Multiple Formats**: Generate PDF, DOCX, XLSX, PPTX, ODT, ODS, and more
- **Self-Hosted**: Complete control over your data and infrastructure
- **JSON Data Injection**: Simple data binding with powerful formatting options
- **Conditionals & Loops**: Dynamic content based on your data
- **Image Support**: Insert images from URLs or base64 data
- **Multi-Language**: Support for any language with proper fonts
- **No Dependencies**: Works without internet access once set up

## Installation Options

### Option 1: Docker (Recommended for Production)

The easiest way to get started is using Docker:

```bash
# Pull the official Carbone image
docker pull carbone/carbone-ee

# Run Carbone container
docker run -d \
  --name carbone \
  -p 4000:4000 \
  carbone/carbone-ee
```

For docker-compose:

```yaml
version: '3.8'

services:
  carbone:
    image: carbone/carbone-ee
    container_name: carbone-server
    ports:
      - "4000:4000"
    environment:
      - CARBONE_WORKERS=4
    volumes:
      - ./templates:/app/templates
      - ./output:/app/output
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Option 2: Node.js Library

For integrating directly into your Node.js application:

```bash
npm install carbone
```

### Option 3: Carbone Cloud API (Optional)

If you prefer managed hosting for some use cases, Carbone also offers a cloud API with a generous free tier.

## Getting Started

### 1. Creating Your First Template

Create a simple invoice template in Microsoft Word or LibreOffice Writer:

**invoice_template.docx:**

```
INVOICE #{d.invoiceNumber}

Date: {d.date}
Customer: {d.customer.name}

Items:
{d.items[i].description}  {d.items[i].quantity} x ${d.items[i].price} = ${d.items[i].total}

Total: ${d.total}
```

### 2. Generating a Document with Node.js

```javascript
const carbone = require('carbone');
const fs = require('fs');

// Your data
const data = {
  invoiceNumber: 'INV-2025-001',
  date: '2025-10-02',
  customer: {
    name: 'Acme Corporation',
    email: 'billing@acme.com'
  },
  items: [
    { description: 'Web Development', quantity: 40, price: 150, total: 6000 },
    { description: 'Consulting', quantity: 10, price: 200, total: 2000 }
  ],
  total: 8000
};

// Generate document
carbone.render('./templates/invoice_template.docx', data, (err, result) => {
  if (err) {
    console.error('Error generating document:', err);
    return;
  }

  // Write result to file
  fs.writeFileSync('invoice_INV-2025-001.pdf', result);
  console.log('Invoice generated successfully!');
});
```

### 3. Converting to PDF

To convert to PDF, specify the `convertTo` option:

```javascript
const options = {
  convertTo: 'pdf'
};

carbone.render('./templates/invoice_template.docx', data, options, (err, result) => {
  if (err) return console.error(err);
  fs.writeFileSync('invoice.pdf', result);
});
```

## Advanced Features

### Conditional Rendering

Show or hide content based on your data:

**Template:**
```
{d.customer.isPremium:ifEQ(true):show}
Thank you for being a premium customer!
{d.customer.isPremium:show}
```

### Loops and Iterations

Iterate over arrays in your data:

**Template:**
```
Order Items:
{d.items[i].name}    {d.items[i].quantity}    ${d.items[i].price}
```

### Formatters

Apply formatting to your data:

```
Date: {d.date:formatD(YYYY-MM-DD)}
Amount: {d.amount:formatC(USD)}
Percentage: {d.rate:formatN(0.00)}%
```

Common formatters:
- `formatD`: Date formatting
- `formatC`: Currency formatting
- `formatN`: Number formatting
- `upper`: Uppercase text
- `lower`: Lowercase text
- `convCRLF`: Convert line breaks

### Image Insertion

Insert images from URLs or base64:

**Template (in Word):**
1. Insert a placeholder image
2. Add alt text: `{d.productImage}`

**Data:**
```javascript
const data = {
  productImage: 'https://example.com/product.jpg'
  // or base64: 'data:image/png;base64,iVBORw0KG...'
};
```

### Nested Data Structures

Handle complex nested objects:

```javascript
const data = {
  company: {
    name: 'Tech Solutions Inc',
    address: {
      street: '123 Main St',
      city: 'San Francisco',
      country: 'USA'
    }
  }
};
```

**Template:**
```
{d.company.name}
{d.company.address.street}
{d.company.address.city}, {d.company.address.country}
```

### Dynamic Tables

Create dynamic tables with variable rows:

**Template (Excel/Word table):**
```
Product Name    | Quantity  | Price     | Total
{d.items[i].name} | {d.items[i].qty} | {d.items[i].price} | {d.items[i].total}
```

## Real-World Use Cases

### 1. Invoice Generation System

```javascript
const express = require('express');
const carbone = require('carbone');
const app = express();

app.post('/api/invoices/generate', async (req, res) => {
  const { customer, items } = req.body;

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const data = {
    invoiceNumber: `INV-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    customer,
    items,
    subtotal,
    tax,
    total
  };

  const options = { convertTo: 'pdf' };

  carbone.render('./templates/invoice.docx', data, options, (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Generation failed' });
    }

    res.contentType('application/pdf');
    res.send(result);
  });
});

app.listen(3000);
```

### 2. Certificate Generator

```javascript
async function generateCertificate(studentData) {
  const data = {
    studentName: studentData.name,
    courseName: studentData.course,
    completionDate: new Date().toLocaleDateString(),
    instructorName: 'Dr. Jane Smith',
    certificateId: `CERT-${studentData.id}-${Date.now()}`
  };

  return new Promise((resolve, reject) => {
    carbone.render(
      './templates/certificate.docx',
      data,
      { convertTo: 'pdf' },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
  });
}
```

### 3. Contract Generation with E-Signature

```javascript
const carbone = require('carbone');
const PDFLib = require('pdf-lib');

async function generateSignableContract(contractData) {
  // Generate base contract
  const contractPdf = await new Promise((resolve, reject) => {
    carbone.render(
      './templates/contract.docx',
      contractData,
      { convertTo: 'pdf' },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
  });

  // Add signature fields using pdf-lib
  const pdfDoc = await PDFLib.PDFDocument.load(contractPdf);
  const pages = pdfDoc.getPages();
  const lastPage = pages[pages.length - 1];

  // Add signature placeholder
  lastPage.drawText('Signature: ___________________', {
    x: 50,
    y: 100,
    size: 12
  });

  const finalPdf = await pdfDoc.save();
  return finalPdf;
}
```

### 4. Bulk Report Generation

```javascript
async function generateMonthlyReports(customers) {
  const reports = [];

  for (const customer of customers) {
    const data = {
      customerName: customer.name,
      month: 'October 2025',
      transactions: customer.transactions,
      totalSpent: customer.totalSpent,
      charts: {
        spendingTrend: customer.chartUrl
      }
    };

    const report = await new Promise((resolve, reject) => {
      carbone.render(
        './templates/monthly_report.xlsx',
        data,
        { convertTo: 'pdf' },
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });

    reports.push({
      customerId: customer.id,
      report
    });
  }

  return reports;
}
```

### 5. Multi-Language Documents

```javascript
const translations = {
  en: { title: 'Invoice', total: 'Total', date: 'Date' },
  fr: { title: 'Facture', total: 'Total', date: 'Date' },
  es: { title: 'Factura', total: 'Total', date: 'Fecha' }
};

function generateLocalizedInvoice(data, locale = 'en') {
  const labels = translations[locale];

  const localizedData = {
    ...data,
    labels
  };

  carbone.render(
    './templates/invoice_i18n.docx',
    localizedData,
    { convertTo: 'pdf', lang: locale },
    (err, result) => {
      // Handle result
    }
  );
}
```

### 6. Generate Documents on the Fly with REST API

If you're running Carbone as a service (using Carbone EE or Carbone Cloud), you can generate documents via HTTP API without storing templates on disk.

#### API Endpoint Setup

```javascript
const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// Carbone server configuration
const CARBONE_URL = process.env.CARBONE_URL || 'http://localhost:4000';
const CARBONE_VERSION = '5';

app.post('/api/generate-document', async (req, res) => {
  try {
    const { templateBase64, data, convertTo = 'pdf', lang = 'en-US' } = req.body;

    // Generate document using Carbone API
    const response = await axios.post(
      `${CARBONE_URL}/render/template?download=true`,
      {
        data: data,
        template: templateBase64,
        enum: {},
        translations: {},
        isDebugActive: false,
        convertTo: convertTo,
        lang: lang
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'carbone-version': CARBONE_VERSION
        },
        responseType: 'arraybuffer'
      }
    );

    // Set appropriate content type
    const contentType = convertTo === 'pdf'
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="document.${convertTo}"`);
    res.send(response.data);

  } catch (error) {
    console.error('Error generating document:', error.message);
    res.status(500).json({
      error: 'Failed to generate document',
      details: error.response?.data || error.message
    });
  }
});

app.listen(3000, () => {
  console.log('Document generation API running on port 3000');
});
```

#### Complete Example with Template Conversion

```javascript
const fs = require('fs');
const axios = require('axios');

// Helper: Convert template file to base64
function templateToBase64(templatePath) {
  const fileBuffer = fs.readFileSync(templatePath);
  return fileBuffer.toString('base64');
}

// Generate document on the fly
async function generateDocumentOnTheFly(templatePath, data, options = {}) {
  const {
    convertTo = 'pdf',
    lang = 'en-US',
    isDebugActive = false,
    download = true
  } = options;

  // Convert template to base64
  const templateBase64 = templateToBase64(templatePath);

  try {
    const response = await axios.post(
      `http://localhost:4000/render/template?download=${download}`,
      {
        data: data,
        template: templateBase64,
        enum: {},
        translations: {},
        isDebugActive: isDebugActive,
        convertTo: convertTo,
        lang: lang
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'carbone-version': '5'
        },
        responseType: 'arraybuffer'
      }
    );

    return response.data;
  } catch (error) {
    console.error('Carbone API Error:', error.response?.data || error.message);
    throw error;
  }
}

// Usage example
async function example() {
  const data = {
    firstname: 'John',
    lastname: 'Doe',
    company: 'Tech Solutions Inc',
    position: 'Senior Developer'
  };

  try {
    const pdfBuffer = await generateDocumentOnTheFly(
      './templates/certificate.docx',
      data,
      { convertTo: 'pdf', lang: 'en-US' }
    );

    // Save generated PDF
    fs.writeFileSync('certificate.pdf', pdfBuffer);
    console.log('Certificate generated successfully!');
  } catch (error) {
    console.error('Failed to generate certificate:', error);
  }
}

example();
```

#### Using with Frontend (React/Vue)

```javascript
// Frontend service to call your backend API
async function generateDocument(templateName, data, format = 'pdf') {
  try {
    const response = await fetch('/api/generate-document', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        templateBase64: await fetchTemplateAsBase64(templateName),
        data: data,
        convertTo: format,
        lang: 'en-US'
      })
    });

    if (!response.ok) {
      throw new Error('Document generation failed');
    }

    // Download the file
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Helper to fetch template from server and convert to base64
async function fetchTemplateAsBase64(templateName) {
  const response = await fetch(`/api/templates/${templateName}`);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Usage in React component
function CertificateGenerator() {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      await generateDocument('certificate', {
        firstname: 'Jane',
        lastname: 'Smith',
        courseName: 'Advanced JavaScript',
        completionDate: new Date().toLocaleDateString()
      }, 'pdf');

      alert('Certificate generated successfully!');
    } catch (error) {
      alert('Failed to generate certificate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleGenerate} disabled={loading}>
      {loading ? 'Generating...' : 'Generate Certificate'}
    </button>
  );
}
```

#### Debug Mode for Development

When developing templates, enable debug mode to see detailed information:

```javascript
const response = await axios.post(
  'http://localhost:4000/render/template?download=true',
  {
    data: {
      firstname: 'Will',
      lastname: 'Smith'
    },
    template: templateBase64,
    enum: {},
    translations: {},
    isDebugActive: true,  // Enable debug mode
    convertTo: 'html',    // Use HTML to see rendered output
    lang: 'en-US'
  },
  {
    headers: {
      'Content-Type': 'application/json',
      'carbone-version': '5'
    }
  }
);

console.log('Debug output:', response.data);
```

#### Error Handling and Validation

```javascript
async function generateDocumentWithValidation(templatePath, data, options) {
  // Validate input
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Data must be a valid object');
  }

  const validFormats = ['pdf', 'docx', 'xlsx', 'html', 'odt', 'ods'];
  if (options.convertTo && !validFormats.includes(options.convertTo)) {
    throw new Error(`Invalid format: ${options.convertTo}`);
  }

  try {
    const templateBase64 = templateToBase64(templatePath);

    const response = await axios.post(
      'http://localhost:4000/render/template?download=true',
      {
        data: data,
        template: templateBase64,
        enum: options.enum || {},
        translations: options.translations || {},
        isDebugActive: options.debug || false,
        convertTo: options.convertTo || 'pdf',
        lang: options.lang || 'en-US'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'carbone-version': '5'
        },
        responseType: 'arraybuffer',
        timeout: 30000 // 30 second timeout
      }
    );

    return {
      success: true,
      data: response.data,
      format: options.convertTo || 'pdf'
    };

  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      statusCode: error.response?.status
    };
  }
}

// Usage with proper error handling
async function main() {
  const result = await generateDocumentWithValidation(
    './templates/invoice.docx',
    {
      firstname: 'Will',
      lastname: 'Smith',
      invoiceNumber: 'INV-2025-001'
    },
    {
      convertTo: 'pdf',
      lang: 'en-US',
      debug: false
    }
  );

  if (result.success) {
    fs.writeFileSync(`output.${result.format}`, result.data);
    console.log('Document generated successfully');
  } else {
    console.error('Generation failed:', result.error);
  }
}
```

## Self-Hosting Best Practices

### 1. Resource Management

```yaml
# docker-compose.yml with resource limits
services:
  carbone:
    image: carbone/carbone-ee
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### 2. Template Versioning

```javascript
const templateVersions = {
  'invoice_v1': './templates/invoice_v1.docx',
  'invoice_v2': './templates/invoice_v2.docx'
};

function generateDocument(data, templateVersion = 'invoice_v2') {
  const templatePath = templateVersions[templateVersion];
  carbone.render(templatePath, data, options, callback);
}
```

### 3. Caching Strategy

```javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 3600 });

async function generateWithCache(templateName, data) {
  const cacheKey = `${templateName}_${JSON.stringify(data)}`;

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  // Generate new document
  const document = await generateDocument(templateName, data);

  // Cache result
  cache.set(cacheKey, document);

  return document;
}
```

### 4. Queue Management for High Volume

```javascript
const Queue = require('bull');
const documentQueue = new Queue('document-generation', {
  redis: { host: 'localhost', port: 6379 }
});

// Add job to queue
documentQueue.add('generate-invoice', {
  template: 'invoice',
  data: invoiceData,
  userId: user.id
});

// Process jobs
documentQueue.process('generate-invoice', async (job) => {
  const { template, data } = job.data;

  const document = await new Promise((resolve, reject) => {
    carbone.render(`./templates/${template}.docx`, data, { convertTo: 'pdf' },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
  });

  // Save to storage
  await saveDocument(job.data.userId, document);

  return { status: 'completed' };
});
```

### 5. Monitoring and Logging

```javascript
const logger = require('winston');

function generateDocumentWithLogging(template, data) {
  const startTime = Date.now();

  logger.info('Document generation started', {
    template,
    dataSize: JSON.stringify(data).length
  });

  carbone.render(template, data, { convertTo: 'pdf' }, (err, result) => {
    const duration = Date.now() - startTime;

    if (err) {
      logger.error('Document generation failed', {
        template,
        error: err.message,
        duration
      });
      return;
    }

    logger.info('Document generation completed', {
      template,
      duration,
      size: result.length
    });
  });
}
```

## Performance Optimization

### 1. Parallel Processing

```javascript
const Promise = require('bluebird');

async function generateBatch(templates, dataArray) {
  return Promise.map(
    dataArray,
    (data, index) => generateDocument(templates[index], data),
    { concurrency: 5 } // Limit concurrent generations
  );
}
```

### 2. Template Preloading

```javascript
const templateCache = new Map();

function preloadTemplates() {
  const templates = ['invoice', 'contract', 'report'];

  templates.forEach(name => {
    const buffer = fs.readFileSync(`./templates/${name}.docx`);
    templateCache.set(name, buffer);
  });
}

// Use cached template
function renderFromCache(templateName, data) {
  const template = templateCache.get(templateName);
  carbone.render(template, data, callback);
}
```

## Security Considerations

### 1. Input Validation

```javascript
const Joi = require('joi');

const invoiceSchema = Joi.object({
  invoiceNumber: Joi.string().pattern(/^INV-\d+$/).required(),
  customer: Joi.object({
    name: Joi.string().max(100).required(),
    email: Joi.string().email().required()
  }),
  items: Joi.array().items(
    Joi.object({
      description: Joi.string().max(200),
      quantity: Joi.number().positive(),
      price: Joi.number().positive()
    })
  )
});

function validateAndGenerate(data) {
  const { error, value } = invoiceSchema.validate(data);
  if (error) throw new Error('Invalid data');

  return generateInvoice(value);
}
```

### 2. Template Sandboxing

```javascript
// Restrict template access to specific directory
const path = require('path');

function sanitizeTemplatePath(templateName) {
  const basePath = path.resolve('./templates');
  const templatePath = path.resolve(basePath, templateName);

  // Prevent path traversal
  if (!templatePath.startsWith(basePath)) {
    throw new Error('Invalid template path');
  }

  return templatePath;
}
```

## Comparison with Alternatives

| Feature | Carbone | Puppeteer/HTML2PDF | Gotenberg | PhantomJS |
|---------|---------|-------------------|-----------|-----------|
| Self-hosted | ✅ | ✅ | ✅ | ✅ |
| Office formats | ✅ | ❌ | ✅ | ❌ |
| Template editing | Easy (Word/Excel) | Hard (HTML/CSS) | Medium | Hard |
| Performance | Fast | Slow | Fast | Deprecated |
| Memory usage | Low | High | Medium | High |
| PDF quality | Excellent | Good | Excellent | Good |

## Conclusion

Carbone.io is an excellent choice for self-hosted document generation, offering:

- **Developer-friendly**: Simple API with minimal learning curve
- **Business-friendly**: Non-technical users can create and edit templates
- **Cost-effective**: No per-document fees for self-hosted deployment
- **Flexible**: Support for multiple formats and complex use cases
- **Performant**: Fast generation even for complex documents
- **Privacy**: Complete control over sensitive data

Whether you're building an invoicing system, certificate generator, or automated reporting tool, Carbone provides the flexibility and power you need while keeping your data under your control.

## Resources

- [Official Documentation](https://carbone.io/documentation.html)
- [GitHub Repository](https://github.com/carboneio/carbone)
- [Template Examples](https://carbone.io/examples.html)
- [API Reference](https://carbone.io/api-reference.html)

Happy document generating!
