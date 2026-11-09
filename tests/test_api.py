"""End-to-end API tests using the offline demo providers."""

from __future__ import annotations


def test_health(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["mode"] == "demo"
    assert body["vision_provider"] == "demo"
    assert body["database"] == "sqlite"


def test_root_metadata(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["api"] == "/api/v1"


def test_upload_generate_flow(client, png_bytes):
    upload = client.post(
        "/api/v1/uploads",
        files={"file": ("screenshot.png", png_bytes, "image/png")},
    )
    assert upload.status_code == 201, upload.text
    upload_body = upload.json()
    assert upload_body["core_insight"]
    assert upload_body["upload_id"]

    generation = client.post(
        "/api/v1/generations",
        json={"upload_id": upload_body["upload_id"], "draft_count": 3},
    )
    assert generation.status_code == 201, generation.text
    body = generation.json()
    assert len(body["drafts"]) == 3
    assert all("text" in draft for draft in body["drafts"])
    assert body["core_insight"] == upload_body["core_insight"]

    history = client.get("/api/v1/generations")
    assert history.status_code == 200
    assert history.json()["total"] == 1
    assert history.json()["items"][0]["draft_count"] == 3

    detail = client.get(f"/api/v1/generations/{body['generation_id']}")
    assert detail.status_code == 200
    assert detail.json()["generation_id"] == body["generation_id"]


def test_upload_rejects_invalid_image(client):
    response = client.post(
        "/api/v1/uploads",
        files={"file": ("notes.txt", b"hello world", "text/plain")},
    )
    assert response.status_code == 422
    assert response.json()["code"] == "invalid_image"


def test_generate_unknown_upload(client):
    response = client.post("/api/v1/generations", json={"upload_id": "missing"})
    assert response.status_code == 404
    assert response.json()["code"] == "not_found"


def test_voice_profile_lifecycle(client):
    created = client.post(
        "/api/v1/voice-profiles",
        json={
            "user_id": "test-user",
            "past_posts": ["First post about building things.", "Second post about focus."],
        },
    )
    assert created.status_code == 201, created.text
    profile = created.json()
    assert profile["post_count"] == 2

    listed = client.get("/api/v1/voice-profiles", params={"user_id": "test-user"})
    assert listed.status_code == 200
    assert len(listed.json()) == 1

    updated = client.patch(
        f"/api/v1/voice-profiles/{profile['voice_profile_id']}",
        json={"past_posts": ["A single updated post."]},
    )
    assert updated.status_code == 200
    assert updated.json()["post_count"] == 1


def test_voice_profile_validation(client):
    response = client.post(
        "/api/v1/voice-profiles",
        json={"user_id": "test-user", "past_posts": ["   "]},
    )
    assert response.status_code == 422
    assert response.json()["code"] == "validation_error"


def test_generation_uses_voice_profile(client, png_bytes):
    upload = client.post(
        "/api/v1/uploads",
        files={"file": ("screenshot.png", png_bytes, "image/png")},
    ).json()
    profile = client.post(
        "/api/v1/voice-profiles",
        json={"user_id": "test-user", "past_posts": ["Short and punchy writing."]},
    ).json()

    generation = client.post(
        "/api/v1/generations",
        json={
            "upload_id": upload["upload_id"],
            "voice_profile_id": profile["voice_profile_id"],
        },
    )
    assert generation.status_code == 201, generation.text
    assert len(generation.json()["drafts"]) == 3
