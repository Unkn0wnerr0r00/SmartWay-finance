// src/pages/Home.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

export default function Home() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="flex justify-center items-start py-12 bg-white min-h-screen">
        <div className="bg-blue-50 shadow-md rounded-lg p-10 w-full max-w-3xl text-center">
          <h1 className="text-3xl font-bold text-blue-700 mb-6">💡 스마트 금융을 위한 시작</h1>

          <p className="text-lg text-gray-700 mb-10 leading-relaxed">
            스마트웨이팀의 종합 금융 서비스는 <strong className="text-blue-700">금융 뉴스 요약</strong>,
            <strong className="text-blue-700">포트폴리오 전략 추천</strong>, <strong className="text-blue-700">AI 챗봇 상담</strong>을 통해
            누구나 쉽고 빠르게 금융 정보를 확인하고, 자신에게 맞는 전략을 찾아갈 수 있도록 도와줍니다.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">

            {/* 포트폴리오 카드 */}
            <div
              onClick={() => navigate("/portfolio")}
              className="cursor-pointer bg-white p-6 rounded-xl shadow hover:bg-blue-100 transition"
            >
              <h3 className="text-xl font-bold mb-2">📊 포트폴리오 추천</h3>
              <p className="text-sm text-gray-700">
                설문을 통해 투자 성향을 분석하고, 시장과 뉴스 흐름을 반영한 전략을 제안합니다.
              </p>
            </div>
            
            {/* 뉴스 요약 카드 */}
            <div
              onClick={() => navigate("/summary")}
              className="cursor-pointer bg-white p-6 rounded-xl shadow hover:bg-blue-100 transition"
            >
              <h3 className="text-xl font-bold mb-2">📰 뉴스 요약</h3>
              <p className="text-sm text-gray-700">
                하루 4번 업데이트되는 최신 금융 뉴스를 요약해서 한눈에 제공합니다.
              </p>
            </div>


            {/* 챗봇 카드 */}
            <div
              onClick={() => navigate("/chat")}
              className="cursor-pointer bg-white p-6 rounded-xl shadow hover:bg-blue-100 transition"
            >
              <h3 className="text-xl font-bold mb-2">💬 금융 챗봇</h3>
              <p className="text-sm text-gray-700">
                궁금한 금융 이슈나 전략에 대해 자연어로 질문하면 AI 챗봇이 응답해드립니다.
              </p>
            </div>
          </div>

          <p className="mt-10 text-sm text-gray-600">
            👉 설문을 먼저 진행하여 포트폴리오 전략을 추천받고, 뉴스 요약과 챗봇으로 꾸준히 시장을 확인하세요!
          </p>
        </div>
      </div>
    </Layout>
  );
}
