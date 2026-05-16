process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; 
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
require('dotenv').config({ quiet: true });

const COM_PORT = 'COM3';
const COM_PORT_LINUX = '/dev/ttyACM0';
const AUTH_TOKEN = 'Bearer ' + process.env.SENSOR_TOKEN;
const API_URL = 'https://localhost:3000/v1';
const API_URL_DATA = API_URL + '/readings';
const API_URL_SENSOR = API_URL + '/technical/nodes';

async function main() {
  const existingSensors = await fetchExistingSensors();

  let temperatureSensor = await getOrRegisterSensor(existingSensors, 'name 1', 'description 1', 'location 1', 'building 1', 'floor 1');
  let pressureSensor = await getOrRegisterSensor(existingSensors, 'name 2', 'description 2', 'location 2', 'building 2', 'floor 2');
  let co2Sensor = await getOrRegisterSensor(existingSensors, 'name 3', 'description 3', 'location 3', 'building 3', 'floor 3');
  let matrixSensor = await getOrRegisterSensor(existingSensors, 'name 4', 'description 4', 'location 4', 'building 4', 'floor 4');

  const port = new SerialPort({
    path: (process.platform === 'linux') ? COM_PORT_LINUX : COM_PORT,
    baudRate: 9600, 
  });

  const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
  
  parser.on('data', async (data) => {
    const dataArray = data.split(':');
    let sensorId = 0;
    
    switch(dataArray[0]) {
      case 'temperature':
        sensorId = temperatureSensor;
        console.log(` > temperature: ${dataArray[1]}`); break;
      case 'pressure':
        sensorId = pressureSensor;
        console.log(` > pressure: ${dataArray[1]}`); break;
      case 'co2':
        sensorId = co2Sensor;
        console.log(` > co2: ${dataArray[1]}`); break;
      case 'matrix':
        sensorId = matrixSensor;
        console.log(` > matrix: ${dataArray[1]}`); break;
      default:
        console.log(` > Data: ${dataArray[1]}`);
    }
    
    if(sensorId != 0) {
      const value = parseFloat(dataArray[1]);
      if(isNaN(value)) return;
      await postData(sensorId, value);
    }
  });

  port.on('error', (err) => {
    console.error(`ERROR SERIAL: ${err.message}`);
  });
}

async function fetchExistingSensors() {
  try {
    const response = await fetch(API_URL_SENSOR, {
      method: 'GET',
      headers: {
        'Authorization': AUTH_TOKEN
      }
    });
    
    if (!response.ok) {
      console.error(`ERROR API (GET): ${response.status}`);
      return [];
    }
    
    return await response.json(); 
  } catch (err) {
    console.error(`ERROR REQUEST (GET): ${err.message}`);
    return [];
  }
}

async function getOrRegisterSensor(existingSensors, name, type, location, building, floor) {
  const existing = existingSensors.find(sensor => sensor.name === name);
  
  if (existing) {
    console.log(` > Found existing: [${name}] ${existing.nodeId}`);
    return existing.nodeId;
  }

  try {
    const response = await fetch(API_URL_SENSOR, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': AUTH_TOKEN
      },
      body: JSON.stringify({
        name,
        type,
        location,
        building,
        floor
      }) 
    });
    
    if (!response.ok) {
      console.error(`ERROR API (POST): ${response.status}`);
    } else {
      const data = await response.json();
      const idToReturn = data.sensorId || data.nodeId; 
      console.log(` > Registered: [${name}] ${idToReturn}`);
      return idToReturn;
    }
  } catch (err) {
    console.error(`ERROR REQUEST (POST): ${err.message}`);
  }
}

async function postData(sensorId, value) {
  try {
    const response = await fetch(API_URL_DATA, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': AUTH_TOKEN
      },
      body: JSON.stringify({ sensorId, value })
    });
    
    if(!response.ok) console.error(`ERROR API: ${response.status}`);
    else console.log(` < POST: [${sensorId}] ${value}`);
  } catch (err) {
    console.error(`ERROR REQUEST: ${err.message}`);
  }
}

main();