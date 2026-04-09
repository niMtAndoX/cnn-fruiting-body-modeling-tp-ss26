import pytest
from pydantic import ValidationError

from app.core import config as config_module
from app.core.config import Settings, get_settings


def make_settings(**overrides) -> Settings:
    defaults = {
        "app_name": "waldpilz-api",
        "app_env": "dev",
        "debug": True,
        "api_host": "127.0.0.1",
        "api_port": 8000,
        "api_prefix": "/api/v1",
        "log_level": "INFO",
        "cors_allow_origins": [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ],
        "max_upload_size_mb": 20,
        "allowed_upload_content_types": ["image/jpeg", "image/png"],
        "model_version": "darknet-cnn-v1",
        "inference_timeout_seconds": 30,
        "inference_temp_dir": None,
    }
    defaults.update(overrides)
    return Settings(_env_file=None, **defaults)


def test_settings_defaults() -> None:
    settings = make_settings()

    assert settings.app_name == "waldpilz-api"
    assert settings.app_env == "dev"
    assert settings.debug is True

    assert settings.api_host == "127.0.0.1"
    assert settings.api_port == 8000
    assert settings.api_prefix == "/api/v1"

    assert settings.log_level == "INFO"

    assert settings.cors_allow_origins == [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    assert settings.allowed_upload_content_types == ["image/jpeg", "image/png"]

    assert settings.max_upload_size_mb == 20
    assert settings.model_version == "darknet-cnn-v1"


def test_validate_api_prefix_rejects_missing_leading_slash() -> None:
    with pytest.raises(ValidationError) as exc_info:
        make_settings(api_prefix="api/v1")

    assert "api_prefix must start with '/'" in str(exc_info.value)


def test_validate_max_upload_size_mb_rejects_zero() -> None:
    with pytest.raises(ValidationError) as exc_info:
        make_settings(max_upload_size_mb=0)

    assert "max_upload_size_mb must be greater than 0" in str(exc_info.value)


def test_parse_list_fields_from_comma_separated_strings() -> None:
    settings = make_settings(
        cors_allow_origins="http://localhost:3000, http://127.0.0.1:3000",
        allowed_upload_content_types="image/jpeg, image/png",
    )

    assert settings.cors_allow_origins == [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    assert settings.allowed_upload_content_types == ["image/jpeg", "image/png"]


def test_parse_debug_accepts_release_as_false() -> None:
    settings = make_settings(debug="release")

    assert settings.debug is False


def test_parse_list_fields_from_json_strings() -> None:
    settings = make_settings(
        cors_allow_origins='["http://localhost:3000", "http://127.0.0.1:3000"]',
        allowed_upload_content_types='["image/jpeg", "image/png"]',
    )

    assert settings.cors_allow_origins == [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    assert settings.allowed_upload_content_types == ["image/jpeg", "image/png"]


def test_parse_empty_list_fields_from_empty_strings() -> None:
    settings = make_settings(
        cors_allow_origins="",
        allowed_upload_content_types="",
    )

    assert settings.cors_allow_origins == []
    assert settings.allowed_upload_content_types == []


def test_max_upload_size_bytes() -> None:
    settings = make_settings(max_upload_size_mb=20)

    assert settings.max_upload_size_bytes == 20 * 1024 * 1024


def test_get_settings_is_cached(monkeypatch: pytest.MonkeyPatch) -> None:
    calls = {"count": 0}

    class DummySettings:
        pass

    def fake_settings() -> DummySettings:
        calls["count"] += 1
        return DummySettings()

    get_settings.cache_clear()
    monkeypatch.setattr(config_module, "Settings", fake_settings)

    first = get_settings()
    second = get_settings()

    assert first is second
    assert calls["count"] == 1

    get_settings.cache_clear()
