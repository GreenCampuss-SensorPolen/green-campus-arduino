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

  // 1. Tipos en MAYÚSCULAS para pasar la validación estricta de la API
  let temperatureSensor = await getOrRegisterSensor(existingSensors, 'Sensor Temperatura', 'TEMPERATURA', 'Aula 1', 'Edificio Principal', 'Planta Baja');
  let co2Sensor = await getOrRegisterSensor(existingSensors, 'Sensor CO2', 'CO2', 'Aula 1', 'Edificio Principal', 'Planta Baja');

  console.log("Iniciando Gemelo Digital sin hardware físico...");
  
  setInterval(async () => {
    // 2. Convertimos el resultado de toFixed de nuevo a Número real
    let tempMock = Number((20.0 + Math.random() * 5).toFixed(2));
    let co2Mock = Number((400.0 + Math.random() * 200).toFixed(0));
    
    // 3. Enviamos los datos solo si el registro anterior fue exitoso
    if (temperatureSensor) await postData(temperatureSensor, tempMock);
    if (co2Sensor) await postData(co2Sensor, co2Mock);
  }, 5000);
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
        floor,
        status: 'ONLINE',
        battery: 100
      }) 
    });
    
    if (!response.ok) {
      const errorText = await response.text(); // Leemos el mensaje de la API
      console.error(`ERROR API (POST) AL REGISTRAR [${name}]: ${errorText}`);
    } else {
    // -------------------------------------
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
      // Aseguramos que sensorId sea un número (Int) y value sea un número (Float)
      body: JSON.stringify({ 
        nodeId: Number(sensorId), 
        value: Number(value) 
      })
    });
    
    if(!response.ok) {
      const errorDetail = await response.text();
      console.error(`ERROR API (DATA): ${response.status} - ${errorDetail}`);
    } else {
      console.log(` < POST EXITOSO: [Sensor ${sensorId}] Valor: ${value}`);
    }
  } catch (err) {
    console.error(`ERROR REQUEST: ${err.message}`);
  }
}

main();