import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Analysis from "./pages/Analysis";
import Comparison from "./pages/Comparison";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans text-gray-900 antialiased">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/comparison" element={<Comparison />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
