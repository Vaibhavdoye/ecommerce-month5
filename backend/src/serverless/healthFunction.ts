export interface ServerlessEvent {
  httpMethod?: string;
  body?: string | null;
}

export interface ServerlessResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

export const handler = async (
  _event: ServerlessEvent
): Promise<ServerlessResponse> => {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      success: true,
      message: "Serverless function is working",
      timestamp: new Date().toISOString(),
    }),
  };
};
