// uno_code/main.cpp

#include <Adafruit_NeoPixel.h>

// --- 아두이노 우노 설정 ---
#define LED_PIN    6
#define LED_COUNT 12
// ------------------------

Adafruit_NeoPixel strip(LED_COUNT, LED_PIN, NEO_GRB + NEO_KHZ800);

char currentState = ' '; // 현재 상태 저장 변수
unsigned long animationTimer = 0;

// 사용할 함수 미리 선언
void showQuietState();
void showNormalState();
void showLoudState();

void setup() {
  Serial.begin(115200);
  strip.begin();
  strip.setBrightness(60);
  strip.show();
}

void loop() {
  // ESP32로부터 새로운 명령이 들어왔는지 확인
  if (Serial.available() > 0) {
    char command = Serial.read();
    if (command != '\n' && command != currentState) { // 상태가 변경되었을 때만 업데이트
      currentState = command;
    }
  }

  // 현재 소음 수준에 따라 적절한 애니메이션 실행
  switch (currentState) {
    case 'Q': showQuietState(); break;  // 조용할 때
    case 'N': showNormalState(); break; // 보통일 때
    case 'L': showLoudState(); break;   // 시끄러울 때
  }
}

// --- 각 소음 수준별 LED 애니메이션 함수 ---

// '조용함' 상태: 파란색 빛이 부드럽게 숨 쉬는 효과
void showQuietState() {
  float brightness = (sin(millis() / 2000.0 * PI) + 1.0) / 2.0 * 150.0;
  for (int i=0; i<LED_COUNT; i++) {
    strip.setPixelColor(i, strip.Color(0, 0, (int)brightness)); // Blue
  }
  strip.show();
}

// '보통' 상태: 노란색이 켜진 상태
void showNormalState() {
  for (int i=0; i<LED_COUNT; i++) {
    strip.setPixelColor(i, strip.Color(150, 100, 0)); // Yellow/Orange
  }
  strip.show();
}

// '시끄러움' 상태: 빨간색이 빠르게 깜빡이는 효과
void showLoudState() {
  if (millis() - animationTimer > 150) {
    animationTimer = millis();
    if (strip.getPixelColor(0) == 0) {
      for (int i=0; i<LED_COUNT; i++) strip.setPixelColor(i, strip.Color(255, 0, 0)); // Red
    } else {
      strip.clear();
    }
    strip.show();
  }
}