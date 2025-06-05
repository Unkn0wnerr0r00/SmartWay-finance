// src/components/Layout.jsx
import Navbar from "./Navbar";

export default function Layout({ children }) {
  return (
    <div className="flex justify-center px-4">
      <main className="w-full max-w-screen-xl px-4">
        <Navbar />
        {children}
      </main>
    </div>
  );
}
