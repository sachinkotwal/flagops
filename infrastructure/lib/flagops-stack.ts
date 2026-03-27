import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class FlagOpsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ── DynamoDB Tables ────────────────────────────────────────────────────────

    const governanceTable = new dynamodb.Table(this, 'GovernanceTable', {
      tableName: 'flagops-governance',
      partitionKey: { name: 'flagKey', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      // RETAIN: cdk destroy will NOT delete the table or its data
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const settingsTable = new dynamodb.Table(this, 'SettingsTable', {
      tableName: 'flagops-settings',
      partitionKey: { name: 'configKey', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: 'flagops-users',
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ── IAM User + Policy ──────────────────────────────────────────────────────

    const appUser = new iam.User(this, 'AppUser', {
      userName: 'flagops-app',
    });

    appUser.attachInlinePolicy(
      new iam.Policy(this, 'DynamoPolicy', {
        policyName: 'flagops-dynamodb-access',
        statements: [
          new iam.PolicyStatement({
            actions: [
              'dynamodb:GetItem',
              'dynamodb:PutItem',
              'dynamodb:UpdateItem',
              'dynamodb:DeleteItem',
              'dynamodb:Scan',
              'dynamodb:BatchWriteItem',
            ],
            resources: [
              governanceTable.tableArn,
              settingsTable.tableArn,
              usersTable.tableArn,
            ],
          }),
        ],
      })
    );

    // ── Access Keys ────────────────────────────────────────────────────────────
    // Keys are output to cdk-outputs.json after deploy — copy to .env.local

    const accessKey = new iam.CfnAccessKey(this, 'AppUserAccessKey', {
      userName: appUser.userName,
    });

    // ── Outputs ────────────────────────────────────────────────────────────────

    new cdk.CfnOutput(this, 'AwsAccessKeyId', {
      value: accessKey.ref,
      description: 'Copy to AWS_ACCESS_KEY_ID in .env.local and Amplify env vars',
    });

    new cdk.CfnOutput(this, 'AwsSecretAccessKey', {
      value: accessKey.attrSecretAccessKey,
      description: 'Copy to AWS_SECRET_ACCESS_KEY in .env.local and Amplify env vars',
    });

    new cdk.CfnOutput(this, 'GovernanceTableName', {
      value: governanceTable.tableName,
    });

    new cdk.CfnOutput(this, 'SettingsTableName', {
      value: settingsTable.tableName,
    });

    new cdk.CfnOutput(this, 'UsersTableName', {
      value: usersTable.tableName,
    });
  }
}
