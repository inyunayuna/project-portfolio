#!/usr/bin/env python3
"""Publish content-addressed JS/CSS without a framework or npm build step.

Run after JS/CSS changes. JSON-only updates need no preparation.
Old releases are deliberately retained for open tabs and cached documents.
"""
import hashlib
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VIEWS = {
    'index.html': 'list-view.js', 'writings.html': 'list-view.js',
    'project.html': 'detail-view.js', 'notes.html': 'notes-view.js',
    'cv.html': 'notes-view.js', '404.html': None,
}


def prepare():
    sources = sorted((ROOT / 'js').glob('*.js')) + sorted((ROOT / 'css').glob('*.css'))
    digest = hashlib.sha256()
    for file in sources:
        digest.update(file.relative_to(ROOT).as_posix().encode())
        digest.update(b'\0' + file.read_bytes() + b'\0')
    release = digest.hexdigest()[:16]
    base = f'assets/site/{release}'
    target = ROOT / base
    (target / 'js').mkdir(parents=True, exist_ok=True)
    for file in (ROOT / 'js').glob('*.js'):
        (target / 'js' / file.name).write_bytes(file.read_bytes())
    # Font-face rules retain the existing Google-hosted, unicode-subset font files.
    # Only the render-blocking stylesheet request to fonts.googleapis.com is removed.
    css = (ROOT / 'css/fonts.css').read_text() + '\n' + (ROOT / 'css/style.css').read_text()
    (target / 'style.css').write_text(css)

    def dependencies(name, found):
        if name in found:
            return
        found.add(name)
        source = (ROOT / 'js' / name).read_text()
        for dependency in re.findall(r'from\s+[\'"]\./([^\'"]+\.js)[\'"]', source):
            dependencies(dependency, found)

    for name, view in VIEWS.items():
        file = ROOT / name
        html = file.read_text()
        html = re.sub(r'\s*<link rel="preconnect" href="https://fonts.googleapis.com"\s*/>', '', html)
        html = re.sub(r'\s*<link\s+href="https://fonts.googleapis.com/[^>]+/>', '', html)
        html = re.sub(r'<link rel="stylesheet" href="(?:css/style.css|assets/site/[a-f0-9]+/style.css)"\s*/>',
                      f'<link rel="stylesheet" href="{base}/style.css" />', html)
        html = re.sub(r'<script type="module" src="(?:js/app.js|assets/site/[a-f0-9]+/js/app.js)"></script>',
                      f'<script type="module" src="{base}/js/app.js"></script>', html)
        html = re.sub(r'\n  <!-- modulepreload:start -->.*?<!-- modulepreload:end -->\n', '', html, flags=re.S)
        modules = set()
        dependencies('app.js', modules)
        if view:
            dependencies(view, modules)
        links = '\n'.join(f'  <link rel="modulepreload" href="{base}/js/{module}" />'
                          for module in sorted(modules))
        html = html.replace('</head>', f'\n  <!-- modulepreload:start -->\n{links}\n  <!-- modulepreload:end -->\n</head>')
        file.write_text(html)
    print(f'Prepared {base}; upload assets first, HTML and .htaccess last.')


if __name__ == '__main__':
    prepare()
