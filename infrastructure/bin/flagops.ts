#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { FlagOpsStack } from '../lib/flagops-stack';

const app = new cdk.App();

new FlagOpsStack(app, 'FlagOpsStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
  },
  description: 'FlagOps — DynamoDB tables and IAM credentials for the governance dashboard',
});
