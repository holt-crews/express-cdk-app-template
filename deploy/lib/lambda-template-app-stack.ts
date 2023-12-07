import path from "path";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as cw from "aws-cdk-lib/aws-cloudwatch";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Platform } from "aws-cdk-lib/aws-ecr-assets";

const vpcs = {
  staging: "<vpc-id>",
  prod: "<vpc-id>",
};

interface LambdaAppStackProps extends cdk.StackProps {
  readonly stage: "staging" | "prod";
}

export class LambdaAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: LambdaAppStackProps) {
    super(scope, id);
    const vpc = ec2.Vpc.fromLookup(this, "vpc", {
      vpcId: vpcs[props.stage],
    });

    // You don't have to use a "Docker Lambda" but I've found it to be the most reliable to setup in the CDK
    // A standard lambda probably has a faster cold start
    const app = new lambda.DockerImageFunction(this, "LambdaTemplateApp", {
      ...props,
      functionName: `${props.stage}-<app-name>-lambda`,
      code: lambda.DockerImageCode.fromImageAsset(
        path.join(__dirname, "../.."),
        {
          file: "deploy/docker/lambda.Dockerfile",
          platform: Platform.LINUX_AMD64,
        },
      ),
      memorySize: 512,
      timeout: cdk.Duration.minutes(1),
      vpc,
      environment: {
        ENVIRONMENT: props.stage,
      },
    });

    // only add alarms/health checks for non-staging environments
    const period = {
      period: cdk.Duration.minutes(2), // measure over 2 minute period
    };

    this.addAlarm(`${props.stage}-FunctionUrl500sPercentageAlarm`, {
      metric: new cw.MathExpression({
        expression: "(fives / total)*100",
        usingMetrics: {
          fives: app.metric("Url5xxCount", period),
          total: app.metricInvocations(period),
        },
        ...period,
      }),
      threshold: 5, // 5% of requests
      evaluationPeriods: 2, // makes sure that it's not transitory
      alarmName: `${props.stage}-FunctionUrl500sPercentage`,
      alarmDescription: `The percent of all ${props.stage} ${app.functionName} calls resulting in 500s`,
      actionsEnabled: true,
      treatMissingData: cw.TreatMissingData.IGNORE, // makes it so that we don't go into INSUFFICIENT_DATA mode, maintains state before data went missing
    });

    app.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ["*"],
      },
    });
  }

  addAlarm(name: string, props: cw.AlarmProps) {
    const iTopic = {
      bind(_scope: Construct, _alarm: cw.IAlarm) {
        return {
          alarmActionArn: "<alarm-arn>",
        };
      },
    };

    const failure = new cw.Alarm(this, name, props);

    failure.addAlarmAction(iTopic);
    failure.addOkAction(iTopic);
  }
}
