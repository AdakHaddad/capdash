export async function GET() {
  // Simulate sensor data - replace with actual sensor reading logic
  const sensorData = {
    pressure: Math.floor(700 + Math.random() * 200),
    soilTemp: Math.floor(30 + Math.random() * 10),
    soilHumidity: Math.floor(60 + Math.random() * 30),
    waterLevel: Math.floor(10 + Math.random() * 20),
    airTemp: Math.floor(30 + Math.random() * 10),
    airHumidity: Math.floor(60 + Math.random() * 30)
  };

  return Response.json(sensorData);
}