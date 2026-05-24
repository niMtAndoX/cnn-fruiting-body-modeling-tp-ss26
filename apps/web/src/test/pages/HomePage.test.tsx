import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";

import HomePage from "@/pages/HomePage";

function renderHomePage() {
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: <HomePage />,
      },
    ],
    {
      initialEntries: ["/"],
    }
  );

  return render(<RouterProvider router={router} />);
}

describe("HomePage", () => {
  it("zeigt den Projekttitel an", () => {
    renderHomePage();

    const title = screen.getByRole("heading", {
      name: /erkennen/i,
    });
    expect(title).toBeInTheDocument();
  });

  it("zeigt den Button 'Bildanalyse starten'", () => {
    renderHomePage();

    const button = screen.getByRole("link", {
      name: /Bildanalyse starten/i,
    });
    expect(button).toBeInTheDocument();
  });

  it("zeigt den Link zur Benchmark-Seite", () => {
    renderHomePage();

    const buttons = screen.getAllByRole("link", {
      name: /Benchmark/i,
    });
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("zeigt die Akademische Kooperation Section", () => {
    renderHomePage();

    const section = screen.getByText(/Akademische Kooperation/i);
    expect(section).toBeInTheDocument();
  });

  it("zeigt die Prozess-Section mit Upload, Prüfung und Ergebnis", () => {
    renderHomePage();

    expect(screen.getByText(/Foto hochladen/i)).toBeInTheDocument();
    expect(screen.getByText(/Spezifische Prüfung/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Ergebnis/i })).toBeInTheDocument();
  });
});
