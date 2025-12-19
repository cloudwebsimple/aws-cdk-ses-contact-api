const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const sesClient = new SESClient({});

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST,OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const { name, email, message } = JSON.parse(event.body);
    
    if (!name || !email || !message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing required fields" })
      };
    }

    const timestamp = new Date().toISOString();
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Store in DynamoDB
    await docClient.send(new PutCommand({
      TableName: process.env.TABLE_NAME,
      Item: { id, name, email, message, timestamp }
    }));

    // Send email via SES
    await sesClient.send(new SendEmailCommand({
      Source: `Contact Form <${process.env.SENDER_EMAIL}>`,
      Destination: { ToAddresses: ["cloudwebsimple@gmail.com"] },
      Message: {
        Subject: { Data: `Website Contact: ${name}` },
        Body: {
          Html: {
            Data: `
              <h3>New Contact Form Submission</h3>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Message:</strong></p>
              <p>${message.replace(/\n/g, '<br>')}</p>
              <hr>
              <p><small>Sent via Contact Form API</small></p>
            `
          },
          Text: { Data: `New Contact Form Submission\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}\n\n---\nSent via Contact Form API` }
        }
      }
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "Contact form submitted successfully" })
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal server error" })
    };
  }
};