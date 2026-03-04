from PIL import Image, ImageDraw, ImageFont
import os

os.makedirs(r"C:\Users\Placido\Cv-Fit\screenshots", exist_ok=True)

BG       = (15, 15, 19)
SURFACE  = (26, 26, 34)
SURFACE2 = (34, 34, 46)
BORDER   = (46, 46, 62)
ACCENT   = (108, 99, 255)
TEXT     = (240, 240, 245)
MUTED    = (136, 136, 153)
SUCCESS  = (62, 207, 142)

W, H = 1280, 800

def load_font(size):
    for name in ["arialbd.ttf", "arial.ttf", "DejaVuSans-Bold.ttf", "DejaVuSans.ttf"]:
        try:
            return ImageFont.truetype(name, size)
        except:
            pass
    return ImageFont.load_default()

def draw_browser(draw, url):
    draw.rectangle([0, 0, W, 60], fill=(40, 40, 50))
    draw.rounded_rectangle([20, 10, W-200, 40], radius=6, fill=(55, 55, 65))
    draw.text((30, 18), "  " + url, font=load_font(13), fill=MUTED)

def draw_popup_base(img, px, py, pw, ph):
    for s in range(15, 0, -1):
        shadow = Image.new("RGBA", img.size, (0, 0, 0, 0))
        sd = ImageDraw.Draw(shadow)
        sd.rounded_rectangle([px+s, py+s, px+pw+s, py+ph+s], radius=12, fill=(0, 0, 0, int(150*(1-s/15))))
        img.paste(shadow, mask=shadow)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([px, py, px+pw, py+ph], radius=12, fill=SURFACE, outline=BORDER, width=1)
    d.rounded_rectangle([px, py, px+pw, py+py+48], radius=12, fill=SURFACE)
    d.rectangle([px, py+24, px+pw, py+48], fill=SURFACE)
    d.line([px, py+48, px+pw, py+48], fill=BORDER, width=1)
    d.text((px+16, py+16), "CVFit", font=load_font(17), fill=ACCENT)
    return ImageDraw.Draw(img)

# ── SCREENSHOT 1: Login ──────────────────────────────
img1 = Image.new("RGBA", (W, H), (20, 20, 30, 255))
d1 = ImageDraw.Draw(img1)
draw_browser(d1, "https://linkedin.com/jobs/view/senior-backend-developer")

# Page background
d1.rectangle([0, 60, W, H], fill=(235, 235, 240))
d1.rectangle([40, 80, W-430, H-20], fill=(255, 255, 255))
d1.text((60, 95), "Senior Backend Developer - TechCorp Milano", font=load_font(18), fill=(30,30,30))
d1.text((60, 122), "Milano • Full-time • 60-90K €", font=load_font(13), fill=(100,100,100))

px, py, pw, ph = W-420, 60, 400, 430
d1 = draw_popup_base(img1, px, py, pw, ph)

d1.text((px+pw//2-140, py+62), "Ottimizza il tuo CV per ogni offerta", font=load_font(12), fill=MUTED)
d1.text((px+pw//2-80, py+80), "in 15 secondi con AI.", font=load_font(12), fill=MUTED)

# Tabs
d1.rounded_rectangle([px+16, py+106, px+pw-16, py+134], radius=8, fill=SURFACE2)
d1.rounded_rectangle([px+19, py+109, px+pw//2-2, py+131], radius=6, fill=ACCENT)
d1.text((px+60, py+116), "Accedi", font=load_font(13), fill=TEXT)
d1.text((px+pw//2+45, py+116), "Registrati", font=load_font(13), fill=MUTED)

# Fields
d1.rounded_rectangle([px+16, py+148, px+pw-16, py+176], radius=8, fill=SURFACE2, outline=BORDER, width=1)
d1.text((px+28, py+157), "Email", font=load_font(12), fill=MUTED)
d1.rounded_rectangle([px+16, py+184, px+pw-16, py+212], radius=8, fill=SURFACE2, outline=ACCENT, width=2)
d1.text((px+28, py+193), "Password", font=load_font(12), fill=MUTED)

# Button
d1.rounded_rectangle([px+16, py+228, px+pw-16, py+260], radius=8, fill=ACCENT)
d1.text((px+pw//2-28, py+238), "Accedi", font=load_font(14), fill=TEXT)

# Feature row
feats = ["⚡ AI Istantanea", "📊 Match Score", "✉ Cover Letter"]
for i, f in enumerate(feats):
    bx = px+16 + i*124
    d1.rounded_rectangle([bx, py+278, bx+118, py+302], radius=6, fill=SURFACE2, outline=BORDER, width=1)
    d1.text((bx+10, py+285), f, font=load_font(10), fill=MUTED)

img1 = img1.convert("RGB")
img1.save(r"C:\Users\Placido\Cv-Fit\screenshots\screenshot_1_login.png")
print("screenshot_1_login.png")

# ── SCREENSHOT 2: Main App ───────────────────────────
img2 = Image.new("RGBA", (W, H), (20, 20, 30, 255))
d2 = ImageDraw.Draw(img2)
draw_browser(d2, "https://linkedin.com/jobs/view/backend-developer-node-js-12345")

d2.rectangle([0, 60, W, H], fill=(235, 235, 240))
d2.rectangle([40, 80, W-460, H-20], fill=(255, 255, 255))
d2.text((60, 95), "Backend Developer — TechCorp", font=load_font(18), fill=(30,30,30))
for i, t in enumerate(["Node.js • PostgreSQL • Docker • AWS", "Milano, Italia • Full-time", "Candidati ora — 50+ candidati"]):
    d2.text((60, 122+i*22), t, font=load_font(13), fill=(100,100,100))

px2, py2, pw2, ph2 = W-460, 60, 440, 520
d2 = draw_popup_base(img2, px2, py2, pw2, ph2)

d2.rounded_rectangle([px2+pw2-118, py2+13, px2+pw2-14, py2+35], radius=12, fill=SURFACE2, outline=BORDER, width=1)
d2.text((px2+pw2-106, py2+19), "5 rimasti", font=load_font(11), fill=ACCENT)

# Step 1
d2.ellipse([px2+16, py2+60, px2+30, py2+74], fill=ACCENT)
d2.text((px2+19, py2+62), "1", font=load_font(10), fill=TEXT)
d2.text((px2+36, py2+62), "IL TUO CV BASE", font=load_font(10), fill=MUTED)
d2.rounded_rectangle([px2+16, py2+80, px2+pw2-16, py2+186], radius=8, fill=SURFACE2, outline=BORDER, width=1)
cv_lines = ["Mario Rossi — Sviluppatore Backend", "3 anni exp. | Node.js, PostgreSQL, Docker, AWS", "Milano | Laurea Informatica 2020"]
for i, line in enumerate(cv_lines):
    d2.text((px2+24, py2+92+i*24), line, font=load_font(11), fill=TEXT if i==0 else MUTED)
d2.rounded_rectangle([px2+16, py2+194, px2+108, py2+216], radius=6, fill=SURFACE2, outline=BORDER, width=1)
d2.text((px2+22, py2+201), "💾 Salva CV", font=load_font(10), fill=MUTED)
d2.text((px2+118, py2+201), "✓ Salvato", font=load_font(10), fill=SUCCESS)

# Step 2 + job detected
d2.ellipse([px2+16, py2+232, px2+30, py2+246], fill=ACCENT)
d2.text((px2+19, py2+234), "2", font=load_font(10), fill=TEXT)
d2.text((px2+36, py2+234), "OFFERTA DI LAVORO", font=load_font(10), fill=MUTED)
d2.rounded_rectangle([px2+16, py2+250, px2+pw2-16, py2+274], radius=6, fill=(20, 60, 40), outline=(62,207,142,100), width=1)
d2.text((px2+24, py2+258), "✓ Offerta rilevata da questa pagina", font=load_font(11), fill=SUCCESS)
d2.rounded_rectangle([px2+16, py2+282, px2+pw2-16, py2+356], radius=8, fill=SURFACE2, outline=ACCENT, width=1)
d2.text((px2+24, py2+292), "Backend Developer - TechCorp", font=load_font(12), fill=TEXT)
d2.text((px2+24, py2+314), "Node.js, PostgreSQL, Docker, AWS...", font=load_font(11), fill=MUTED)

# CTA
d2.rounded_rectangle([px2+16, py2+374, px2+pw2-16, py2+412], radius=8, fill=ACCENT)
d2.text((px2+pw2//2-75, py2+384), "⚡ Ottimizza CV", font=load_font(16), fill=TEXT)

img2 = img2.convert("RGB")
img2.save(r"C:\Users\Placido\Cv-Fit\screenshots\screenshot_2_main.png")
print("screenshot_2_main.png")

# ── SCREENSHOT 3: Result ─────────────────────────────
img3 = Image.new("RGBA", (W, H), (20, 20, 30, 255))
d3 = ImageDraw.Draw(img3)
draw_browser(d3, "https://linkedin.com/jobs/view/backend-developer-node-js-12345")

d3.rectangle([0, 60, W, H], fill=(235, 235, 240))
d3.rectangle([40, 80, W-480, H-20], fill=(255, 255, 255))
d3.text((60, 95), "Backend Developer — TechCorp", font=load_font(18), fill=(30,30,30))
d3.text((60, 122), "Node.js • PostgreSQL • Docker • AWS  |  Milano", font=load_font(13), fill=(100,100,100))

px3, py3, pw3, ph3 = W-475, 60, 455, 560
d3 = draw_popup_base(img3, px3, py3, pw3, ph3)

d3.text((px3+16, py3+60), "← Indietro", font=load_font(12), fill=ACCENT)
d3.rounded_rectangle([px3+pw3-86, py3+50, px3+pw3-14, py3+92], radius=8, fill=SURFACE2, outline=BORDER, width=1)
d3.text((px3+pw3-70, py3+54), "Match", font=load_font(9), fill=MUTED)
d3.text((px3+pw3-70, py3+66), "82%", font=load_font(22), fill=SUCCESS)

# Glow
glow = Image.new("RGBA", img3.size, (0,0,0,0))
gd = ImageDraw.Draw(glow)
gd.ellipse([px3+pw3-100, py3+40, px3+pw3+10, py3+110], fill=(62,207,142,50))
img3.paste(glow, mask=glow)
d3 = ImageDraw.Draw(img3)

# Result tabs
tabs = ["CV Ottimizzato", "Cover Letter", "Gap Analysis"]
tw = (pw3-40)//3
for i, tab in enumerate(tabs):
    tx = px3+16+i*(tw+4)
    d3.rounded_rectangle([tx, py3+102, tx+tw, py3+126], radius=6, fill=ACCENT if i==0 else SURFACE2, outline=ACCENT if i==0 else BORDER, width=1)
    d3.text((tx+tw//2-len(tab)*3, py3+110), tab, font=load_font(10), fill=TEXT if i==0 else MUTED)

# CV result
d3.rounded_rectangle([px3+16, py3+138, px3+pw3-16, py3+440], radius=8, fill=SURFACE2, outline=BORDER, width=1)
lines = [
    ("Mario Rossi", 14, TEXT),
    ("Sviluppatore Backend | Node.js & PostgreSQL Specialist", 11, ACCENT),
    ("", 11, MUTED),
    ("PROFILO PROFESSIONALE", 11, TEXT),
    ("Sviluppatore Backend con 3 anni di esperienza nella", 11, MUTED),
    ("progettazione di API REST scalabili, PostgreSQL e AWS.", 11, MUTED),
    ("", 11, MUTED),
    ("COMPETENZE TECNICHE", 11, TEXT),
    ("• Node.js, Python, JavaScript", 11, MUTED),
    ("• PostgreSQL (query optimization, schema design)", 11, MUTED),
    ("• Docker, AWS, Git  |  API REST, Microservizi", 11, MUTED),
    ("", 11, MUTED),
    ("ESPERIENZA", 11, TEXT),
    ("Sviluppatore Backend — [Azienda]  |  2021–oggi", 11, MUTED),
    ("• Ottimizzato query DB: -40% tempi di risposta", 11, MUTED),
]
for i, (line, fs, col) in enumerate(lines):
    d3.text((px3+24, py3+148+i*19), line, font=load_font(fs), fill=col)

d3.rounded_rectangle([px3+16, py3+450, px3+pw3-16, py3+476], radius=6, fill=SURFACE2, outline=BORDER, width=1)
d3.text((px3+pw3//2-35, py3+458), "📋 Copia", font=load_font(12), fill=MUTED)

img3 = img3.convert("RGB")
img3.save(r"C:\Users\Placido\Cv-Fit\screenshots\screenshot_3_result.png")
print("screenshot_3_result.png")

print("\nSalvati in C:\\Users\\Placido\\Cv-Fit\\screenshots\\")
