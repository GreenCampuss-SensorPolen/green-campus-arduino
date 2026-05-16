void setup() {
  Serial.begin(9600);
}

void loop() {
  Serial.print("temperature:");
  Serial.println(getMockedValue(20.0, 30.0));
  Serial.print("pressure:");
  Serial.println(getMockedValue(1000.0, 1020.0));
  Serial.print("co2:");
  Serial.println(getMockedValue(400.0, 1000.0));
  Serial.print("matrix:");
  Serial.println(getMockedValue(22.0, 28.0));
  delay(5000);
}

float getMockedValue(float minVal, float maxVal) {
  return minVal + ((float)rand() / (float)RAND_MAX) * (maxVal - minVal);
}