import { BrowserRouter, Route, Routes } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import ExecutionDetailsPage from "./pages/ExecutionDetailsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/executions/:id" element={<ExecutionDetailsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
