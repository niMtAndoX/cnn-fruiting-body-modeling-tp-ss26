"""Abstrakte Schnittstelle zwischen Benchmark-Logik und technischer Implementierung."""

from abc import ABC, abstractmethod

from app.domain.benchmark.entities import BenchmarkInput, BenchmarkResult


class BenchmarkPort(ABC):
	@abstractmethod
	def benchmark(self, benchmark_input: BenchmarkInput) -> BenchmarkResult:
		...
