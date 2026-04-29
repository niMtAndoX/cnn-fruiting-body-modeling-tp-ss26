"""Domänenspezifische Exceptions für den Benchmark-Use-Case."""


class BenchmarkBadRequestError(Exception):
    """Fehler für ungültige Eingaben oder nicht nutzbare Benchmark-Anfragen."""