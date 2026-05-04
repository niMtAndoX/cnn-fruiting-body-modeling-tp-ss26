import BenchmarkPage from "@/pages/BenchmarkPage";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

test("Benchmark-Seite rendert Titel, Beschreibung und Upload-Bereich", () => {
  render(<BenchmarkPage />);

  expect(screen.getByRole("heading", { name: /benchmark/i })).toBeInTheDocument();
  expect(screen.getByText(/zwei ZIP-Dateien/i)).toBeInTheDocument();

  const fileInputs = document.querySelectorAll('input[type="file"]');
  expect(fileInputs.length).toBe(2);
});