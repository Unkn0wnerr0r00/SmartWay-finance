import React, { useState } from "react";
import Layout from "../components/Layout";

export default function Chat() {
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "무엇이 궁금하신가요? (예: 요즘 금리 동향 어때?)",
    },
  ]);
  const [input, setInput] = useState("");

 async function sendMessage(e) {
  e.preventDefault();
  if (!input.trim()) return;

  // 사용자 메시지 추가
  const newMessages = [...messages, { from: "user", text: input }];
  setMessages(newMessages);
  setInput("");

  try {
    const res = await fetch("/api/chatbot/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: input }),
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    
    let done = false;

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      if (value) {
        const chunk = decoder.decode(value);
        

        // 실시간 메시지 추가
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.from === "bot") {
            // 기존 bot 메시지 업데이트
            return [...prev.slice(0, -1), { from: "bot", text: last.text + chunk }];
          } else {
            return [...prev, { from: "bot", text: chunk }];
          }
        });
      }
    }
  } catch (err) {
    setMessages((prev) => [
      ...prev,
      { from: "bot", text: " 서버 응답 중 오류가 발생했습니다." },
    ]);
    console.error("에러 발생:", err);
  }
}











  return (
    <Layout>
      <div className="flex justify-center items-start py-12 bg-white min-h-screen">
        <div className="bg-blue-50 shadow-md rounded-lg p-10 w-full max-w-3xl text-center">
          <h1 className="text-3xl font-bold text-blue-700 mb-6">💬 금융 챗봇</h1>
          <p className="text-gray-700 mb-6 leading-relaxed text-base">
            금융에 대해 궁금한 것을 자유롭게 물어보세요!<br />
            예) 요즘 금리 동향은 어떤가요? / ETF란 뭔가요?
          </p>

          {/* 채팅 메시지 박스 */}
          <div className="bg-white rounded border mb-6 p-4 text-left space-y-2">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${
                  m.from === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <span
                  className={`px-3 py-2 rounded-lg max-w-[70%] text-sm ${
                    m.from === "user"
                      ? "bg-blue-100 text-right"
                      : "bg-gray-200 text-left"
                  }`}
                >
                  {m.text}
                </span>
              </div>
            ))}
          </div>

          {/* 입력창 */}
          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="질문을 입력하세요..."
              className="flex-1 border rounded px-4 py-2 text-sm"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 text-sm"
            >
              전송
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
