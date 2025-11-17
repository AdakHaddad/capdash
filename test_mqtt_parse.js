// Test MQTT JSON parsing
const testPayload = `{"ts":1288664,"mode":"AUTO","bme":{"t":25.02,"p":997,"h":57.2},"ds18b20":[-127.00,0.00,0.00],"soil":[100,100,100],"water":[0.1,1.8],"valve":[0,0,0],"pump":[0,0]}`;

console.log('🧪 Testing STM32 JSON Payload Parsing\n');
console.log('Raw payload:', testPayload);
console.log('\n');

try {
  const data = JSON.parse(testPayload);
  
  console.log('✅ JSON Parse Successful!');
  console.log('Parsed data:', data);
  console.log('\n');
  
  // Check for STM32 format
  if (typeof data === 'object' && data.bme && data.bme.t !== undefined) {
    console.log('✅ STM32 Format Detected!');
    console.log('\n');
    
    const soilTemps = data.ds18b20 || [];
    const soilMoisture = data.soil || [];
    const waterLevels = data.water || [];
    const valves = data.valve || [0, 0, 0];
    const pumps = data.pump || [0, 0];

    // Filter out invalid DS18B20 readings (-127 means sensor error)
    const validSoilTemps = soilTemps.filter(temp => temp > -100);
    const avgSoilTemp = validSoilTemps.length > 0 
      ? validSoilTemps.reduce((a, b) => a + b, 0) / validSoilTemps.length 
      : data.bme.t;

    const sensorData = {
      pressure: data.bme.p,
      airTemp: data.bme.t,
      airHumidity: data.bme.h,
      soilTemp: avgSoilTemp,
      soilHumidity: soilMoisture.length > 0 ? soilMoisture.reduce((a, b) => a + b, 0) / soilMoisture.length : 0,
      waterLevel: waterLevels.length > 0 ? waterLevels.reduce((a, b) => a + b, 0) / waterLevels.length : 0,
      ds_t: soilTemps,
      soil: soilMoisture,
      water: waterLevels,
    };

    const pumpData = {
      irrigation: pumps[0] === 1,
      suction: pumps[1] === 1,
    };

    const valveData = {
      valve1: valves[0] === 1,
      valve2: valves[1] === 1,
      valve3: valves[2] === 1,
    };

    console.log('📊 Extracted Sensor Data:');
    console.log(JSON.stringify(sensorData, null, 2));
    console.log('\n');
    
    console.log('💧 Pump Status:');
    console.log(JSON.stringify(pumpData, null, 2));
    console.log('\n');
    
    console.log('🚰 Valve Status:');
    console.log(JSON.stringify(valveData, null, 2));
    console.log('\n');
    
    console.log('✅ Dashboard should show:');
    console.log(`   Air Temp: ${data.bme.t}°C`);
    console.log(`   Pressure: ${data.bme.p} hPa`);
    console.log(`   Air Humidity: ${data.bme.h}%`);
    console.log(`   Soil Moisture: ${sensorData.soilHumidity}%`);
    console.log(`   Water Level: ${sensorData.waterLevel}%`);
    console.log(`   Mode: ${data.mode}`);
    console.log(`   Pumps: ${pumps[0] ? 'ON' : 'OFF'} / ${pumps[1] ? 'ON' : 'OFF'}`);
  } else {
    console.log('❌ Not STM32 format');
  }
} catch (error) {
  console.error('❌ Parse Error:', error.message);
}
