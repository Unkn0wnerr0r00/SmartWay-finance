import React, { useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import ReactMarkdown from "react-markdown";



export default function Summary() {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const today = new Date().toISOString().slice(0, 10);

  const recentDates = [...Array(7)].map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().slice(0, 10);
  });

  const fetchSummary = async (date) => {
    setLoading(true);
    setError("");
    setSummary([]);
    console.log("요청 날짜:", date);
    try {
      const response = await axios.get(
        `/api/summary/summary?date=${date}`
      );
      setSummary(response.data.summary);
    } catch (err) {
      setError(" 뉴스 요약을 불러오는 데 실패했습니다.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex justify-center items-start py-12 bg-white min-h-screen">
        <div className="bg-blue-50 shadow-md rounded-lg p-10 w-full max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-blue-700 mb-4">📰 금융 뉴스 요약</h2>
          <p className="text-gray-700 text-base mb-6 leading-relaxed">
            매일 주요 금융 뉴스를 요약해서 한눈에 보여드립니다.
            <br />
            아래 버튼을 눌러 오늘의 뉴스를 확인하거나, 날짜를 선택해 이전 뉴스도 확인해보세요.
          </p>

          
          
          <button
            onClick={() => fetchSummary(today)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded shadow mb-6"
            disabled={loading}
          >
            {loading ? "불러오는 중..." : "오늘의 뉴스 요약 보기"}
          </button>

          
          
          <div className="mb-8 text-sm text-gray-700">
            <label htmlFor="dateSelect" className="mr-2">
              📅 최근 날짜 선택:
            </label>
            <select
              id="dateSelect"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                fetchSummary(e.target.value);
              }}
              className="border rounded px-2 py-1"
            >
              <option value="">-- 날짜 선택 --</option>
              {recentDates.map((date) => (
                <option key={date} value={date}>
                  {date}
                </option>
              ))}
            </select>
          </div>
 
      
          
          {error && (
            <p className="text-red-500 font-semibold mb-4">{error}</p>
          )}

        
          
          <div className="space-y-4 text-left">
            {summary
              .filter((line) => line.trim() !== "")
              .map((item, index) => (
                <div
                  key={index}
                  className="bg-white border-l-4 border-blue-500 p-4 shadow rounded"
                >
                  <ReactMarkdown
                  components={{
                    p: ({ node, children, ...props }) => (
                    <p className="text-gray-800 text-sm leading-relaxed" {...props}>{children}</p>
                  ),
                  strong: ({ node, children, ...props }) => (
                  <strong className="font-semibold text-black" {...props}>{children}</strong>
                ),
                li: ({ node, children, ...props }) => (
                <li className="list-disc ml-6 text-sm text-gray-700" {...props}>{children}</li>
              )
              }}
              >
                {item}
                </ReactMarkdown>

                </div>
              ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
