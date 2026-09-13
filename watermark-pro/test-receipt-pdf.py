from pathlib import Path
import pdfplumber

boxes = []
layouts = []
for name in ['desktop', 'mobile']:
    with pdfplumber.open(Path('tmp/pdfs') / f'{name}-receipt.pdf') as pdf:
        assert len(pdf.pages) == 1, f'{name}: extra printed page'
        page = pdf.pages[0]
        assert abs(page.width - 595) < 1 and abs(page.height - 842) < 1
        boxes.append((min(c['x0'] for c in page.chars), min(c['top'] for c in page.chars)))
        assert 32 < boxes[-1][0] < 36, f'{name}: left margin {boxes[-1]}'
        colors = [c.get('non_stroking_color') for c in page.chars]
        assert any(isinstance(c, tuple) and len(c) == 3 and abs(c[0]-1) < .01 and c[1] < .01 and abs(c[2]-136/255) < .01 for c in colors), f'{name}: missing bright pink'
        assert 'Pasang' not in (page.extract_text() or '')
        assert (page.extract_text() or '').count('Resit #') == 1, f'{name}: duplicated receipt'
        layouts.append([(c['text'], round(c['x0'], 2), round(c['top'], 2)) for c in page.chars])
assert all(abs(a-b) < .1 for a,b in zip(boxes[0], boxes[1])), boxes
assert layouts[0] == layouts[1], 'mobile text layout differs from desktop'
print('PASS: both PDFs one A4 page, matching 12 mm margins, exact bright pink, no install text', boxes)
