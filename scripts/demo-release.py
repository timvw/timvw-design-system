#!/usr/bin/env python3
"""Optional maintainer utility. The published demos need no tooling or build step."""
import argparse
import hashlib
import html
import json
from pathlib import Path
import re
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parent.parent
PUBLIC_FILES = (
    'index.html', 'docs.css', 'favicon.svg', 'starter.html',
    'css/timvw.css', 'js/timvw.js', 'README.md', 'CONTRIBUTING.md', 'LICENSE',
    'THIRD_PARTY_NOTICES.md', 'third-party/quantumblack-LICENSE.txt',
    'tests/index.html', 'tests/tests.js',
)
REQUIRED = {'index.html', 'docs.css', 'css/timvw.css', 'js/timvw.js', 'LICENSE'}


def git(*args):
    return subprocess.check_output(['git', '-C', str(ROOT), *args])


def header(catalog, current=None):
    prefix = '../' if current else './'
    latest = catalog['latest']
    label = f'v{current}' if current else f'Latest · v{latest}'
    links = [(prefix, f'Latest · v{latest}', 'Current development', current is None)]
    links += [(f'{prefix}v{item["version"]}/', f'v{item["version"]}',
               item['description'], item['version'] == current)
              for item in catalog['versions']]
    choices = ''.join(
        f'<a href="{html.escape(url)}"' + (' aria-current="page"' if active else '')
        + f'><strong>{html.escape(name)}</strong><small>{html.escape(description)}</small></a>'
        for url, name, description, active in links)
    picker = (f'<details class="docs-version" data-version-picker><summary aria-label="Demo version: {label}">{label}</summary>'
              f'<nav aria-label="Demo versions">{choices}</nav></details>')
    return (ROOT / 'scripts/demo-header.html').read_text().replace('{{VERSION_PICKER}}', picker).rstrip()


def page(source, catalog, current=None):
    updated, count = re.subn(r'<header class="docs-header">.*?</header>',
                            lambda _: header(catalog, current), source, count=1, flags=re.S)
    if count != 1:
        raise ValueError('Expected exactly one demo header')
    if 'href="./demo-controls.css"' not in updated:
        updated = updated.replace('<link rel="stylesheet" href="./docs.css">',
            '<link rel="stylesheet" href="./docs.css">\n  <link rel="stylesheet" href="./demo-controls.css">')
    version = current or catalog['latest']
    updated = re.sub(r'src="\./js/docs\.js(?:\?[^"]*)?"',
                     f'src="./js/docs.js?v={version}"', updated)
    updated = re.sub(r'timvw / v\d+\.\d+\.\d+', f'timvw / v{version}', updated)
    if current:
        updated = updated.replace('<title>timvw · Design system</title>',
                                  f'<title>timvw v{current} · Design system</title>')
        updated = updated.replace('</header>', '</header>\n'
            f'<aside class="docs-archive" aria-label="Archived demo"><p>Frozen demo · v{current}. '
            '<a href="../">View the latest version →</a></p></aside>', 1)
    return updated


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--latest', action='store_true', help='Refresh only the current demo header and version label')
    parser.add_argument('--version', help='Version to freeze, e.g. 0.3.0')
    parser.add_argument('--ref', help='Committed source revision to freeze')
    args = parser.parse_args()
    catalog = json.loads((ROOT / 'releases.json').read_text())
    if args.latest:
        if args.version or args.ref:
            parser.error('--latest cannot be combined with --version or --ref')
        target = ROOT / 'index.html'
        target.write_text(page(target.read_text(), catalog))
        print('Updated latest demo header.')
        return
    if not args.version or not args.ref or not re.fullmatch(r'\d+\.\d+\.\d+', args.version):
        parser.error('Provide --version MAJOR.MINOR.PATCH and --ref COMMIT')
    if args.version not in [item['version'] for item in catalog['versions']]:
        parser.error('Add the version to releases.json first')
    target = ROOT / f'v{args.version}'
    if target.exists():
        parser.error(f'{target.name} already exists; frozen demos are never overwritten')
    commit = git('rev-parse', '--verify', '--end-of-options', f'{args.ref}^{{commit}}').decode().strip()
    available = set(git('ls-tree', '-r', '--name-only', commit).decode().splitlines())
    if REQUIRED - available:
        parser.error(f'Missing required source files: {REQUIRED - available}')
    # Stage completely before publishing the folder. Only explicit public files are exported.
    with tempfile.TemporaryDirectory(prefix='.demo-release-', dir=ROOT) as temporary:
        stage = Path(temporary) / target.name
        stage.mkdir()
        original_hashes = {}
        for name in PUBLIC_FILES:
            if name not in available:
                continue
            data = git('show', f'{commit}:{name}')
            destination = stage / name
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(data)
            original_hashes[name] = hashlib.sha256(data).hexdigest()
        # The archive toolbar is added once. All assets then live inside this folder.
        (stage / 'index.html').write_text(page((stage / 'index.html').read_text(), catalog, args.version))
        for name in ('demo-controls.css', 'js/docs.js'):
            (stage / name).write_bytes((ROOT / name).read_bytes())
        files = {str(path.relative_to(stage)): hashlib.sha256(path.read_bytes()).hexdigest()
                 for path in sorted(stage.rglob('*')) if path.is_file()}
        (stage / 'release.json').write_text(json.dumps({
            'version': args.version, 'source_commit': commit,
            'archive_chrome': 'Version navigation and theme icons added at snapshot creation.',
            'original_source_sha256': original_hashes, 'published_sha256': files,
        }, indent=2) + '\n')
        stage.rename(target)
    print(f'Created {target.name}/ from {commit}; component assets preserved.')


if __name__ == '__main__':
    main()
