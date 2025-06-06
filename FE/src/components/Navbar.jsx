// src/components/Navbar.jsx
import { Link, useLocation } from "react-router-dom";

// FINANCE 로고/타이틀 색상 (딥블루/네이비)
const NAVY = "text-blue-600";  // tailwind text-blue-800

export default function Navbar() {
  const location = useLocation();

  // 메뉴 리스트
  const menus = [
    { to: "/", text: "Home" },
    { to: "/portfolio", text: "Portfolio" },
    { to: "/summary", text: "Summary" },
    { to: "/chat", text: "Chat" },
  ];

  return (
    <nav className="flex flex-col items-center pt-8 pb-2 mb-8 bg-white">
      
      // 로고/타이틀

      <Link
        to="/"
        className={`text-5xl font-extrabold tracking-widest ${NAVY} mb-5`}
        style={{ letterSpacing: "0.1em" }}
      >
        FINANCE
      </Link>

      
      // 네비 메뉴
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-lg md:text-2xl mb-3">

        {menus.map(({ to, text }) => (
          <NavLinkItem
            key={to}
            to={to}
            text={text}
            current={location.pathname === to || (to !== "/" && location.pathname.startsWith(to))}
          />
        ))}
      </div>
     

      // 밑줄 라인
      <div className="border-b border-gray-300 w-full max-w-3xl" />
    </nav>
  );
}

// 현재 메뉴 파란색/밑줄 강조
function NavLinkItem({ to, text, current }) {
  return (
    <Link
      to={to}
      className={
        "pb-1 transition-colors duration-150 " +
        (current
          ? "border-b-4 border-blue-600 text-blue-700 font-bold"
          : "hover:text-blue-500")
      }
    >
      {text}
    </Link>
  );
}
