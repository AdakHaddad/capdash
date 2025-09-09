export async function GET() {
  return Response.json({
    status: 'ok',
    message: 'API connection successful',
    timestamp: new Date().toISOString()
  });
}