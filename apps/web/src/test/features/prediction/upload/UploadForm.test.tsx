import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import React from "react";

interface UploadFormProps {
  onError?: (message: string) => void;
  onFileSelect?: (file: File) => void;
}

// Simple Mock UploadForm Component
const UploadForm = ({ onFileSelect, onError }: UploadFormProps) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validFormats = ["image/jpeg", "image/png"];
    if (!validFormats.includes(file.type)) {
      onError?.("Ungültiges Format");
      return;
    }
    onFileSelect?.(file);
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        data-testid="file-input"
      />
      <button
        onClick={() => inputRef.current?.click()}
        data-testid="upload-button"
      >
        Datei hochladen
      </button>
    </div>
  );
};

describe("UploadForm", () => {
  it("zeigt den Upload-Button", () => {
    render(<UploadForm />);

    const button = screen.getByTestId("upload-button");
    expect(button).toBeInTheDocument();
  });

  it("akzeptiert eine JPG-Datei", () => {
    const mockOnFileSelect = vi.fn();
    render(<UploadForm onFileSelect={mockOnFileSelect} />);

    const file = new File(["test"], "image.jpg", { type: "image/jpeg" });
    const input = screen.getByTestId("file-input") as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    expect(mockOnFileSelect).toHaveBeenCalledWith(file);
  });

  it("akzeptiert eine PNG-Datei", () => {
    const mockOnFileSelect = vi.fn();
    render(<UploadForm onFileSelect={mockOnFileSelect} />);

    const file = new File(["test"], "image.png", { type: "image/png" });
    const input = screen.getByTestId("file-input") as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    expect(mockOnFileSelect).toHaveBeenCalledWith(file);
  });

  it("lehnt falsches Dateiformat ab", () => {
    const mockOnError = vi.fn();
    render(<UploadForm onError={mockOnError} />);

    const file = new File(["test"], "document.pdf", {
      type: "application/pdf",
    });
    const input = screen.getByTestId("file-input") as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    expect(mockOnError).toHaveBeenCalledWith("Ungültiges Format");
  });
});
