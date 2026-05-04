export default function BenchmarkPage() {
  return (
    <div>
      <h1>Benchmark</h1>

      <p>
        Lade zwei ZIP-Dateien hoch: eine mit Testbildern und eine mit Labels.
      </p>

      <div>
        <input type="file" accept=".zip" />
      </div>

      <div>
        <input type="file" accept=".zip" />
      </div>

      <button>Benchmark starten</button>
    </div>
  );
}