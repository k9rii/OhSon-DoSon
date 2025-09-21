import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv

# .env 파일에서 환경 변수 로드
load_dotenv()

# Flask 앱 초기화 및 CORS 설정
app = Flask(__name__)
CORS(app) # 모든 경로에 대해 CORS 허용

# Gemini API 키 설정
try:
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY가 설정되지 않았습니다.")
    genai.configure(api_key=api_key)
except Exception as e:
    print(f"API 키 설정 중 오류 발생: {e}")


# 문장 순화를 위한 API 엔드포인트 정의
@app.route('/api/refine', methods=['POST'])
def refine_message():
    # 1. 프론트엔드에서 보낸 원본 메시지 받기
    data = request.get_json()
    if not data or 'message' not in data:
        return jsonify({'error': '메시지가 없습니다.'}), 400
    
    original_message = data['message']

    # 2. Gemini 모델 설정 및 프롬프트 작성
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = f"""
        당신은 아파트 이웃 간의 소통을 돕는 서비스 '오손도손'의 메시지 순화 전문 AI입니다.
        사용자가 입력한 아래의 거친 메시지를 받아서, 이웃의 기분을 상하게 하지 않으면서도 핵심 의미는 전달될 수 있도록 정중하고 부드러운 표현으로 바꿔주세요.
        결과는 다른 설명 없이 순화된 문장만 반환해야 합니다.

        사용자 원본 메시지: "{original_message}"
        순화된 메시지:
        """

        # 3. Gemini API 호출
        response = model.generate_content(prompt)
        refined_text = response.text.strip()
        
        # 4. 순화된 메시지를 프론트엔드에 JSON 형태로 반환
        return jsonify({'refinedMessage': refined_text})

    except Exception as e:
        print(f"Gemini API 호출 중 오류 발생: {e}")
        return jsonify({'error': 'AI 모델을 호출하는 데 실패했습니다.'}), 500


# 서버 실행
if __name__ == '__main__':
    app.run(debug=True, port=5000)