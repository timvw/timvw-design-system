#!/usr/bin/env python3
"""Check local links, identifiers, module imports and archive integrity. No dependencies."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parent.parent
class Markup(HTMLParser):
    def __init__(self, text):
        super().__init__(); self.ids = []; self.references = []; self.links = []; self.feed(text)
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get('id'): self.ids.append(attrs['id'])
        for name in ('for', 'aria-controls', 'aria-labelledby', 'aria-describedby', 'popovertarget', 'data-tvw-open'):
            if attrs.get(name): self.references.extend(attrs[name].split())
        for name in ('href', 'src'):
            if attrs.get(name): self.links.append(attrs[name])

cache = {}
def markup(path):
    if path not in cache: cache[path] = Markup(path.read_text())
    return cache[path]

def check_link(source, href):
    url = urlsplit(href)
    if url.scheme or url.netloc: return
    target = (source.parent / unquote(url.path)).resolve() if url.path else source
    if target.is_dir(): target /= 'index.html'
    assert target.is_file(), f'{source.relative_to(ROOT)}: missing {href}'
    if url.fragment and target.suffix in ('.html', '.svg'):
        assert unquote(url.fragment) in markup(target).ids, f'{source.relative_to(ROOT)}: missing fragment {href}'

folders = [ROOT, ROOT / 'examples', ROOT / 'tests', *ROOT.glob('v[0-9]*')]
pages = set()
for folder in folders:
    pages.update(folder.glob('*.html'))
    if folder.name.startswith('v'): pages.update(folder.rglob('*.html'))
for path in sorted(pages):
    doc = markup(path)
    assert len(doc.ids) == len(set(doc.ids)), f'Duplicate IDs in {path}'
    assert all(ref in doc.ids for ref in doc.references), f'Missing label/ARIA target in {path}: {set(doc.references) - set(doc.ids)}'
    for link in doc.links: check_link(path, link)
for folder in [ROOT / 'js', ROOT / 'examples', ROOT / 'tests']:
    for path in folder.glob('*.js'):
        for link in re.findall(r'(?:from\s+|import\s*)[\'"](\.[^\'"]+)[\'"]', path.read_text()): check_link(path, link)
for folder in ROOT.glob('v[0-9]*'):
    manifest = json.loads((folder / 'release.json').read_text())
    for name, expected in manifest['published_sha256'].items():
        assert hashlib.sha256((folder / name).read_bytes()).hexdigest() == expected, f'Archive checksum mismatch: {folder.name}/{name}'
for entry in json.loads((ROOT / 'catalog.json').read_text()): check_link(ROOT / 'explore.html', entry['href'])
print(f'{len(pages)} pages: local links, IDs, ARIA references, module imports, catalogue links and archived checksums pass.')
