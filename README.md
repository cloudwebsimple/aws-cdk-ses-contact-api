# AWS CDK SES Contact API

Serverless contact form API built with AWS CDK, Lambda, SES, and DynamoDB - Infrastructure as Code

## Architecture

```
Frontend → API Gateway → Lambda → DynamoDB + SES
```

## AWS Services Used

- **AWS CDK** - Infrastructure as Code
- **API Gateway** - REST API endpoint
- **Lambda** - Serverless function handler
- **DynamoDB** - Contact submissions storage
- **SES** - Email notifications
- **IAM** - Permissions and roles

## Prerequisites

- AWS CLI configured
- Node.js 18+
- AWS CDK CLI installed: `npm install -g aws-cdk`

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   cd lambda && npm install && cd ..
   ```

2. **Bootstrap CDK (first time only):**
   ```bash
   cdk bootstrap
   ```

3. **Verify SES email:**
   - Go to AWS SES Console
   - Verify `cloudwebsimple@gmail.com` as sender identity

## Deploy

```bash
npm run deploy
```

## Environment Variables

The API URL will be output after deployment. Add to your frontend:

```env
NEXT_PUBLIC_API_ENDPOINT=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod/contact
```

## API Usage

**POST** `/contact`

```json
{
  "name": "John Doe",
  "email": "john@example.com", 
  "message": "Hello from contact form"
}
```

## Cleanup

```bash
npm run destroy
```

## Project Structure

```
├── bin/app.ts              # CDK app entry point
├── lib/contact-api-stack.ts # Main CDK stack
├── lambda/
│   ├── index.js            # Lambda handler
│   └── package.json        # Lambda dependencies
├── package.json            # CDK dependencies
└── cdk.json               # CDK configuration
```