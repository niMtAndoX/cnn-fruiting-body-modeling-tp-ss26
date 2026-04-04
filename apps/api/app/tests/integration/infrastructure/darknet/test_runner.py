import os
from pathlib import Path

import pytest

from app.infrastructure.darknet.runner import DarknetRunner


@pytest.mark.integration
def test_darknet_runner_executes_inference_script_successfully() -> None:
    script_path = os.getenv("INFERENCE_SCRIPT_PATH")
    image_path = os.getenv("RUNNER_TEST_IMAGE_PATH")

    if not script_path:
        pytest.skip("INFERENCE_SCRIPT_PATH is not set")

    if not image_path:
        pytest.skip("RUNNER_TEST_IMAGE_PATH is not set")

    script = Path(script_path)
    image = Path(image_path)

    if not script.exists():
        pytest.skip(f"Inference script does not exist: {script}")

    if not image.exists():
        pytest.skip(f"Test image does not exist: {image}")

    runner = DarknetRunner(
        inference_script_path=str(script),
        inference_timeout_seconds=30,
    )

    result = runner.run(image_path=image)

    assert result.returncode == 0
    assert result.stdout.strip() != ""