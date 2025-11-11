"""Tests for the Dashboard application."""

import shutil
import tempfile
from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client
from django.test import TestCase
from django.test import override_settings
from django.urls import reverse


class UploadViewTests(TestCase):
	def setUp(self):
		super().setUp()
		self.client = Client()
		self.upload_dir = tempfile.mkdtemp(prefix='appraise-upload-test-')
		self.override = override_settings(UPLOAD_ROOT=self.upload_dir)
		self.override.enable()

		user_model = get_user_model()
		self.staff_user = user_model.objects.create_user(
			username='staff', email='staff@example.com', password='password', is_staff=True
		)
		self.normal_user = user_model.objects.create_user(
			username='regular', email='regular@example.com', password='password'
		)

	def tearDown(self):
		self.override.disable()
		shutil.rmtree(self.upload_dir, ignore_errors=True)
		super().tearDown()

	def test_redirects_when_not_authenticated(self):
		response = self.client.get(reverse('upload-file'))
		self.assertEqual(response.status_code, 302)
		self.assertIn('/dashboard/sign-in/', response.url)

	def test_denies_non_staff_user(self):
		self.client.login(username='regular', password='password')
		response = self.client.get(reverse('upload-file'))
		self.assertEqual(response.status_code, 403)

	def test_allows_staff_user(self):
		self.client.login(username='staff', password='password')
		response = self.client.get(reverse('upload-file'))
		self.assertEqual(response.status_code, 200)

	def test_uploads_file_successfully(self):
		self.client.login(username='staff', password='password')
		upload = SimpleUploadedFile('sample.txt', b'hello world', content_type='text/plain')
		response = self.client.post(reverse('upload-file'), {'file': upload}, follow=True)
		self.assertEqual(response.status_code, 200)
		self.assertTrue(Path(self.upload_dir, 'sample.txt').exists())
