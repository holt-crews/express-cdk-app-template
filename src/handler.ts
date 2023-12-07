import serverless from "serverless-http";
import app from "./app";
import { APIGatewayProxyEventV2, Context, Handler } from "aws-lambda";

// The serverless-http utility basically just parses the API Gateway (works for "Function Url too") and passes it along to express
// This way, we can use exactly the same express API code for lambda and normal server deployments
const serverlessHandler = serverless(app, {
  provider: "aws",
});

export const handler: Handler = async (
  event: APIGatewayProxyEventV2,
  context: Context,
) => {
  return await serverlessHandler(event, context);
};
