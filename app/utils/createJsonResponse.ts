export function createJsonResponse(
  data: any,
  status: number = 200
) {
  return new Response(JSON.stringify({
    success: status >= 200 && status < 300,
    ...data
  }), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
