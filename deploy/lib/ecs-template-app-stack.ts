import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as logs from "aws-cdk-lib/aws-logs";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import * as cw from "aws-cdk-lib/aws-cloudwatch";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

const vpcs = {
  staging: "<vpc-id>",
  prod: "<vpc-id>",
};

interface ECSAppStackProps extends cdk.StackProps {
  readonly stage: "staging" | "prod";
  readonly taskCount: number;
  readonly cpu: number;
  readonly ecsMaxMemory: number;
}

// This stack requires that the application docker image already be in AWS ECR at time of deployment
// An application code update only requires pushing new image to ecr and then force redeploying ECS (see github workflow)
export class ECSTemplateAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ECSAppStackProps) {
    super(scope, id, props);
    const vpc = ec2.Vpc.fromLookup(this, "vpc", {
      vpcId: vpcs[props.stage],
    });

    const repository = ecr.Repository.fromRepositoryArn(
      this,
      "ecr",
      "<repository-arn>",
    );

    const cluster = new ecs.Cluster(this, "TemplateCluster", {
      clusterName: `${props.stage}-<app-name>`,
      vpc,
    });

    const service = new ecs_patterns.ApplicationLoadBalancedFargateService(
      this,
      "TemplateAppService",
      {
        cluster, // Required
        cpu: props.cpu, // Default is 256, .5vCPU
        desiredCount: props.taskCount,
        serviceName: `${props.stage}-<app-name>`,
        taskImageOptions: {
          image: ecs.ContainerImage.fromEcrRepository(repository, props.stage), // the image will be tagged with the environment name (e.g. "staging")
          containerName: `${props.stage}-<app-name>-container`,
          family: `${props.stage}-<app-name>-task-definitions`,
          containerPort: 8080,
          environment: {},
          executionRole: this.getExecutionRole(props),
          taskRole: this.getTaskRole(props),
          secrets: {},
          entryPoint: ["yarn", "start"],
          logDriver: ecs.LogDrivers.awsLogs({
            streamPrefix: `${props.stage}-<app-name>`,
            logGroup: new logs.LogGroup(this, "TemplateLogGroup", {
              logGroupName: `/ecs/${props.stage}-<app-name>`,
            }),
          }),
        },
        loadBalancerName: `${props.stage}-<app-name>-loadbalancer`,
        memoryLimitMiB: props.ecsMaxMemory, // Default is 512
        // lots of options you can add here including load balancer type, subnet type, ssl cert.
        // Some things are not support by the "ApplicationLoadBalancedFargateService" and might be better off creating all pieces of the stack manually
      },
    );
    service.targetGroup.configureHealthCheck({
      path: "/health",
    });
    this.addAlarms(props, service);
  }

  getExecutionRole(props: ECSAppStackProps) {
    const executionRole = new iam.Role(this, "AppExecutionRole", {
      roleName: `${props.stage}-<app-name>-execution-role`,
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
    });
    // Add any iam policies to the execution role here
    return executionRole;
  }

  getTaskRole(props: ECSAppStackProps) {
    // Create the role that the ecs task will assume
    const taskRole = new iam.Role(this, "AppTaskRole", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
      roleName: `${props.stage}-<app-name>-task-role`,
    });
    // Add any iam policies to the execution role here
    return taskRole;
  }

  addAlarms(
    props: ECSAppStackProps,
    service: ecs_patterns.ApplicationLoadBalancedFargateService,
  ) {
    const iTopic = {
      bind(_scope: Construct, _alarm: cw.IAlarm) {
        return {
          alarmActionArn: "<alarm-arn>", // should be an SNS topic that would get picked up by a notif service
        };
      },
    };
    const period = {
      period: cdk.Duration.minutes(2), // measure over 2 minute period
    };

    const hCpu = new cw.Alarm(this, "HighCPUUtilizationAlarm", {
      metric: service.service.metricCpuUtilization(period),
      threshold: 70,
      evaluationPeriods: 2, // makes sure that it's not transitory
      alarmName: `${props.stage}-<app-name>HighCPUUtilizationAlarm`,
      alarmDescription: "CPU utilization is high",
      actionsEnabled: true,
    });
    hCpu.addAlarmAction(iTopic);
    hCpu.addOkAction(iTopic);

    const hMem = new cw.Alarm(this, "HighMemoryUtilizationAlarm", {
      metric: service.service.metricMemoryUtilization(period),
      threshold: 70,
      evaluationPeriods: 2, // makes sure that it's not transitory
      alarmName: `${props.stage}-<app-name>HighMemoryUtilizationAlarm`,
      alarmDescription: "Memory utilization is high",
      actionsEnabled: true,
    });

    hMem.addAlarmAction(iTopic);
    hMem.addOkAction(iTopic);

    const five = new cw.Alarm(this, "500sPercentageAlarm", {
      metric: new cw.MathExpression({
        expression: "(fives / total)*100",
        usingMetrics: {
          fives: service.targetGroup.metricHttpCodeTarget(
            elbv2.HttpCodeTarget.TARGET_5XX_COUNT,
            period,
          ),
          total: service.targetGroup.metricRequestCount(period),
        },
        period: cdk.Duration.minutes(2),
      }),
      threshold: 5, // 5% of requests
      evaluationPeriods: 2, // makes sure that it's not transitory
      alarmName: `${props.stage}-<app-name>500sPercentage`,
      alarmDescription: `The percent of all ${props.stage} calls resulting in 500s`,
      actionsEnabled: true,
      treatMissingData: cw.TreatMissingData.IGNORE,
    });
    five.addAlarmAction(iTopic);
    five.addOkAction(iTopic);

    const host = new cw.Alarm(this, "UnhealthyHostCountAlarm", {
      metric: service.targetGroup.metricUnhealthyHostCount(period),
      threshold: Math.ceil(props.taskCount * 0.7), // 70% of desired task count, round up so it's never 0.
      evaluationPeriods: 2, // makes sure that it's not transitory
      alarmName: `${props.stage}-<app-name>UnhealthyHostCountAlarm`,
      alarmDescription: "Number of unhealthy hosts is greater than 1",
      actionsEnabled: true,
    });
    host.addAlarmAction(iTopic);
    host.addOkAction(iTopic);
  }
}
