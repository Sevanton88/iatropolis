<?php
/**
 * Iatropolis Medical Group – obrada kontakt forme.
 * Radi na standardnom cPanel hostingu (PHP 7.4+), šalje e-mail preko mail().
 */
declare(strict_types=1);

/* ------------------------------------------------------------------
   PODEŠAVANJA
   ------------------------------------------------------------------ */
const MAIL_TO        = 'info@iatropolismedicalcentre.rs';
const MAIL_FROM      = 'no-reply@iatropolismedicalcentre.rs'; // nalog mora postojati u cPanel-u (Email Accounts)
const MAIL_FROM_NAME = 'Iatropolis sajt';
const SITE_NAME      = 'iatropolismedicalcentre.rs';
const THANK_YOU_URL  = '/hvala/';
const RATE_MAX       = 5;     // najviše zahteva po IP adresi ...
const RATE_WINDOW    = 3600;  // ... u ovom periodu (sekunde)
const RATE_MIN_GAP   = 20;    // najmanji razmak između dva zahteva (sekunde)
const MIN_FILL_TIME  = 3;     // forma popunjena brže od ovoga = bot (sekunde)
const CONSENT_TEXT   = 'Saglasan/na sam da se moji podaci obrađuju radi odgovora na upit i da se proslede ustanovama Iatropolis u Grčkoj radi zakazivanja i procene, u skladu sa Politikom privatnosti.';
const CONSENT_TEXT_EN = 'I agree that my data may be processed to respond to my enquiry and forwarded to Iatropolis institutions in Greece for scheduling and assessment, in accordance with the Privacy policy.';
const POLICY_VERSION = '2.0 (14.10.2026)';

/* ------------------------------------------------------------------ */

header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

$wantsJson = stripos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false;
$lang = (($_POST['lang'] ?? '') === 'en') ? 'en' : 'sr';

/* Poruke posetiocu na izabranom jeziku (SR/EN switcher na sajtu salje polje "lang"). */
function msg(string $key): string
{
    global $lang;
    $nb = "\u{a0}";
    $m = [
        'bad'      => ['Neispravan zahtev.', 'Invalid request.'],
        'name'     => ['Unesite ime i prezime.', 'Please enter your full name.'],
        'phone'    => ["Unesite ispravan broj telefona (npr.{$nb}062{$nb}123{$nb}4567).", "Please enter a valid phone number (e.g.{$nb}062{$nb}123{$nb}4567)."],
        'consent'  => ['Za slanje zahteva potrebna je vaša saglasnost.', 'Your consent is required to send the request.'],
        'links'    => ['Poruka sadrži previše linkova.', 'The message contains too many links.'],
        'check'    => ['Proverite označena polja.', 'Please check the highlighted fields.'],
        'rate'     => ["Primili smo više zahteva sa vaše adrese. Pokušajte kasnije ili nas pozovite na +381{$nb}62{$nb}770{$nb}579.", "We have received several requests from your address. Please try again later or call us on +381{$nb}62{$nb}770{$nb}579."],
        'failed'   => ["Zahtev trenutno nije moguće poslati. Pozovite nas na +381{$nb}62{$nb}770{$nb}579.", "Your request could not be sent right now. Please call us on +381{$nb}62{$nb}770{$nb}579."],
    ];
    return $m[$key][$lang === 'en' ? 1 : 0];
}

function respond(bool $ok, array $payload = [], int $status = 200): void
{
    global $wantsJson;
    http_response_code($status);
    if ($wantsJson) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok] + $payload, JSON_UNESCAPED_UNICODE);
    } else {
        header('Location: ' . ($ok ? THANK_YOU_URL : '/?greska=1#kontakt'), true, 303);
    }
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(false, ['message' => msg('bad')], 405);
}

// Zahtev mora doći sa našeg domena (kada pregledač šalje Origin)
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '') {
    $originHost = parse_url($origin, PHP_URL_HOST);
    $host = preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? '');
    if ($originHost !== $host) {
        respond(false, ['message' => msg('bad')], 403);
    }
}

/* ---------- Ulazni podaci ---------- */
function field(string $name, int $max): string
{
    $v = $_POST[$name] ?? '';
    if (!is_string($v)) {
        return '';
    }
    $v = trim(str_replace("\0", '', $v));
    return mb_substr($v, 0, $max, 'UTF-8');
}
function oneLine(string $v): string
{
    return trim(preg_replace('/[\r\n\t]+/', ' ', $v));
}

$ime        = oneLine(field('ime', 80));
$telefon    = oneLine(field('telefon', 30));
$poruka     = field('poruka', 1500);
$saglasnost = ($_POST['saglasnost'] ?? '') === 'da';
$honeypot   = field('website', 200);
$ts         = (int) ($_POST['ts'] ?? 0);

// Botovi: tiho "uspeh", bez slanja
if ($honeypot !== '') {
    respond(true, ['redirect' => THANK_YOU_URL]);
}
if ($ts > 0 && (time() - intdiv($ts, 1000)) < MIN_FILL_TIME) {
    respond(true, ['redirect' => THANK_YOU_URL]);
}

/* ---------- Validacija ---------- */
$errors = [];
if (mb_strlen($ime, 'UTF-8') < 2) {
    $errors['ime'] = msg('name');
}
$telDigits = preg_replace('/[\s\-\/().]/', '', $telefon);
if (!preg_match('/^\+?\d{6,15}$/', $telDigits)) {
    $errors['telefon'] = msg('phone');
}
if (!$saglasnost) {
    $errors['saglasnost'] = msg('consent');
}
if (preg_match_all('~https?://~i', $poruka) > 2) {
    $errors['poruka'] = msg('links');
}
if ($errors) {
    respond(false, ['errors' => $errors, 'message' => msg('check')], 422);
}

/* ---------- Ograničenje učestalosti (po IP adresi, čuva se samo hash) ---------- */
function dataDir(): ?string
{
    // Prvo van public_html (nedostupno sa weba), pa rezervno unutar sajta (zaštićeno .htaccess-om)
    $candidates = [dirname(__DIR__) . '/iatropolis_data', __DIR__ . '/_data'];
    foreach ($candidates as $dir) {
        if (is_dir($dir) || @mkdir($dir, 0750, true)) {
            if (is_writable($dir)) {
                return $dir;
            }
        }
    }
    return null;
}

$dir = dataDir();
if ($dir !== null) {
    $ip   = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    $file = $dir . '/rl_' . hash('sha256', $ip . '|' . __FILE__) . '.json';
    $now  = time();
    $fh   = @fopen($file, 'c+');
    if ($fh) {
        flock($fh, LOCK_EX);
        $hits = json_decode((string) stream_get_contents($fh), true);
        $hits = array_values(array_filter(is_array($hits) ? $hits : [], static fn($t) => is_int($t) && $t > $now - RATE_WINDOW));
        $tooFast = $hits && ($now - max($hits)) < RATE_MIN_GAP;
        if (count($hits) >= RATE_MAX || $tooFast) {
            flock($fh, LOCK_UN);
            fclose($fh);
            respond(false, ['message' => msg('rate')], 429);
        }
        $hits[] = $now;
        ftruncate($fh, 0);
        rewind($fh);
        fwrite($fh, json_encode($hits));
        flock($fh, LOCK_UN);
        fclose($fh);
    }
    // Povremeno čišćenje starih fajlova
    if (random_int(1, 50) === 1) {
        foreach (glob($dir . '/rl_*.json') ?: [] as $old) {
            if (filemtime($old) < $now - RATE_WINDOW) {
                @unlink($old);
            }
        }
    }
}

/* ---------- Slanje e-maila ---------- */
$tz = new DateTimeZone('Europe/Belgrade');
$vreme = (new DateTime('now', $tz))->format('d.m.Y. H:i:s');

$body  = "Novi zahtev za konsultacije sa sajta " . SITE_NAME . "\n";
$body .= str_repeat('=', 52) . "\n\n";
$body .= "Ime i prezime: {$ime}\n";
$body .= "Telefon:       {$telefon}\n\n";
$body .= "Poruka:\n" . ($poruka !== '' ? $poruka : '(bez poruke)') . "\n\n";
$body .= str_repeat('-', 52) . "\n";
$body .= "Saglasnost:    DA, data {$vreme} (Europe/Belgrade)\n";
$body .= "Tekst:         " . ($lang === 'en' ? CONSENT_TEXT_EN : CONSENT_TEXT) . "\n";
$body .= "Jezik sajta:   " . strtoupper($lang) . "\n";
$body .= "Politika:      verzija " . POLICY_VERSION . "\n";
$body .= "Stranica:      https://" . SITE_NAME . "/\n";

$subject = 'Novi zahtev za konsultacije – ' . $ime;
$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
$fromName = '=?UTF-8?B?' . base64_encode(MAIL_FROM_NAME) . '?=';

$headers = [
    'From: ' . $fromName . ' <' . MAIL_FROM . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: PHP',
];

$sent = @mail(MAIL_TO, $encodedSubject, $body, implode("\r\n", $headers), '-f' . MAIL_FROM);

if (!$sent) {
    error_log('[iatropolis] mail() nije uspeo za zahtev u ' . $vreme);
    respond(false, ['message' => msg('failed')], 500);
}

respond(true, ['redirect' => THANK_YOU_URL]);
