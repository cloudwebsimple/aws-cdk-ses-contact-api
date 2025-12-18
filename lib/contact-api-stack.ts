import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class ContactApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Table
    const contactTable = new dynamodb.Table(this, 'ContactTable', {
      tableName: 'contact-submissions',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Lambda Function
    const contactHandler = new lambda.Function(this, 'ContactHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        TABLE_NAME: contactTable.tableName,
        SENDER_EMAIL: 'cloudwebsimple@gmail.com',
      },
    });

    // Grant permissions
    contactTable.grantWriteData(contactHandler);
    contactHandler.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['ses:SendEmail', 'ses:SendRawEmail'],
      resources: ['*'],
    }));

    // API Gateway
    const api = new apigateway.RestApi(this, 'ContactApi', {
      restApiName: 'Contact Form API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type'],
      },
    });

    const contactIntegration = new apigateway.LambdaIntegration(contactHandler);
    api.root.addResource('contact').addMethod('POST', contactIntegration);

    // Output API URL
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'Contact API URL',
    });
  }
}