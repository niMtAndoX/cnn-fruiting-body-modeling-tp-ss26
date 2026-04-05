"""Domänenspezifische Exceptions für den Vorhersage-Use-Case."""


class PredictionBadRequestError(Exception):
    """Fehler für ungültige Eingaben oder nicht nutzbare Vorhersage-Anfragen."""


class PredictionExecutionError(Exception):
    """Fehler für interne Probleme bei der Ausführung der Vorhersage."""