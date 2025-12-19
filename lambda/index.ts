import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

// Contact form request structure
interface ContactRequest {
  name: string;
  email: string;
  message: string;
}

// AWS service clients
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const sesClient = new SESClient({});

// CORS headers for API responses
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST,OPTIONS'
};

// Create standardized API Gateway response
const createResponse = (statusCode: number, body: object): APIGatewayProxyResult => ({
  statusCode,
  headers: CORS_HEADERS,
  body: JSON.stringify(body)
});

// Validate and extract contact form data
const validateRequest = (data: any): ContactRequest => {
  const { name, email, message } = data;
  
  if (!name || !email || !message) {
    throw new Error('Missing required fields: name, email, message');
  }
  
  return { name, email, message };
};

// Save contact submission to DynamoDB
const saveToDatabase = async (contact: ContactRequest): Promise<void> => {
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();

  await docClient.send(new PutCommand({
    TableName: process.env.TABLE_NAME!,
    Item: { id, ...contact, timestamp }
  }));
};

// Send email notification via SES
const sendNotificationEmail = async (contact: ContactRequest): Promise<void> => {
  const emailBody = `Name: ${contact.name}\nEmail: ${contact.email}\n\nMessage:\n${contact.message}`;
  
  await sesClient.send(new SendEmailCommand({
    Source: process.env.SENDER_EMAIL!,
    Destination: { ToAddresses: ['cloudwebsimple@gmail.com'] },
    Message: {
      Subject: { Data: `CWS ContactForm: ${contact.name}` },
      Body: { Text: { Data: emailBody } }
    }
  }));
};

// Main Lambda handler for contact form API
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return createResponse(200, {});
  }

  try {
    const contact = validateRequest(JSON.parse(event.body || '{}'));
    
    // Process database save and email notification concurrently
    await Promise.all([
      saveToDatabase(contact),
      sendNotificationEmail(contact)
    ]);

    return createResponse(200, { 
      message: 'Contact form submitted successfully' 
    });
    
  } catch (error) {
    console.error('Error processing contact form:', error);
    
    // Return appropriate error response
    const isValidationError = error instanceof Error && error.message.includes('Missing required fields');
    const statusCode = isValidationError ? 400 : 500;
    const message = isValidationError ? error.message : 'Internal server error';
    
    return createResponse(statusCode, { error: message });
  }
};