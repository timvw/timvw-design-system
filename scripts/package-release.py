#!/usr/bin/env python3
"""Produce a reproducible, framework-free runtime bundle. No external packages."""
from pathlib import Path
import hashlib
import json
import re
import sys
from urllib.parse import urlsplit
import zipfile
ROOT = Path(__file__).resolve().parent.parent
version = json.loads((ROOT/'releases.json').read_text())['latest']
files = ['starter.html', 'icons.svg', 'favicon.svg', 'LICENSE', 'THIRD_PARTY_NOTICES.md', 'MODULES.md', 'COMPONENTS.md', 'MIGRATING.md', 'CHANGELOG.md']
files += [str(p.relative_to(ROOT)) for p in sorted((ROOT/'css').rglob('*.css'))]
files += [f'js/{name}.js' for name in ['timvw','controls','overlays','table','select','workflow','files','forms','locale','interactions','tabs','dialogs','templates']]
files += [str(p.relative_to(ROOT)) for p in sorted((ROOT/'third-party').glob('*.txt'))]
content = {name: (ROOT/name).read_bytes() for name in files}
# Documentation is bundled; example pages stay in the versioned online demo.
for name, data in list(content.items()):
    if not name.endswith('.md'): continue
    def link(match):
        target = match[2]
        url = urlsplit(target)
        if url.scheme or url.netloc or not url.path or url.path.removeprefix('./') in content: return match[0]
        return f'[{match[1]}](https://timvw.github.io/timvw-design-system/v{version}/{target.removeprefix("./")})'
    content[name] = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', link, data.decode()).encode()
content['README.md'] = f'''# timvw {version}

No framework, package installation or build step is required.

Serve this directory with any static HTTP server and open starter.html.
For example: `python3 -m http.server 8080`, then http://localhost:8080/starter.html.
JavaScript ES modules require HTTP; opening directly from disk may be restricted.

For the complete set, load css/timvw.css and css/components.css, and call init() from js/timvw.js.
For selective loading and reusable native HTML templates, read MODULES.md.
Preserve relative paths and third-party notices when copying files.

Documentation and examples: https://timvw.github.io/timvw-design-system/v{version}/
Repository: https://github.com/timvw/timvw-design-system

bundle.json lists a SHA-256 checksum for every payload file except itself.
'''.encode()
content['bundle.json'] = (json.dumps({'version':version,'sha256':{name:hashlib.sha256(data).hexdigest() for name,data in sorted(content.items())}},indent=2)+'\n').encode()
path=ROOT/'downloads'/f'timvw-{version}.zip'
if '--check' in sys.argv:
    with zipfile.ZipFile(path) as archive:
        assert set(archive.namelist()) == {f'timvw-{version}/{name}' for name in content}, 'Bundle file list differs'
        for name,data in content.items(): assert archive.read(f'timvw-{version}/{name}') == data, f'Stale bundle file: {name}'
    print(f'{path.name}: {len(content)} files verified.')
else:
    path.parent.mkdir(exist_ok=True)
    with zipfile.ZipFile(path,'w',zipfile.ZIP_DEFLATED) as archive:
        for name,data in sorted(content.items()):
            info=zipfile.ZipInfo(f'timvw-{version}/{name}',date_time=(2026,1,1,0,0,0)); info.compress_type=zipfile.ZIP_DEFLATED; info.external_attr=0o100644<<16
            archive.writestr(info,data)
    print(f'{path.name}: {len(content)} files, {path.stat().st_size} bytes.')
