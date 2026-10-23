# Iatropolis Medical Group – landing stranica

Domen: **https://iatropolismedicalcentre.rs** · Statički HTML/CSS/JS + jedan PHP fajl za formu (cPanel).

## Struktura

```
public_html/                 ← sadržaj ovog foldera ide u public_html na cPanel-u
├── index.html               landing stranica
├── posalji.php              obrada kontakt forme (e-mail preko mail())
├── hvala/index.html         stranica posle uspešnog slanja (noindex)
├── politika-privatnosti/    politika privatnosti v2.0 (HTML)
├── 404.html
├── css/style.css            svi stilovi + dizajn tokeni (:root)
├── js/main.js               meni, forma, kolačići, jezik, animacije — PODEŠAVANJA na vrhu fajla
├── js/i18n.js               engleski prevod (srpski je u HTML-u)
├── assets/img/              optimizovane slike (WebP + JPG)
├── assets/fonts/            Manrope (self-hosted, bez Google servera)
├── _data/                   ograničenje učestalosti forme (zaključano .htaccess-om)
├── .htaccess                HTTPS, bez www, keširanje, sigurnosna zaglavlja
├── robots.txt, sitemap.xml, favicon.ico, favicon-32.png, apple-touch-icon.png
```

## ⚠️ Trenutno: verzija za pregled (indeksiranje isključeno)

Sajt je spreman da se okači na pregledni URL (bilo koji domen/poddomen) da ga klijent vidi. Pretraživači ga ne indeksiraju (tri sloja zaštite):

- `<meta name="robots" content="noindex, nofollow">` na svim stranicama
- `X-Robots-Tag: noindex, nofollow` zaglavlje u `.htaccess`
- `robots.txt` → `Disallow: /`

Preusmerenje na HTTPS/bez www u `.htaccess` radi na bilo kom domenu, pa pregledni URL ne skače na pravi domen.

Napomena: forma na preglednom domenu šalje sa `no-reply@iatropolismedicalcentre.rs` – ako taj nalog ne postoji na tom hostingu, mail može da ne stigne ili završi u spamu. Za pregled je to očekivano.

### Pri pravoj objavi na iatropolismedicalcentre.rs

1. `index.html` i `politika-privatnosti/index.html` – obrisati red `<meta name="robots" ...> <!-- PREGLED ... -->` (na `404` i `hvala` ostaje).
2. `.htaccess` – obrisati red `Header always set X-Robots-Tag "noindex, nofollow"`.
3. `robots.txt` – zameniti sadržajem iz `robots.production.txt`, pa obrisati `robots.production.txt`.
4. U Google Search Console dodati domen i poslati `sitemap.xml`.

## Postavljanje na cPanel

1. U **File Manager** otpremiti sav sadržaj `public_html/` (uključujući skrivene `.htaccess` fajlove).
2. **Email Accounts**: napraviti `info@iatropolismedicalcentre.rs` i `no-reply@iatropolismedicalcentre.rs`.
3. **Email Deliverability**: proveriti da su SPF i DKIM zeleni (inače upiti završavaju u spamu).
4. **SSL/TLS Status**: uključiti AutoSSL (Let's Encrypt) — `.htaccess` preusmerava sve na HTTPS.
5. **MultiPHP Manager**: PHP 8.x (minimum 7.4).
6. Testirati formu na živom sajtu: stiže li e-mail i da li se otvara `/hvala/`.

## Podešavanja

- **E-mail primaoca / pošiljaoca** — vrh `posalji.php` (`MAIL_TO`, `MAIL_FROM`).
- **Meta Pixel / Google Analytics** — vrh `js/main.js` (`metaPixelId`, `ga4Id`).
  Dok su prazni, ništa se ne učitava i banner za kolačiće se ne prikazuje.
  Kada se upišu, pojavljuje se banner; skripte se učitavaju tek posle „Prihvatam sve“.
  Događaj `Lead` šalje se samo na `/hvala/` posle stvarno uspešnog slanja, bez podataka iz forme.

## Otvorena pitanja (pre objave)

- [ ] **Koordinator (blok „Niste sami.“)** – fotografija, potvrda da se ime Marija Sijan sme prikazati na sajtu (preuzeto iz politike privatnosti) i radno vreme. Do tada stoje inicijali „MS“.
- [ ] **Fotografija klinike ili lekara** za sekciju „Naš tim“ (umesto stock fotografije) i potvrda adrese „Ethnikis Antistaseos 54 i 56, Halandri, Atina“.
- [ ] **Rok odgovora** (npr. „javljamo se u roku od X sati“) – idealno za traku ispod heroja i blok koordinatora.
- [ ] **Slike aparata (trenutno fotografije, radi prikaza klijentu)** – CyberKnife je HD fotografija, PET-CT i TomoTherapy su niske rezolucije (iz mockupa). SVG ilustracije su sačuvane u komentarima u `index.html` (sekcija Tehnologije) i u `assets/img/ilustracija-*.svg`; za povratak zameniti <picture> sa <img> iz komentara i klasu vratiti na `tech__media`. Konačan izbor: prave fotografije od klijenta ili ilustracije.
- [ ] **Doktor i pacijent** — original je samo 768 px; poželjna veća verzija istog kadra.
- [ ] **Prava na fotografije i logo** — potvrditi licence (CyberKnife fotografija je verovatno materijal proizvođača).
- [ ] **Logo u SVG formatu** — trenutni PNG ima odsečen donji vrh romba (takav je izvorni fajl).
- [ ] **Politika privatnosti** — u originalnom PDF-u stoji `medicalcentreiatropolis.com`; na sajtu je zamenjeno potvrđenim domenom `iatropolismedicalcentre.rs`. Klijent treba da ažurira i PDF. Naziv u zaglavlju politike je „Iatropolis Medical Center Srbija“, a na sajtu „Iatropolis Medical Group“ — uskladiti.
- [ ] **Uslovi korišćenja** — dokument nije dostavljen, link je izostavljen iz footera.
- [ ] **Društvene mreže** — ikonice iz mockupa izostavljene dok ne stignu linkovi.
- [ ] **Medicinske tvrdnje** („Kraće vreme oporavka“, „Manje neželjenih efekata“, „najsavremeniji“, „besplatne konsultacije“) — medicinska/pravna provera.

## Odstupanja od mockupa (namerno)

- „ZAŠE TEHNOLOGIJE“ → „NAŠE TEHNOLOGIJE“ (greška u kucanju u mockupu).
- Godina u footeru se postavlja automatski.
- Forma ima vidljive labele, obavezan checkbox za saglasnost i napomenu da se ne šalje medicinska dokumentacija (zahtev iz politike privatnosti i specifikacije).
- „Saznajte više“ vodi na formu i automatski upisuje temu u poruku (nema podstranica).
- Na mobilnom: donja traka „Pozovite / Zakažite konsultacije“ (pojavljuje se posle hero sekcije, skriva se kod forme).
- Footer ima napomenu da koordinator nije zdravstvena ustanova (iz politike privatnosti).
- Uvodne kartice sa ikonicama zamenjene trakom od 4 kratke stavke (tekst iz odobrenih kartica); „Individualni pristup“ je izostavljen jer ga pokriva sekcija „Naš tim“.
- „Zašto Iatropolis“: dve kolone „Tehnologija | Podrška“ umesto 4 kartice; uklonjen plavi preliv.
- Procedura: ruta u tri faze (U Srbiji → U Atini → Posle povratka) umesto 6 kartica; tekst koraka nepromenjen.
- Novi blok „Niste sami.“ sa koordinatorom pre forme (tekst sastavljen iz odobrenih rečenica i politike privatnosti).
- Crvena je samo za glavnu akciju; dugme u sekciji „Naš tim“ je teget; greške u formi imaju sopstvenu nijansu i ikonicu.
- Meni (header i footer) prati redosled sekcija na stranici: O nama, Tehnologije, Tim, Procedura, Kontakt (u mockupu je Procedura bila pre Tima).
- Aparati (CyberKnife, PET-CT, TomoTherapy): trenutno fotografije; SVG ilustracije u bojama brenda su pripremljene kao alternativa (vidi otvorena pitanja).
- Top bar iznad headera sa telefonom i e-mailom; u kontakt kartici Viber i WhatsApp (isti broj – potvrditi sa klijentom).
- Plava za tekst je malo tamnija (#0B65C6) zbog WCAG AA kontrasta; ikonice i dalje #0679E8.

## Pregled za klijenta (sa GitHub-a)

Repozitorijum je najbolje držati kao **privatni** (politika privatnosti sa pravnim podacima, fotografije čije licence još nisu potvrđene).

Najlakši pregled:
1. Na GitHub-u: **Code → Download ZIP**, raspakovati.
2. U folderu projekta pokrenuti lokalni server (potreban je samo Python):

```bash
python -m http.server 8765 --directory public_html
```

3. Otvoriti http://127.0.0.1:8765 u browseru.

Napomene:
- Sajt koristi apsolutne putanje (`/css/...`), pa se ne otvara ispravno duplim klikom na `index.html` niti kao GitHub Pages podstranica – potreban je server (lokalni ili hosting).
- Kontakt forma lokalno ne šalje e-mail (potreban je PHP na cPanel-u); prikazaće poruku o grešci sa brojem telefona – to je očekivano.

## Lokalni pregled

```bash
python -m http.server 8765 --directory public_html
```

Zatim otvoriti http://127.0.0.1:8765 (forma lokalno ne šalje — potreban je PHP na hostingu).

## Tipografija i pravopis (pravila za sve buduće izmene)

Jedan font: **Manrope** (varijabilni, 200–800, self-hosted). Veličine i debljine su CSS tokeni u `:root` (`--fs-*`, `--fw-*`) – ne upisivati brojeve direktno.

| Uloga | Token | Debljina |
|---|---|---|
| H1 / H2 / H3 | `--fs-h1` / `--fs-h2` / `--fs-h3` | `--fw-heading` (650) |
| Uvod ispod naslova sekcije | `--fs-lead` (19 px) | 400 |
| Tekst | `--fs-body` (17 px) | 400 |
| Naslov kartice / koraka | `--fs-title` (17 px) | 600 |
| Kartice, liste, meni | `--fs-small` (15 px) | 400–500 |
| Napomene, pravni tekst, natpis iznad naslova | `--fs-caption` (14 px) | 400 / 600 |
| Dugmad i linkovi-akcije | – | 700 |

- **Rečenični stil** svuda: veliko samo prvo slovo i vlastita imena (Atina, Srbija, Iatropolis Medical Group, CyberKnife, TomoTherapy, PET-CT). Bez Title Case-a.
- **Bez verzala** (sva velika slova) za tekst duži od jedne-dve reči.
- **Tačka:** naslovi sekcija (odobreni tekst) imaju tačku; naslovi kartica i stavke liste nemaju; opisi u karticama (rečenice) imaju.
- **Nedeljivi razmak** (`&nbsp;`) posle jednoslovnih reči (u, i, a, o, s, k) i u broju telefona.
- **Crta** u rečenici: ` – ` (kraća crta, razmak pre je nedeljiv).

## Jezici (SR / EN)

Isti princip kao na sajtu Žitopromet: **srpski je samo u HTML-u**, engleski je u `public_html/js/i18n.js`.

- Izmena srpskog teksta → menja se samo HTML.
- Izmena engleskog → menja se ključ u `js/i18n.js`.
- Novi tekst → elementu dodati `data-i18n="kljuc"` (ili `data-i18n-html` ako sadrži `<strong>`/`<a>`, odnosno `data-i18n-attr="alt:kljuc"` za atribute) i isti ključ u `i18n.js`. Ključ koji ne postoji ostaje na srpskom.
- Izbor jezika se pamti (`localStorage`, ključ `iatropolis-lang`) i važi na svim stranicama. Forma šalje polje `lang`, pa i poruke iz `posalji.php` stižu na izabranom jeziku; u e-mailu piše „Jezik sajta: EN“.
- Politika privatnosti je samo na srpskom; na engleskom se prikazuje napomena da prevod nije dostupan.

Otvoreno:
- [ ] **Engleski prevod** treba da pregleda/odobri klijent (naročito medicinske tvrdnje).
- [ ] Pretraživači i pregledi na društvenim mrežama vide samo srpsku verziju (prevod je u browseru). Ako engleska publika postane važna, sledeći korak je zasebna `/en/` verzija stranice.
- [ ] Engleska verzija politike privatnosti (pravni tekst – prevod treba da odobri klijent).
