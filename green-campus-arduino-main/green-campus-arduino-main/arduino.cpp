#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>
#include <Adafruit_AMG88xx.h>
#include <SensirionI2cScd4x.h>

// Initialize sensors
Adafruit_BME280 bme;
Adafruit_AMG88xx amg;
SensirionI2cScd4x scd4x;

void setup() {
  Serial.begin(9600);
  Wire.begin();
  // BME280 Setup
  if(!bme.begin(0x76)) { // 0x76 is common, some use 0x77
    Serial.println("ERROR:Could not find BME280!");
  }
  // AMG8833 Setup
  if(!amg.begin()) {
    Serial.println("ERROR:Could not find AMG8833!");
  }
  // SCD41 Setup
  scd4x.begin(Wire, 0x62);
  scd4x.stopPeriodicMeasurement();
  scd4x.startPeriodicMeasurement();
}

void loop() {
  // Read BME280
  Serial.print("temperature:");
  Serial.println(bme.readTemperature());                    // C
  Serial.print("pressure:");
  Serial.println((bme.readPressure()/100.0F));              // hPa

  // Read SCD41
  uint16_t co2 = 0;
  float t, h;
  if(scd4x.readMeasurement(co2, t, h) == 0) {
    Serial.print("co2:");
    Serial.println(co2);                                    // ppm
  }

  // Read AMG8833
  float pixels[64];
  amg.readPixels(pixels);
  float sum = 0;
  for(int i = 0; i < 64; i++) { sum += pixels[i]; }
  Serial.print("matrix:");
  Serial.println((sum/64));                                 // C

  // 5 second interval
  delay(5000);
}