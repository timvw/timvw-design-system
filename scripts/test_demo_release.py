"""Run with python3 -m unittest discover -s scripts -p 'test_*.py'."""
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('demo_release', Path(__file__).with_name('demo-release.py'))
release = importlib.util.module_from_spec(spec)
spec.loader.exec_module(release)


class ReleaseNavigationTests(unittest.TestCase):
    def setUp(self):
        self.catalog = {'latest': '0.5.0', 'versions': [
            {'version': '0.5.0', 'description': 'Future release'},
            {'version': '0.3.0', 'description': 'Original release'},
        ]}

    def test_archived_latest_fallback_never_claims_an_old_version(self):
        picker = release.version_picker(self.catalog, '0.3.0')
        self.assertIn('<a href="../"><strong>Latest</strong>', picker)
        self.assertNotIn('Latest · v', picker)
        self.assertIn('href="../v0.5.0/"', picker)
        self.assertIn('href="../v0.3.0/" aria-current="page"', picker)
        self.assertIn('Demo version: v0.3.0', picker)

    def test_navigation_upgrade_preserves_everything_else_and_is_idempotent(self):
        original = (release.ROOT / 'v0.3.0/index.html').read_text()
        updated = release.navigation(original, self.catalog, '0.3.0')
        self.assertEqual(updated, release.navigation(updated, self.catalog, '0.3.0'))
        strip = lambda value: release.re.sub(r'<details class="docs-version".*?</details>', '', value, count=1, flags=release.re.S)
        self.assertEqual(strip(original), strip(updated))
        self.assertEqual(updated.count('src="../js/demo-versions.js"'), 1)

    def test_new_snapshots_reference_shared_navigation_outside_archive(self):
        source = (release.ROOT / 'index.html').read_text()
        archive = release.page(source, self.catalog, '0.5.0')
        self.assertIn('src="../js/demo-versions.js"', archive)
        self.assertNotIn('src="./js/demo-versions.js"', archive)
        self.assertIn('data-demo-version="0.5.0"', archive)
