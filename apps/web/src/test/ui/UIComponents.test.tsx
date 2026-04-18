import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

// Simple Mock UI Components Showcase
const UIShowcase = () => {
  return (
    <div>
      <header data-testid="header">
        <h1>Waldpilz</h1>
        <nav>
          <a href="/">Startseite</a>
          <a href="/prediction">Analyse</a>
        </nav>
      </header>

      <main data-testid="main">
        <section data-testid="hero">
          <h2>Willkommen</h2>
          <button data-testid="cta-btn">Jetzt starten</button>
        </section>

        <section data-testid="features">
          <div>
            <h3>Upload</h3>
            <p>Foto hochladen</p>
          </div>
          <div>
            <h3>Analyse</h3>
            <p>KI Erkennung</p>
          </div>
        </section>

        <section data-testid="status">
          <div role="status">✓ Erfolgreich</div>
          <div role="alert">⚠ Warnung</div>
        </section>
      </main>

      <footer data-testid="footer">
        <p>© 2024 Waldpilz</p>
      </footer>
    </div>
  );
};

describe("UI Components", () => {
  it("rendert den Header", () => {
    render(<UIShowcase />);

    const header = screen.getByTestId("header");
    expect(header).toBeInTheDocument();
  });

  it("rendert den Main-Content", () => {
    render(<UIShowcase />);

    const main = screen.getByTestId("main");
    expect(main).toBeInTheDocument();
  });

  it("rendert den Footer", () => {
    render(<UIShowcase />);

    const footer = screen.getByTestId("footer");
    expect(footer).toBeInTheDocument();
  });

  it("zeigt den CTA-Button", () => {
    render(<UIShowcase />);

    const button = screen.getByTestId("cta-btn");
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Jetzt starten");
  });

  it("zeigt die Features-Section", () => {
    render(<UIShowcase />);

    const features = screen.getByTestId("features");
    expect(features).toBeInTheDocument();
  });

  it("zeigt Upload-Feature an", () => {
    render(<UIShowcase />);

    expect(screen.getByText("Upload")).toBeInTheDocument();
  });

  it("zeigt Analyse-Feature an", () => {
    render(<UIShowcase />);

    const features = screen.getByTestId("features");
    expect(features.textContent).toContain("Analyse");
  });

  it("zeigt Status-Meldungen an", () => {
    render(<UIShowcase />);

    const status = screen.getByTestId("status");
    expect(status).toBeInTheDocument();

    expect(screen.getByText(/✓ Erfolgreich/i)).toBeInTheDocument();
    expect(screen.getByText(/⚠ Warnung/i)).toBeInTheDocument();
  });

  it("hat Navigation Links", () => {
    render(<UIShowcase />);

    const startLink = screen.getByRole("link", { name: /Startseite/i });
    const analysisLink = screen.getByRole("link", { name: /Analyse/i });

    expect(startLink).toBeInTheDocument();
    expect(analysisLink).toBeInTheDocument();
  });
});
