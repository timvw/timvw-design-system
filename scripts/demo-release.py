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
    'THIRD_PARTY_NOTICES.md', 'third-party/quantumblack-LICENSE.txt', 'third-party/octicons-LICENSE.txt',
    'tests/index.html', 'tests/tests.js',
    'components.html', 'COMPONENTS.md', 'icons.svg', 'css/components.css',
    'js/controls.js', 'js/overlays.js', 'js/table.js', 'tests/extended.js',
    'examples/settings.html', 'examples/projects.html', 'examples/dashboard.html',
    'examples/examples.css', 'examples/app.js', 'examples/data.js',
    'patterns.html', 'explore.html', 'explore.css', 'catalog.json', 'QUALITY.md',
    'js/select.js', 'js/files.js', 'js/workflow.js', 'js/patterns.js', 'js/explore.js',
    'examples/create.html', 'examples/create.js', 'examples/website.html', 'examples/website.css',
    'tests/workflows.js',
    'guide.html', 'playground.html', 'component-guides.json', 'MODULES.md', 'MIGRATING.md', 'CHANGELOG.md',
    'js/forms.js', 'js/locale.js', 'js/interactions.js', 'js/tabs.js', 'js/dialogs.js', 'js/templates.js', 'js/playground.js',
    'examples/workflows.html', 'examples/workflows.js', 'examples/localized.html', 'examples/localized.js',
    'examples/templates.html', 'examples/templates.js', 'examples/article.html', 'examples/article.css',
    'css/foundation.css',
    'css/parts/accordion.css',
    'css/parts/buttons.css',
    'css/parts/cards.css',
    'css/parts/charts.css',
    'css/parts/chips.css',
    'css/parts/commands.css',
    'css/parts/details.css',
    'css/parts/dialogs.css',
    'css/parts/feedback.css',
    'css/parts/files.css',
    'css/parts/forms.css',
    'css/parts/layout.css',
    'css/parts/navigation.css',
    'css/parts/overlays.css',
    'css/parts/people.css',
    'css/parts/select.css',
    'css/parts/tables.css',
    'css/parts/tabs.css',
    'css/parts/theme.css',
    'css/parts/workflows.css',
    'downloads/timvw-0.8.0.zip', 'ACCESSIBILITY_REVIEW.md',
    'WEB_COMPONENTS.md', 'components/dialog.js', 'components/card.js', 'components/shared.js', 'components/tokens.js',
    'examples/packaged-components.html', 'examples/packaged-components.js',
    'examples/custom-elements.html', 'examples/custom-elements.js',
)
REQUIRED = {'index.html', 'docs.css', 'css/timvw.css', 'js/timvw.js', 'LICENSE'}


def git(*args):
    return subprocess.check_output(['git', '-C', str(ROOT), *args])


def version_picker(catalog, current=None):
    prefix = '../' if current else './'
    latest = catalog['latest']
    label = f'v{current}' if current else f'Latest · v{latest}'
    links = [(prefix, 'Latest', 'Current development', current is None)]
    links += [(f'{prefix}v{item["version"]}/', f'v{item["version"]}',
               item['description'], item['version'] == current)
              for item in catalog['versions']]
    choices = ''.join(
        f'<a href="{html.escape(url)}"' + (' aria-current="page"' if active else '')
        + f'><strong>{html.escape(name)}</strong><small>{html.escape(description)}</small></a>'
        for url, name, description, active in links)
    return (f'<details class="docs-version" data-version-picker data-demo-version="{current or "latest"}"><summary aria-label="Demo version: {label}">{label}</summary>'
              f'<nav aria-label="Demo versions">{choices}</nav></details>')


def header(catalog, current=None):
    return (ROOT / 'scripts/demo-header.html').read_text().replace('{{VERSION_PICKER}}', version_picker(catalog, current)).rstrip()


def navigation(source, catalog, current=None):
    updated, count = re.subn(r'<details class="docs-version".*?</details>',
                            lambda _: version_picker(catalog, current), source, count=1, flags=re.S)
    if count != 1:
        raise ValueError('Expected exactly one version picker')
    script = f'<script type="module" src="{"../" if current else "./"}js/demo-versions.js"></script>'
    if re.search(r'<script[^>]+src="[^"]*/demo-versions\.js[^>]*></script>', updated):
        updated = re.sub(r'<script[^>]+src="[^"]*/demo-versions\.js[^>]*></script>', lambda _: script, updated)
    else:
        updated = updated.replace('</head>', f'  {script}\n</head>', 1)
    return updated


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
        updated = updated.replace('<title>Application components · timvw</title>',
                                  f'<title>Application components · timvw v{current}</title>')
        updated = re.sub(r'<title>(Workflow components|Component explorer) · timvw</title>',
                         lambda match: f'<title>{match.group(1)} · timvw v{current}</title>', updated)
        updated = updated.replace('</header>', '</header>\n'
            f'<aside class="docs-archive" aria-label="Archived demo"><p>Frozen demo · v{current}. '
            '<a href="../">View the latest version →</a></p></aside>', 1)
    return navigation(updated, catalog, current)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--latest', action='store_true', help='Refresh only the current demo header and version label')
    parser.add_argument('--refresh-navigation', action='store_true', help='Refresh archive navigation only; preserve component assets and record original publication hashes')
    parser.add_argument('--version', help='Version to freeze, e.g. 0.3.0')
    parser.add_argument('--ref', help='Committed source revision to freeze')
    args = parser.parse_args()
    catalog = json.loads((ROOT / 'releases.json').read_text())
    if args.refresh_navigation:
        if args.latest or args.version or args.ref:
            parser.error('--refresh-navigation cannot be combined with other options')
        for folder in sorted(ROOT.glob('v*.*.*')):
            manifest_path = folder / 'release.json'
            if not manifest_path.is_file(): continue
            manifest = json.loads(manifest_path.read_text())
            changes = {}
            for name in ('index.html', 'components.html', 'patterns.html', 'explore.html', 'guide.html', 'playground.html'):
                target = folder / name
                if not target.exists(): continue
                source = target.read_text()
                updated = navigation(source, catalog, manifest['version'])
                if updated != source: changes[name] = updated
            if not changes: continue
            manifest.setdefault('initial_published_sha256', dict(manifest['published_sha256']))
            for name, updated in changes.items():
                target = folder / name
                target.write_text(updated)
                manifest['published_sha256'][name] = hashlib.sha256(target.read_bytes()).hexdigest()
            manifest['archive_chrome'] = 'Component assets frozen; version navigation reads the shared site release catalog.'
            manifest['shared_navigation'] = '../js/demo-versions.js'
            manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
            print(f'Refreshed navigation in {folder.name}; component assets preserved.')
        return
    if args.latest:
        if args.version or args.ref:
            parser.error('--latest cannot be combined with --version or --ref')
        for name in ('index.html', 'components.html', 'patterns.html', 'explore.html', 'guide.html', 'playground.html'):
            target = ROOT / name
            if target.exists(): target.write_text(page(target.read_text(), catalog))
        print('Updated latest demo headers.')
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
        # Component assets live inside the archive; release navigation uses the shared site catalog.
        (stage / 'index.html').write_text(page((stage / 'index.html').read_text(), catalog, args.version))
        for name in ('components.html', 'patterns.html', 'explore.html', 'guide.html', 'playground.html'):
            if (stage / name).exists():
                (stage / name).write_text(page((stage / name).read_text(), catalog, args.version))
        for name in ('demo-controls.css', 'js/docs.js'):
            (stage / name).write_bytes((ROOT / name).read_bytes())
        files = {str(path.relative_to(stage)): hashlib.sha256(path.read_bytes()).hexdigest()
                 for path in sorted(stage.rglob('*')) if path.is_file()}
        (stage / 'release.json').write_text(json.dumps({
            'version': args.version, 'source_commit': commit,
            'archive_chrome': 'Component assets frozen; version navigation reads the shared site release catalog.',
            'shared_navigation': '../js/demo-versions.js',
            'original_source_sha256': original_hashes, 'published_sha256': files,
        }, indent=2) + '\n')
        stage.rename(target)
    print(f'Created {target.name}/ from {commit}; component assets preserved.')


if __name__ == '__main__':
    main()
