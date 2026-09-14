#!/usr/bin/env python3
"""Synchronize static catalogue/guide sections from checked-in JSON; no site runtime build."""
from pathlib import Path
from html import escape as e
import json
import sys
ROOT = Path(__file__).resolve().parent.parent
catalog = json.loads((ROOT/'catalog.json').read_text())
guides = json.loads((ROOT/'component-guides.json').read_text())
cards = '\n'.join(f'<article class="tvw-card" data-catalog-item data-category="{e(i["category"])}"><span class="tvw-badge">{e(i["category"])}</span><h3><a href="{e(i["href"])}">{e(i["title"])}</a></h3><p>{e(i["description"])}</p></article>' for i in catalog)
sections = ''
for i in guides:
    assert (ROOT/'components'/f'{i["package"]}.js').is_file(), f'Missing package for {i["id"]}'
    rows = [('Variants',i['variants']),('States',i['states']),('Use & keyboard',i['guidance']),('Import','components/'+i['package']+'.js — styles and behavior included')]
    details = ''.join(f'<dt>{e(name)}</dt><dd>{e(value)}</dd>' for name,value in rows)
    sections += f'<section id="{i["id"]}"><h2>{e(i["title"])}</h2><dl class="tvw-detail-list">{details}</dl><details><summary>Copyable example</summary><pre><code id="recipe-{i["id"]}">{e(i["example"])}</code></pre><button type="button" class="tvw-button tvw-button--secondary" data-copy="recipe-{i["id"]}" hidden>Copy example</button><span role="status"></span></details></section>'
for name,start,end,content in [('explore.html','<div class="tvw-grid" id="component-results">','</div>','\n'+cards+'\n'),('guide.html','<!-- guides:start -->','<!-- guides:end -->',sections)]:
    path=ROOT/name; text=path.read_text(); a=text.index(start)+len(start); b=text.index(end,a); generated=text[:a]+content+text[b:]
    if '--check' in sys.argv: assert generated == text, f'{name} is out of date; run scripts/build-docs.py'
    else: path.write_text(generated)
print(f'{len(catalog)} catalogue entries and {len(guides)} component families synchronized.')
