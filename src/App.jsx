import { BrowserRouter, Routes, Route } from "react-router-dom";
import AtelierDesign from "./pages/AtelierDesign";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AtelierDesign />} />
      </Routes>
    </BrowserRouter>
  );
}
