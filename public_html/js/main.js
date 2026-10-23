/* Iatropolis Medical Group – landing stranica */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     PODEŠAVANJA
     Upisati ID-jeve kada budu poznati. Dok su prazni, nijedan alat za
     praćenje se ne učitava i banner za kolačiće se ne prikazuje.
     ------------------------------------------------------------------ */
  var CONFIG = {
    metaPixelId: '',      // npr. '123456789012345'
    ga4Id: '',            // npr. 'G-XXXXXXXXXX'
    consentKey: 'iatro_consent_v1',
    leadFlagKey: 'iatro_lead',
    langKey: 'iatropolis-lang',
    phoneDisplay: '+381 62 770 579' // nedeljivi razmaci: broj se ne lomi u dva reda
  };

  var doc = document;
  var root = doc.documentElement;
  root.classList.add('js');

  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }

  function storageGet(store, key) { try { return window[store].getItem(key); } catch (e) { return null; } }
  function storageSet(store, key, val) { try { window[store].setItem(key, val); } catch (e) { /* privatni režim */ } }
  function storageRemove(store, key) { try { window[store].removeItem(key); } catch (e) { /* privatni režim */ } }

  /* ==================================================================
     JEZIK (SR / EN)
     Srpski je u HTML-u; engleski u js/i18n.js. Prvi put kad se element
     prevede, njegov srpski original se pamti i vraća pri povratku na SR.
     ================================================================== */
  var EN = window.IATRO_I18N_EN || {};
  var srLang = root.getAttribute('lang') || 'sr-Latn-RS';
  var currentLang = 'sr';
  var originals = new WeakMap();
  var srTitle = null;
  var srDesc = null;

  function t(key, srFallback) {
    return currentLang === 'en' && EN[key] != null ? EN[key] : srFallback;
  }

  function original(el) {
    if (!originals.has(el)) originals.set(el, {});
    return originals.get(el);
  }

  function applyLang(lang) {
    currentLang = lang === 'en' ? 'en' : 'sr';
    var en = currentLang === 'en' ? EN : null;

    $$('[data-i18n]').forEach(function (el) {
      var o = original(el);
      if (o.text === undefined) o.text = el.textContent;
      var v = en && en[el.getAttribute('data-i18n')];
      el.textContent = v != null ? v : o.text;
    });
    $$('[data-i18n-html]').forEach(function (el) {
      var o = original(el);
      if (o.html === undefined) o.html = el.innerHTML;
      var v = en && en[el.getAttribute('data-i18n-html')];
      el.innerHTML = v != null ? v : o.html;
    });
    $$('[data-i18n-attr]').forEach(function (el) {
      var o = original(el);
      o.attrs = o.attrs || {};
      el.getAttribute('data-i18n-attr').split(',').forEach(function (pair) {
        var parts = pair.split(':');
        var attr = parts[0].trim();
        var key = (parts[1] || '').trim();
        if (o.attrs[attr] === undefined) o.attrs[attr] = el.getAttribute(attr);
        var v = en && en[key];
        var value = v != null ? v : o.attrs[attr];
        if (value == null) el.removeAttribute(attr); else el.setAttribute(attr, value);
      });
    });

    // naslov i opis stranice (ključ stoji na <html data-i18n-page="...">)
    var page = root.getAttribute('data-i18n-page') || 'meta';
    var descEl = $('meta[name="description"]');
    if (srTitle === null) { srTitle = doc.title; srDesc = descEl ? descEl.content : null; }
    doc.title = (en && en[page + '.title']) || srTitle;
    if (descEl && srDesc !== null) descEl.content = (en && en[page + '.desc']) || srDesc;

    root.setAttribute('lang', currentLang === 'en' ? 'en' : srLang);
    $$('[data-lang]').forEach(function (b) {
      var on = b.getAttribute('data-lang') === currentLang;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    $$('input[name="lang"]').forEach(function (inp) { inp.value = currentLang; });
    storageSet('localStorage', CONFIG.langKey, currentLang);
    doc.dispatchEvent(new CustomEvent('langchange', { detail: { lang: currentLang } }));
  }

  $$('[data-lang]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (btn.getAttribute('data-lang') !== currentLang) applyLang(btn.getAttribute('data-lang'));
    });
  });
  if (storageGet('localStorage', CONFIG.langKey) === 'en') applyLang('en');

  /* ---------- Godina u footeru ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

  /* ---------- Header senka pri skrolu ---------- */
  var header = $('[data-header]');
  function onScroll() {
    if (!header) return;
    if (window.scrollY > 8) header.setAttribute('data-scrolled', '');
    else header.removeAttribute('data-scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobilni meni (panel ispod headera) ---------- */
  var toggle = $('[data-menu-toggle]');
  var nav = $('[data-nav]');
  function setMenu(open) {
    if (!toggle || !nav) return;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open && header) {
      // panel je pozicioniran u odnosu na header (backdrop-filter), pa je samo visinu
      // potrebno ograničiti prema stvarnoj donjoj ivici headera (iznad je top bar)
      var bottom = Math.round(header.getBoundingClientRect().bottom);
      nav.style.maxHeight = 'calc(100dvh - ' + (bottom + 24) + 'px)';
    }
    if (open) nav.setAttribute('data-open', ''); else nav.removeAttribute('data-open');
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        toggle.focus();
      }
    });
    doc.addEventListener('click', function (e) {
      if (toggle.getAttribute('aria-expanded') === 'true' && !nav.contains(e.target) && !toggle.contains(e.target)) setMenu(false);
    });
    window.matchMedia('(min-width: 1081px)').addEventListener('change', function (mq) { if (mq.matches) setMenu(false); });
    // ako se skroluje dok je meni otvoren, panel prati header (top bar odlazi sa ekrana)
    window.addEventListener('scroll', function () {
      if (toggle.getAttribute('aria-expanded') === 'true') setMenu(true);
    }, { passive: true });
  }

  /* ---------- Aktivna stavka menija ---------- */
  var navLinks = $$('.site-nav ul a[href^="#"]');
  var navTargets = navLinks
    .map(function (a) { return { link: a, el: doc.getElementById(a.getAttribute('href').slice(1)) }; })
    .filter(function (x) { return x.el; });
  var navTicking = false;
  function updateActiveNav() {
    navTicking = false;
    var line = window.innerHeight * 0.4;
    var current = null;
    navTargets.forEach(function (x) {
      var r = x.el.getBoundingClientRect();
      if (r.top <= line && r.bottom > line) current = x;
    });
    navTargets.forEach(function (x) {
      if (x === current) x.link.setAttribute('aria-current', 'true');
      else x.link.removeAttribute('aria-current');
    });
  }
  if (navTargets.length) {
    window.addEventListener('scroll', function () {
      if (!navTicking) { navTicking = true; window.requestAnimationFrame(updateActiveNav); }
    }, { passive: true });
    updateActiveNav();
  }

  /* ---------- Pojavljivanje pri skrolu ---------- */
  var revealEls = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Mobilna traka: posle hero sekcije, skrivena kod forme ---------- */
  var bar = $('[data-mobile-bar]');
  var hero = $('.hero');
  var contact = doc.getElementById('kontakt');
  if (bar && hero && 'IntersectionObserver' in window) {
    var pastHero = false;
    var atContact = false;
    var updateBar = function () {
      if (pastHero && !atContact) bar.setAttribute('data-visible', ''); else bar.removeAttribute('data-visible');
    };
    new IntersectionObserver(function (entries) {
      pastHero = !entries[0].isIntersecting;
      updateBar();
    }, { rootMargin: '-40% 0px 0px 0px' }).observe(hero);
    if (contact) {
      new IntersectionObserver(function (entries) {
        atContact = entries[0].isIntersecting;
        updateBar();
      }, { threshold: 0.15 }).observe(contact);
    }
  } else if (bar) {
    bar.setAttribute('data-visible', '');
  }

  /* ---------- Kontakt forma ---------- */
  var form = $('[data-contact-form]');

  // "Saznajte više" popunjava poruku temom i vodi na formu
  $$('[data-interest]').forEach(function (link) {
    link.addEventListener('click', function () {
      if (!form) return;
      var msg = form.elements.poruka;
      if (msg && !msg.value.trim()) msg.value = link.getAttribute('data-interest');
      setTimeout(function () {
        var name = form.elements.ime;
        if (name) name.focus({ preventScroll: true });
      }, 450);
    });
  });

  if (form) {
    var tsField = $('[data-ts]', form);
    if (tsField) tsField.value = String(Date.now());

    var alertBox = $('[data-form-alert]', form);
    var submitBtn = $('[data-submit]', form);
    var submitLabel = $('[data-submit-label]', form);

    function message(name) {
      switch (name) {
        case 'ime': return t('form.err.name', 'Unesite ime i prezime.');
        case 'telefon': return t('form.err.phone', 'Unesite ispravan broj telefona (npr. 062 123 4567).');
        case 'poruka': return t('form.err.msg', 'Poruka može imati najviše 1500 karaktera.');
        case 'saglasnost': return t('form.err.consent', 'Za slanje zahteva potrebna je vaša saglasnost.');
      }
      return '';
    }

    function phoneIsValid(value) {
      var cleaned = value.replace(/[\s\-\/().]/g, '');
      return /^\+?\d{6,15}$/.test(cleaned);
    }

    function setError(name, text) {
      var field = form.elements[name];
      var out = $('[data-error-for="' + name + '"]', form);
      if (out) out.textContent = text || '';
      if (field) {
        if (text) field.setAttribute('aria-invalid', 'true');
        else field.removeAttribute('aria-invalid');
      }
    }

    function validate() {
      var errors = {};
      var ime = form.elements.ime.value.trim();
      var tel = form.elements.telefon.value.trim();
      var poruka = form.elements.poruka.value;
      if (ime.length < 2) errors.ime = message('ime');
      if (!phoneIsValid(tel)) errors.telefon = message('telefon');
      if (poruka.length > 1500) errors.poruka = message('poruka');
      if (!form.elements.saglasnost.checked) errors.saglasnost = message('saglasnost');
      return errors;
    }

    function showErrors(errors) {
      ['ime', 'telefon', 'poruka', 'saglasnost'].forEach(function (name) { setError(name, errors[name]); });
    }

    function showAlert(text) {
      if (!alertBox) return;
      alertBox.textContent = text;
      alertBox.hidden = !text;
    }

    function setBusy(busy) {
      if (!submitBtn) return;
      if (busy) submitBtn.setAttribute('aria-busy', 'true'); else submitBtn.removeAttribute('aria-busy');
      submitBtn.disabled = busy;
      if (submitLabel) submitLabel.textContent = busy ? t('form.sending', 'Šaljemo…') : t('form.submit', 'Pošaljite zahtev');
    }

    // Brisanje greške čim korisnik ispravi polje
    ['ime', 'telefon', 'poruka', 'saglasnost'].forEach(function (name) {
      var field = form.elements[name];
      if (!field) return;
      field.addEventListener(field.type === 'checkbox' ? 'change' : 'input', function () {
        if (field.getAttribute('aria-invalid') === 'true') {
          var errs = validate();
          setError(name, errs[name]);
        }
      });
    });

    // Pri promeni jezika: postojeće greške na novom jeziku
    doc.addEventListener('langchange', function () {
      var shown = $$('[data-error-for]', form).filter(function (el) { return el.textContent; });
      if (shown.length) {
        var errs = validate();
        shown.forEach(function (el) { setError(el.getAttribute('data-error-for'), errs[el.getAttribute('data-error-for')]); });
      }
      if (alertBox && !alertBox.hidden) showAlert(t('form.err.back', 'Zahtev nije poslat. Proverite unete podatke i pokušajte ponovo.'));
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      showAlert('');
      var errors = validate();
      showErrors(errors);
      var firstInvalid = Object.keys(errors)[0];
      if (firstInvalid) {
        form.elements[firstInvalid].focus();
        return;
      }

      setBusy(true);
      fetch(form.getAttribute('action'), {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin'
      })
        .then(function (res) {
          return res.json().catch(function () { return { ok: false }; });
        })
        .then(function (data) {
          if (data && data.ok) {
            storageSet('sessionStorage', CONFIG.leadFlagKey, '1');
            window.location.href = data.redirect || '/hvala/';
            return;
          }
          if (data && data.errors) showErrors(data.errors);
          showAlert((data && data.message) || t('form.err.generic', 'Zahtev trenutno nije moguće poslati. Pozovite nas na ' + CONFIG.phoneDisplay + '.'));
          setBusy(false);
        })
        .catch(function () {
          showAlert(t('form.err.network', 'Proverite internet vezu i pokušajte ponovo, ili nas pozovite na ' + CONFIG.phoneDisplay + '.'));
          setBusy(false);
        });
    });

    // Povratak sa servera bez JS-a (?greska=...)
    var params = new URLSearchParams(window.location.search);
    if (params.get('greska')) {
      showAlert(t('form.err.back', 'Zahtev nije poslat. Proverite unete podatke i pokušajte ponovo.'));
    }
  }

  /* ---------- Kolačići i praćenje (samo uz saglasnost) ---------- */
  var hasTrackers = Boolean(CONFIG.metaPixelId || CONFIG.ga4Id);
  var trackersLoaded = false;

  function loadTrackers() {
    if (trackersLoaded || !hasTrackers) return;
    trackersLoaded = true;

    if (CONFIG.metaPixelId) {
      /* eslint-disable */
      !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s) }(window, doc, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      /* eslint-enable */
      window.fbq('init', CONFIG.metaPixelId);
      window.fbq('track', 'PageView');
    }

    if (CONFIG.ga4Id) {
      var s = doc.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(CONFIG.ga4Id);
      doc.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', CONFIG.ga4Id, { anonymize_ip: true });
    }

    // Lead se broji samo posle uspešno poslatog zahteva (stranica /hvala/), bez podataka iz forme
    if (doc.body.hasAttribute('data-thank-you') && storageGet('sessionStorage', CONFIG.leadFlagKey)) {
      if (window.fbq) window.fbq('track', 'Lead');
      if (window.gtag) window.gtag('event', 'generate_lead');
    }
  }

  function clearLeadFlag() {
    if (doc.body.hasAttribute('data-thank-you')) storageRemove('sessionStorage', CONFIG.leadFlagKey);
  }

  function bannerHtml() {
    return '<h2 id="cookie-naslov">' + t('cookie.title', 'Kolačići') + '</h2>' +
      '<p>' + t('cookie.text', 'Neophodni kolačići omogućavaju rad stranice. Analitičke i marketinške kolačiće (Meta Pixel, Google Analytics) koristimo samo uz vašu saglasnost. Oglasnim mrežama ne šaljemo podatke o zdravstvenom stanju niti sadržaj forme. <a href="/politika-privatnosti/#kolacici">Saznajte više</a>.') + '</p>' +
      '<div class="cookie__actions">' +
      '<button type="button" class="btn btn--primary" data-consent="all">' + t('cookie.all', 'Prihvatam sve') + '</button>' +
      '<button type="button" class="btn btn--outline" data-consent="necessary">' + t('cookie.necessary', 'Samo neophodni') + '</button>' +
      '</div>';
  }

  function buildBanner() {
    var box = doc.createElement('section');
    box.className = 'cookie';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-labelledby', 'cookie-naslov');
    box.innerHTML = bannerHtml();
    box.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-consent]');
      if (!btn) return;
      var choice = btn.getAttribute('data-consent');
      storageSet('localStorage', CONFIG.consentKey, choice);
      box.remove();
      if (choice === 'all') loadTrackers();
      else if (trackersLoaded) window.location.reload(); // povlačenje saglasnosti: osvežiti bez skripti
      clearLeadFlag();
    });
    doc.body.appendChild(box);
    var first = box.querySelector('button');
    if (first) first.focus({ preventScroll: true });
  }

  doc.addEventListener('langchange', function () {
    var box = $('.cookie');
    if (box) box.innerHTML = bannerHtml();
  });

  if (hasTrackers) {
    var consent = storageGet('localStorage', CONFIG.consentKey);
    if (consent === 'all') { loadTrackers(); clearLeadFlag(); }
    else if (consent === 'necessary') { clearLeadFlag(); }
    else buildBanner();

    $$('[data-cookie-settings]').forEach(function (btn) {
      btn.hidden = false;
      btn.addEventListener('click', function () {
        if (!$('.cookie')) buildBanner();
      });
    });
  } else {
    clearLeadFlag();
  }
})();
