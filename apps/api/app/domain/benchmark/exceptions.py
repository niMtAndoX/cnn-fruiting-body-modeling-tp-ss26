"""Domänenspezifische Exceptions für den Benchmark-Use-Case."""


class BenchmarkBadRequestError(Exception):
	"""Fehler für ungültige Eingaben beim Benchmark-Aufruf."""


class BenchmarkExecutionError(Exception):
	"""Fehler bei der Ausführung des Benchmarks."""
