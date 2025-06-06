import React, { useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import ReactMarkdown from "react-markdown";

const questions = [
  {
    q: "Q1. 귀하의 연령대는 어떻게 되시나요?",
    options: ["20대", "30대", "40대", "50대", "60대 이상"],
  },
  {
    q: "Q2. 귀하의 직업 유형은 무엇인가요?",
    options: ["직장인", "자영업자(사업자)", "프리랜서", "은퇴자", "학생", "기타"],
  },
  {
    q: "Q3. 이번 자산 운용의 주요 목적은 무엇인가요?",
    options: ["자산 증식", "정기적인 수익 확보", "노후 대비", "주택 구입 등 목돈 마련", "원금 보존"],
  },
  {
    q: "Q4. 월 평균 소득 수준은 어느 정도인가요?",
    options: ["200만 원 이하", "200~500만 원", "500~1000만 원", "1000만 원 이상"],
  },
  {
    q: "Q5. 현재 투자에 활용 가능한 자금 규모는 어느 정도인가요?",
    options: ["500만 원 이하", "500~1000만 원", "1000~5000만 원", "5000만~1억 원", "1억 원 이상"],
  },
  {
    q: "Q6. 해당 자금의 투자 가능 기간은?",
    options: ["1년 이하", "1~3년", "3~5년", "5~10년", "10년 이상"],
  },
  {
    q: "Q7. 전체 자산 중 투자에 활용 가능한 비중은?",
    options: ["10% 이하", "10~30%", "30~50%", "50% 이상"],
  },
  {
    q: "Q8. 감내할 수 있는 투자 위험 수준은 어느 정도인가요?",
    options: ["매우 낮음", "낮음", "보통", "높음", "매우 높음"],
  },
  {
    q: "Q9. 본인의 금융 지식 및 투자 경험 수준은 어느 정도인가요?",
    options: ["전혀 없음", "초급", "중급", "고급", "전문가"],
  },
  {
    q: "Q10. 금융 상품에서 가장 중요하게 여기는 요소는 무엇인가요?",
    options: ["안정성", "수익성", "유동성", "세제 혜택", "시장 대응 유연성"],
  },
  {
    q: "Q11. 시장 변화에 따라 전략을 변경할 수 있나요?",
    options: ["가능", "불가능", "잘 모르겠음"],
  },
  {
    q: "Q12. 외화 자산이나 해외 투자에도 관심이 있나요?",
    options: ["있음", "없음", "고려 중"],
  },
  {
    q: "Q13. 현재 부채 수준은 어느 정도인가요?",
    options: ["없음", "소액 (월 소득의 30% 이하)", "많음 (월 소득의 30% 이상)"],
  },
  {
    q: "Q14. 선호하는 투자 상품 유형을 모두 선택해주세요. (복수 선택 가능)",
    options: ["예금", "적금", "보험", "연금", "펀드", "주식", "ETF", "부동산", "대체투자", "없음"],
    multi: true,
  },
  {
    q: "Q15. 현재 관심 있는 투자 전략 기간은?",
    options: ["단기 (1년 이하)", "중기 (1~3년)", "장기 (3년 이상)"],
  },
];

export default function Portfolio() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [strategy, setStrategy] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);

  const current = questions[step];

  const handleSelect = (value) => {
    if (current.multi) {
      const prev = answers[current.q] || [];
      const updated = prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value];
      setAnswers({ ...answers, [current.q]: updated });
    } else {
      setAnswers({ ...answers, [current.q]: value });
    }
  };

  const canProceed = () => {
    if (current.multi) {
      return answers[current.q]?.length > 0;
    } else {
      return !!answers[current.q];
    }
  };

  const handleNext = async () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setLoading(true);
      try {
        const res = await axios.post("/api/portfolio/recommend", {
          responses: answers,
        });
        setStrategy(res.data.strategy);
      } catch (err) {
        alert("추천 요청에 실패했습니다.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Layout>
      <div className="flex justify-center items-start py-12 bg-white min-h-screen">
        <div className="bg-blue-50 shadow-md rounded-lg p-10 w-full max-w-3xl text-center">
          {!started ? (
            <>
              <h2 className="text-2xl font-bold text-blue-700 mb-4">📊 맞춤형 포트폴리오 전략</h2>
              <p className="text-base text-gray-700 mb-6 leading-relaxed">
                이 설문은 투자 성향과 재무 상황을 분석해<br />
                개인 맞춤형 전략을 추천하기 위한 과정입니다. <br />
                소요 시간은 약 1~2분 정도예요.
              </p>
              <button
                className="bg-white border border-blue-600 text-blue-700 px-6 py-2 rounded font-bold hover:bg-blue-100"
                onClick={() => setStarted(true)}
              >
                설문 시작하기
              </button>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-blue-700 mb-6">📋 설문 진행 중</h2>

              <p className="mb-3 font-semibold text-left">{current.q}</p>
              <div className="flex flex-wrap gap-2 mb-6 justify-start">
                {current.options.map((opt) => {
                  const isMulti = current.multi;
                  const checked = isMulti
                    ? Array.isArray(answers[current.q]) &&
                      answers[current.q].includes(opt)
                    : answers[current.q] === opt;

                  return (
                    <button
                      key={opt}
                      type="button"
                      className={`px-4 py-2 rounded-lg border transition ${
                        checked
                          ? "bg-blue-500 text-white border-blue-600"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-blue-100"
                      }`}
                      onClick={() => handleSelect(opt)}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              
              
              <div className="flex justify-between">
                <button
                  onClick={() => setStep(step - 1)}
                  disabled={step === 0}
                  className={`px-4 py-2 rounded ${
                    step === 0
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  이전
                </button>

                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className={`px-4 py-2 rounded ${
                    canProceed()
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {step === questions.length - 1 ? "제출" : "다음"}
                </button>
              </div>

              {loading && (
                <p className="mt-6 text-gray-500">전략 분석 중입니다... ⏳ 1~2분 정도 소요될 수 있어요!</p>
              )}

              {strategy && (
                <>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
      사용자의 설문 응답을 바탕으로 초기 포트폴리오 전략을 구성했으며,<br />
      최근 금융 뉴스 및 시장 상황을 참고하여 맞춤화된 전략을 추천해드립니다.
    </p>
  <div className="mt-8 p-6 bg-white border rounded-xl shadow text-left">
    <h2 className="text-xl font-bold mb-3">📌 추천 전략</h2>

    <ReactMarkdown
      components={{
        h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-4 mb-2" {...props} />,
        h2: ({ node, ...props }) => <h2 className="text-xl font-semibold mt-4 mb-2" {...props} />,
        h3: ({ node, ...props }) => <h3 className="text-lg font-semibold mt-3 mb-1" {...props} />,
        ul: ({ node, ...props }) => <ul className="list-disc pl-6 space-y-1 mb-2" {...props} />,
        li: ({ node, ...props }) => <li className="text-gray-800" {...props} />,
        p: ({ node, ...props }) => <p className="text-gray-700 mb-2 leading-relaxed" {...props} />,
        strong: ({ node, ...props }) => <strong className="font-semibold text-black" {...props} />,
        pre: ({ node, ...props }) => (
          <pre className="bg-gray-100 p-3 rounded mb-2 overflow-x-auto text-sm" {...props} />
        ),
      }}
    >
      {strategy}
    </ReactMarkdown>
  </div>
  </>
)}

            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
