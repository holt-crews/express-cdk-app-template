#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { ECSTemplateAppStack } from "../lib/ecs-template-app-stack";
import { LambdaAppStack } from "../lib/lambda-template-app-stack";

const app = new cdk.App();

// ecs based stack
// `yarn cdk deploy staging-ECSTemplateAppStack` to deploy
new ECSTemplateAppStack(app, "staging-ECSTemplateAppStack", {
  env: {
    account: "<account-number>",
    region: "us-east-1",
  },
  taskCount: 1,
  cpu: 1024,
  ecsMaxMemory: 2048,
  stage: "staging",
});

// lambda based stack
// `yarn cdk deploy staging-LambdaTemplateAppStack` to deploy
new LambdaAppStack(app, "staging-LambdaTemplateAppStack", {
  env: {
    account: "<account-number>",
    region: "us-east-1",
  },
  stage: "staging",
});
