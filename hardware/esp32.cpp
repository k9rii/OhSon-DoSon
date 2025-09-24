// esp32_code/main.cpp

#include <Arduino.h>
#include <WiFi.h>
#include <FirebaseESP32.h>
#include <HardwareSerial.h>

// --- 1. 와이파이(WiFi) 정보 입력 ---
#define WIFI_SSID "JOOOO"
#define WIFI_PASSWORD "987654a!"

// --- 2. 파이어베이스(Firebase) 정보 입력 ---
#define FIREBASE_HOST "https://ohson-doson-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH "AIzaSyDlTN1eX4Sw0EUkqy6ptplckuJmiwvVKv0"

// --- 객체 선언 ---
FirebaseData firebaseData;
FirebaseAuth firebaseAuth;
FirebaseConfig firebaseConfig;
HardwareSerial SerialPort(2); // TX2: GPIO17, RX2: GPIO16

// --- 센서 및 전송 간격 설정 ---
const int soundSensorPin = 34;
const int vibrationSensorPin = 35;
const int sampleWindow = 50;
unsigned long sendDataPrevMillis = 0;
const long sendDataInterval = 5000;

void setup() {
  Serial.begin(115200); // PC와의 통신용
  SerialPort.begin(115200, SERIAL_8N1, 16, 17); // 아두이노 우노와의 통신용

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }
  Serial.println("\nConnected!");

  firebaseConfig.host = FIREBASE_HOST;
  firebaseConfig.signer.tokens.legacy_token = FIREBASE_AUTH;
  Firebase.begin(&firebaseConfig, &firebaseAuth);
  Firebase.reconnectWiFi(true);
}

void loop() {
  // 1. 센서 값 측정 (소음 + 진동)
  unsigned long startMillis = millis();
  unsigned int soundSignalMax = 0, soundSignalMin = 4095;
  unsigned int vibeSignalMax = 0, vibeSignalMin = 4095;

  while (millis() - startMillis < sampleWindow) {
    int soundSample = analogRead(soundSensorPin);
    if (soundSample > soundSignalMax) soundSignalMax = soundSample;
    if (soundSample < soundSignalMin) soundSignalMin = soundSample;
    int vibeSample = analogRead(vibrationSensorPin);
    if (vibeSample > vibeSignalMax) vibeSignalMax = vibeSample;
    if (vibeSample < vibeSignalMin) vibeSignalMin = vibeSample;
  }
  unsigned int soundPeakToPeak = soundSignalMax - soundSignalMin;
  unsigned int vibrationPeakToPeak = vibeSignalMax - vibeSignalMin;
  unsigned int totalPeakToPeak = soundPeakToPeak + vibrationPeakToPeak;
  double decibel = map(totalPeakToPeak, 40, 3000, 40, 100);

  // 2. 측정된 데시벨에 따라 LED 상태 결정 및 아두이노로 명령 전송 (✅ 기준값 수정됨)
  if (decibel < 30) {
    SerialPort.print("Q\n"); // Quiet (조용함)
  } else if (decibel < 50) {
    SerialPort.print("N\n"); // Normal (보통)
  } else {
    SerialPort.print("L\n"); // Loud (시끄러움)
  }

  // PC 시리얼 모니터에 현재 상태 출력 (디버깅용)
  Serial.print("Decibel: ");
  Serial.print(decibel);
  Serial.println(" dB");

  // 3. 5초마다 파이어베이스에 데이터 전송
  if (millis() - sendDataPrevMillis >= sendDataInterval) {
    sendDataPrevMillis = millis();

    String path = "/soundData/history";
    FirebaseJson json;
    json.set("decibel", decibel);
    json.set("timestamp/.sv", "timestamp");

    Serial.println("Firebase에 데이터 추가 시도...");
    if (Firebase.pushJSON(firebaseData, path, json)) {
      Serial.println("데이터 추가 성공!");
    } else {
      Serial.println("데이터 추가 실패: " + firebaseData.errorReason());
    }
  }

  delay(200); // 너무 빠른 데이터 전송을 막기 위해 약간의 딜레이
}