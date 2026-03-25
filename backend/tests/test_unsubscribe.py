"""Tests for unsubscribe service — token generation, processing, suppression list."""
from __future__ import annotations

import os
import unittest
from unittest.mock import MagicMock, patch

# Set required env vars before import
os.environ.setdefault("APP_NAME", "SMA Test")
os.environ.setdefault("APP_SLUG", "sma-test")
os.environ.setdefault("APP_SCHEMA", "sma_relance")
os.environ.setdefault("SUPABASE_URL", "http://localhost:8000")
os.environ.setdefault("SUPABASE_ANON_KEY", "test-key")
os.environ.setdefault("FRONTEND_BASE_PATH", "/sma-relance-mail")
os.environ.setdefault("SESSION_COOKIE_NAME", "test_session")
os.environ.setdefault("UNSUBSCRIBE_SECRET", "test-secret-key-for-unit-tests")


class TestNormalizeAndHash(unittest.TestCase):
    """Test email normalization and hashing."""

    def test_normalize_email(self):
        from features.unsubscribe.service import normalize_email
        self.assertEqual(normalize_email("  Test@Example.COM  "), "test@example.com")
        self.assertEqual(normalize_email("user@test.fr"), "user@test.fr")

    def test_hash_email_deterministic(self):
        from features.unsubscribe.service import hash_email
        h1 = hash_email("test@example.com")
        h2 = hash_email("Test@Example.COM")
        self.assertEqual(h1, h2, "Hash should be case-insensitive")

    def test_hash_email_different_emails(self):
        from features.unsubscribe.service import hash_email
        h1 = hash_email("a@b.com")
        h2 = hash_email("c@d.com")
        self.assertNotEqual(h1, h2)


class TestTokenFunctions(unittest.TestCase):
    """Test token hashing and signing."""

    def test_hash_token_deterministic(self):
        from features.unsubscribe.service import _hash_token
        h1 = _hash_token("my-secret-token")
        h2 = _hash_token("my-secret-token")
        self.assertEqual(h1, h2)

    def test_hash_token_different_tokens(self):
        from features.unsubscribe.service import _hash_token
        h1 = _hash_token("token-a")
        h2 = _hash_token("token-b")
        self.assertNotEqual(h1, h2)


class TestBuildUnsubscribeUrl(unittest.TestCase):
    """Test URL generation."""

    def test_url_format(self):
        from features.unsubscribe.service import build_unsubscribe_url
        url = build_unsubscribe_url("test-token-abc")
        self.assertIn("/sma-relance-mail/unsubscribe?token=test-token-abc", url)
        self.assertTrue(url.startswith("http"))

    def test_url_no_internal_ids(self):
        from features.unsubscribe.service import build_unsubscribe_url
        url = build_unsubscribe_url("opaque-token")
        # URL should not contain any UUID-like patterns
        import re
        uuid_pattern = r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
        self.assertFalse(re.search(uuid_pattern, url), "URL should not expose internal UUIDs")


class TestListUnsubscribeHeaders(unittest.TestCase):
    """Test RFC 8058 header generation."""

    def test_headers_contain_required_fields(self):
        from features.unsubscribe.service import build_list_unsubscribe_headers
        headers = build_list_unsubscribe_headers("my-token")
        self.assertIn("List-Unsubscribe", headers)
        self.assertIn("List-Unsubscribe-Post", headers)
        self.assertEqual(headers["List-Unsubscribe-Post"], "List-Unsubscribe=One-Click")
        self.assertIn("my-token", headers["List-Unsubscribe"])


class TestProcessUnsubscribe(unittest.TestCase):
    """Test the process_unsubscribe flow with mocked DB."""

    @patch("features.unsubscribe.service._table")
    @patch("features.unsubscribe.service._log_event")
    @patch("features.unsubscribe.service._upsert_unsubscription")
    def test_invalid_token(self, mock_upsert, mock_log, mock_table):
        from features.unsubscribe.service import process_unsubscribe

        # Mock: token not found
        mock_select = MagicMock()
        mock_select.select.return_value.eq.return_value.limit.return_value.execute.return_value = MagicMock(data=[])
        mock_table.return_value = mock_select

        result = process_unsubscribe("non-existent-token")
        self.assertEqual(result["status"], "invalid")

    @patch("features.unsubscribe.service._table")
    @patch("features.unsubscribe.service._log_event")
    @patch("features.unsubscribe.service._upsert_unsubscription")
    def test_already_used_token_idempotent(self, mock_upsert, mock_log, mock_table):
        from features.unsubscribe.service import process_unsubscribe

        # Mock: token found but already used
        token_data = {
            "id": "tok-1",
            "token_hash": "abc",
            "email_normalized": "test@example.com",
            "contact_id": None,
            "communication_topic_id": None,
            "revoked_at": None,
            "expires_at": None,
            "used_at": "2026-03-01T00:00:00+00:00",
        }
        mock_select = MagicMock()
        mock_select.select.return_value.eq.return_value.limit.return_value.execute.return_value = MagicMock(data=[token_data])
        mock_table.return_value = mock_select

        result = process_unsubscribe("some-token")
        self.assertEqual(result["status"], "already_done")
        mock_log.assert_called_once()


class TestIsEmailUnsubscribed(unittest.TestCase):
    """Test suppression list check."""

    @patch("features.unsubscribe.service._table")
    def test_not_unsubscribed(self, mock_table):
        from features.unsubscribe.service import is_email_unsubscribed

        mock_q = MagicMock()
        mock_q.select.return_value.eq.return_value.eq.return_value.eq.return_value.limit.return_value.execute.return_value = MagicMock(data=[])
        mock_table.return_value = mock_q

        result = is_email_unsubscribed("test@example.com")
        self.assertFalse(result)

    @patch("features.unsubscribe.service._table")
    def test_globally_unsubscribed(self, mock_table):
        from features.unsubscribe.service import is_email_unsubscribed

        mock_q = MagicMock()
        mock_q.select.return_value.eq.return_value.eq.return_value.eq.return_value.limit.return_value.execute.return_value = MagicMock(data=[{"id": "sub-1"}])
        mock_table.return_value = mock_q

        result = is_email_unsubscribed("test@example.com")
        self.assertTrue(result)


if __name__ == "__main__":
    unittest.main()
