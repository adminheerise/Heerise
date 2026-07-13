import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
raw = (ROOT / "tmp-portfolio-raw.html").read_text(encoding="utf-8")

body_m = re.search(r"<body>(.*)</body>", raw, re.S)
body = body_m.group(1) if body_m else raw

body = re.sub(r'<div class="eyebrow">.*?</div>\s*', "", body, flags=re.S)
body = re.sub(r'<div class="eyebrow-dot"></div>\s*', "", body)
body = re.sub(r'<span class="signal-icon">.*?</span>\s*', "", body)
body = re.sub(r'<span class="pgcard-icon">.*?</span>\s*', "", body)
body = re.sub(r'<span class="del-icon">.*?</span>', "", body)
body = re.sub(r'<span class="jd-check">.*?</span>\s*', "", body)
body = re.sub(r'\s*<span class="view-btn-note">.*?</span>', "", body)
body = re.sub(r"[\U0001F300-\U0001FAFF\U00002700-\U000027BF]", "", body)

body = body.replace(
    "Open to senior L&amp;D roles · Learning Experience Designer",
    "Learning Experience Designer",
)
body = re.sub(
    r"Open to senior L&amp;D and learning experience design roles at tech companies and global operations teams\.",
    "Interested in learning experience design roles at tech companies and global operations teams.",
    body,
)
body = body.replace(
    "I'm currently targeting senior L&amp;D roles at tech companies where learning design is treated as a strategic function, not a support service.",
    "I'm focused on roles where learning design is treated as a strategic function, not a support service.",
)

body = re.sub(
    r'<div class="about-photo">.*?</div>',
    '<div class="about-photo" aria-hidden="true"></div>',
    body,
    flags=re.S,
)
body = re.sub(
    r'<div class="signal"><span><strong>',
    '<div class="signal"><strong>',
    body,
)
body = re.sub(r"</strong></span></div>", "</strong></div>", body)

partial = (
    '<script>document.documentElement.classList.add("ps-page");</script>\n'
    '<div class="ps-site">\n'
    + body.strip()
    + "\n</div>\n"
)

out = ROOT / "layouts/partials/career-lab-portfolio-sample.html"
out.write_text(partial, encoding="utf-8")
print(f"written {out} ({len(partial)} chars)")
