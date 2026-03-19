(function () {
  const form = document.getElementById("voucherForm");
  const submitBtn = document.getElementById("submitBtn");
  const feedback = document.getElementById("feedback");
  const resultCard = document.getElementById("resultCard");
  const resultOrder = document.getElementById("resultOrder");
  const resultPayment = document.getElementById("resultPayment");
  const resultLink = document.getElementById("resultLink");
  const langSelect = document.getElementById("langSelect");
  const brojOsobaInput = document.getElementById("brojOsoba");
  const guestCountrySelect = document.getElementById("guestCountry");
  const guestCountInput = document.getElementById("guestCount");
  const addGuestBtn = document.getElementById("addGuestBtn");
  const guestsList = document.getElementById("guestsList");
  const guestBuilderHint = document.getElementById("guestBuilderHint");

  const STORAGE_LANG_KEY = "izletnicka_lang";
  const TRANSLATIONS = {
    me: {
      pageTitle: "TO Kotor | Online plaćanje izletničke takse",
      languageLabel: "Jezik",
      heroKicker: "Turistička organizacija opštine Kotor",
      heroTitle: "Online plaćanje izletničke takse",
      heroSubtitle: "Unesite podatke i nastavite na sigurnu kartičnu naplatu.",
      panelTitle: "Podaci za uplatu",
      panelSubtitle: "Popunite tražene podatke i nastavite na sigurnu kartičnu naplatu.",
      labelAgencyName: "Naziv agencije",
      placeholderAgencyName: "Unesite naziv agencije",
      labelGuideName: "Ime vodiča",
      placeholderGuideName: "Unesite ime vodiča",
      labelGuestsByCountry: "Gosti po državi",
      countryPlaceholder: "Izaberite državu",
      placeholderGuestCount: "Broj",
      addGuestBtn: "Dodaj",
      guestBuilderHintDefault: "Dodajte jednu ili više država sa brojem osoba.",
      guestBuilderHintTotal: "Ukupno unijeto osoba: {count}",
      guestListEmpty: "Nijeste dodali goste po državi.",
      guestRemove: "Ukloni",
      labelGuideEmail: "Email za potvrdu",
      placeholderGuideEmail: "Unesite email adresu",
      labelReference: "Referenca",
      placeholderReference: "Interna šifra (opciono)",
      labelNote: "Napomena",
      placeholderNote: "Napomena za internu evidenciju (opciono)",
      labelTotalGuests: "Ukupno osoba",
      submitButton: "Nastavi na kartično plaćanje",
      submitButtonLoading: "Kreiranje plaćanja...",
      resultMerchantOrder: "Merchant order:",
      resultPaymentId: "Payment ID:",
      resultOpenPaymentLink: "Otvori stranicu za plaćanje",
      errorApiUrlMissing: "API URL nije konfigurisan. Kontaktirajte podršku.",
      errorCannotLoadCountries: "Nije moguće učitati listu država. Pokušajte ponovo.",
      errorCountryListEmpty: "Lista država je prazna. Kontaktirajte podršku.",
      errorCountryListUnavailable: "Lista država nije dostupna.",
      errorSelectCountry: "Izaberite državu.",
      errorGuestCountPositive: "Broj osoba mora biti cijeli broj veći od 0.",
      errorAgencyRequired: "Naziv agencije je obavezan.",
      errorEmailRequired: "Email je obavezan.",
      errorGuestsRequired: "Unesite barem jednu državu sa brojem osoba.",
      errorGuestMax: "Ukupan broj osoba ne može biti veći od 10000.",
      errorApiRedirectMissing: "API nije vratio redirect URL.",
      errorWithStatus: "Greška ({status})",
      errorApiUnreachable: "Nije moguće kontaktirati API. Provjerite CORS i dostupnost API-ja.",
      successOpenPaymentPage: "Za nastavak otvorite stranicu za plaćanje.",
      redirectingToPayment: "Preusmjeravanje na stranicu za plaćanje..."
    },
    en: {
      pageTitle: "TO Kotor | Online excursion tax payment",
      languageLabel: "Language",
      heroKicker: "Tourist organization of municipality Kotor",
      heroTitle: "Online excursion tax payment",
      heroSubtitle: "Enter payment details and continue to secure card checkout.",
      panelTitle: "Payment details",
      panelSubtitle: "Fill in the required details and continue to secure card checkout.",
      labelAgencyName: "Agency name",
      placeholderAgencyName: "Enter agency name",
      labelGuideName: "Guide name",
      placeholderGuideName: "Enter guide name",
      labelGuestsByCountry: "Guests by country",
      countryPlaceholder: "Select country",
      placeholderGuestCount: "Count",
      addGuestBtn: "Add",
      guestBuilderHintDefault: "Add one or more countries with guest counts.",
      guestBuilderHintTotal: "Total guests entered: {count}",
      guestListEmpty: "No guests by country added yet.",
      guestRemove: "Remove",
      labelGuideEmail: "Confirmation email",
      placeholderGuideEmail: "Enter email address",
      labelReference: "Reference",
      placeholderReference: "Internal code (optional)",
      labelNote: "Note",
      placeholderNote: "Internal note (optional)",
      labelTotalGuests: "Total guests",
      submitButton: "Continue to card payment",
      submitButtonLoading: "Creating payment...",
      resultMerchantOrder: "Merchant order:",
      resultPaymentId: "Payment ID:",
      resultOpenPaymentLink: "Open payment page",
      errorApiUrlMissing: "API URL is not configured. Contact support.",
      errorCannotLoadCountries: "Unable to load countries list. Please try again.",
      errorCountryListEmpty: "Countries list is empty. Contact support.",
      errorCountryListUnavailable: "Countries list is unavailable.",
      errorSelectCountry: "Select a country.",
      errorGuestCountPositive: "Guest count must be a whole number greater than 0.",
      errorAgencyRequired: "Agency name is required.",
      errorEmailRequired: "Email is required.",
      errorGuestsRequired: "Add at least one country with guest count.",
      errorGuestMax: "Total guest count cannot exceed 10000.",
      errorApiRedirectMissing: "API did not return a redirect URL.",
      errorWithStatus: "Error ({status})",
      errorApiUnreachable: "Unable to reach API. Check CORS and API availability.",
      successOpenPaymentPage: "Open the payment page to continue.",
      redirectingToPayment: "Redirecting to payment page..."
    }
  };

  const cfg = window.IZLETNICKA_CONFIG || {};
  const apiBase = resolveApiBase(cfg);
  let guestsByCountry = [];
  let countriesReady = false;
  let currentLang = "me";
  let isLoading = false;

  initializeGuestBuilder();
  if (langSelect) {
    langSelect.addEventListener("change", () => {
      setLanguage(langSelect.value);
    });
  }
  setLanguage(resolveInitialLanguage());
  loadCountries();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFeedback();
    resultCard.hidden = true;

    const payload = buildPayload();
    if (!payload) {
      return;
    }

    if (!apiBase) {
      setFeedback(tr("errorApiUrlMissing"), true);
      return;
    }

    const endpoint = `${apiBase.replace(/\/$/, "")}/api/v2/ITPayments/public/checkout`;

    let isRedirecting = false;

    try {
      setLoading(true);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const err = data && typeof data.message === "string"
          ? data.message
          : tr("errorWithStatus", { status: response.status });
        setFeedback(err, true);
        return;
      }

      if (!data || !data.redirectUrl) {
        setFeedback(tr("errorApiRedirectMissing"), true);
        return;
      }

      isRedirecting = true;
      setFeedback(tr("redirectingToPayment"), false, true);
      window.location.assign(data.redirectUrl);
    } catch (error) {
      setFeedback(tr("errorApiUnreachable"), true);
    } finally {
      if (!isRedirecting) {
        setLoading(false);
      }
    }
  });

  function resolveApiBase(config) {
    const host = (window.location.hostname || "").toLowerCase();
    const isLocalHost = host === "localhost" || host === "127.0.0.1";

    if (isLocalHost && typeof config.localApiBaseUrl === "string" && config.localApiBaseUrl.trim()) {
      return config.localApiBaseUrl.trim();
    }

    if (typeof config.apiBaseUrl === "string" && config.apiBaseUrl.trim()) {
      return config.apiBaseUrl.trim();
    }
    return "";
  }

  function resolveInitialLanguage() {
    const queryLang = new URLSearchParams(window.location.search).get("lang");
    if (queryLang === "en" || queryLang === "me") {
      return queryLang;
    }

    try {
      const stored = window.localStorage.getItem(STORAGE_LANG_KEY);
      if (stored === "en" || stored === "me") {
        return stored;
      }
    } catch (error) {
      // Ignore storage errors and continue with fallback.
    }

    const browserLang = (navigator.language || "").toLowerCase();
    return browserLang.startsWith("en") ? "en" : "me";
  }

  function setLanguage(language) {
    currentLang = language === "en" ? "en" : "me";

    if (langSelect) {
      langSelect.value = currentLang;
      langSelect.setAttribute("aria-label", tr("languageLabel"));
    }

    try {
      window.localStorage.setItem(STORAGE_LANG_KEY, currentLang);
    } catch (error) {
      // Ignore storage errors to keep form usable.
    }

    applyTranslations();
  }

  function applyTranslations() {
    document.documentElement.lang = currentLang === "en" ? "en" : "me";
    document.title = tr("pageTitle");

    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const key = element.getAttribute("data-i18n");
      if (!key) {
        return;
      }

      element.textContent = tr(key);
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
      const key = element.getAttribute("data-i18n-placeholder");
      if (!key) {
        return;
      }

      element.setAttribute("placeholder", tr(key));
    });

    const firstCountryOption = guestCountrySelect?.querySelector("option[value='']");
    if (firstCountryOption) {
      firstCountryOption.textContent = tr("countryPlaceholder");
    }

    renderGuestRows();
    updateSubmitButtonText();
  }

  function tr(key, params = {}) {
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.me;
    let text = dict[key] || TRANSLATIONS.me[key] || key;

    Object.entries(params).forEach(([name, value]) => {
      text = text.replaceAll(`{${name}}`, String(value));
    });

    return text;
  }

  function initializeGuestBuilder() {
    addGuestBtn.addEventListener("click", () => {
      addGuestRow();
    });

    guestCountInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        addGuestRow();
      }
    });

    guestsList.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLButtonElement)) {
        return;
      }

      const countryIdRaw = target.getAttribute("data-country-id");
      const countryId = Number(countryIdRaw);
      if (!Number.isInteger(countryId) || countryId <= 0) {
        return;
      }

      guestsByCountry = guestsByCountry.filter((row) => row.drzavaID !== countryId);
      renderGuestRows();
    });

    renderGuestRows();
  }

  async function loadCountries() {
    if (!apiBase) {
      setFeedback(tr("errorApiUrlMissing"), true);
      disableGuestBuilder(true);
      return;
    }

    const endpoint = `${apiBase.replace(/\/$/, "")}/api/v2/ITPayments/public/countries`;

    try {
      const response = await fetch(endpoint, {
        method: "GET"
      });

      if (!response.ok) {
        setFeedback(tr("errorCannotLoadCountries"), true);
        disableGuestBuilder(true);
        return;
      }

      const data = await response.json().catch(() => []);
      const countries = Array.isArray(data) ? data : [];
      fillCountries(countries);
      countriesReady = countries.length > 0;

      if (!countriesReady) {
        setFeedback(tr("errorCountryListEmpty"), true);
        disableGuestBuilder(true);
      } else {
        disableGuestBuilder(false);
      }
    } catch (error) {
      setFeedback(tr("errorCannotLoadCountries"), true);
      disableGuestBuilder(true);
    }
  }

  function fillCountries(items) {
    guestCountrySelect.innerHTML = "";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = tr("countryPlaceholder");
    guestCountrySelect.appendChild(placeholder);

    for (const item of items) {
      const drzavaID = Number(item.drzavaID ?? item.drzavaId ?? item.DrzavaID ?? item.DrzavaId);
      const naziv = String(item.naziv ?? item.Naziv ?? "").trim();
      const skracenica = String(item.skracenica ?? item.Skracenica ?? "").trim();

      if (!Number.isInteger(drzavaID) || drzavaID <= 0 || !naziv) {
        continue;
      }

      const option = document.createElement("option");
      option.value = String(drzavaID);
      option.textContent = skracenica ? `${naziv} (${skracenica})` : naziv;
      option.setAttribute("data-country-name", naziv);
      guestCountrySelect.appendChild(option);
    }
  }

  function disableGuestBuilder(disabled) {
    guestCountrySelect.disabled = disabled;
    guestCountInput.disabled = disabled;
    addGuestBtn.disabled = disabled;
    submitBtn.disabled = disabled;
  }

  function addGuestRow() {
    if (!countriesReady) {
      setFeedback(tr("errorCountryListUnavailable"), true);
      return;
    }

    const countryId = Number(guestCountrySelect.value);
    const guestsCount = Number(guestCountInput.value);

    if (!Number.isInteger(countryId) || countryId <= 0) {
      setFeedback(tr("errorSelectCountry"), true);
      return;
    }

    if (!Number.isInteger(guestsCount) || guestsCount <= 0) {
      setFeedback(tr("errorGuestCountPositive"), true);
      return;
    }

    const selectedOption = guestCountrySelect.options[guestCountrySelect.selectedIndex];
    const countryName = (selectedOption?.getAttribute("data-country-name") || selectedOption?.textContent || "").trim();

    const existing = guestsByCountry.find((row) => row.drzavaID === countryId);
    if (existing) {
      existing.brojOsoba += guestsCount;
    } else {
      guestsByCountry.push({
        drzavaID: countryId,
        naziv: countryName,
        brojOsoba: guestsCount
      });
    }

    const sortLocale = currentLang === "en" ? "en-US" : "sr-Latn-ME";
    guestsByCountry.sort((a, b) => a.naziv.localeCompare(b.naziv, sortLocale));
    guestCountInput.value = "";
    guestCountrySelect.value = "";
    clearFeedback();
    renderGuestRows();
  }

  function renderGuestRows() {
    guestsList.innerHTML = "";

    if (guestsByCountry.length === 0) {
      const empty = document.createElement("li");
      empty.className = "guests-item";
      empty.innerHTML = `<p class="guests-item-text">${escapeHtml(tr("guestListEmpty"))}</p>`;
      guestsList.appendChild(empty);
      guestBuilderHint.textContent = tr("guestBuilderHintDefault");
      brojOsobaInput.value = "0";
      return;
    }

    for (const row of guestsByCountry) {
      const item = document.createElement("li");
      item.className = "guests-item";
      item.innerHTML = `
        <p class="guests-item-text">${escapeHtml(row.naziv)}: <strong>${row.brojOsoba}</strong></p>
        <button type="button" class="guests-remove" data-country-id="${row.drzavaID}">${escapeHtml(tr("guestRemove"))}</button>
      `;
      guestsList.appendChild(item);
    }

    const totalGuests = guestsByCountry.reduce((sum, row) => sum + row.brojOsoba, 0);
    guestBuilderHint.textContent = tr("guestBuilderHintTotal", { count: totalGuests });
    brojOsobaInput.value = String(totalGuests);
  }

  function resetGuestBuilder() {
    guestsByCountry = [];
    if (guestCountrySelect.options.length > 0) {
      guestCountrySelect.value = "";
    }
    guestCountInput.value = "";
    renderGuestRows();
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function buildPayload() {
    const agencyName = form.agencyName.value.trim();
    const guideEmail = form.guideEmail.value.trim();
    const totalGuests = guestsByCountry.reduce((sum, row) => sum + row.brojOsoba, 0);

    if (!agencyName) {
      setFeedback(tr("errorAgencyRequired"), true);
      return null;
    }

    if (!guideEmail) {
      setFeedback(tr("errorEmailRequired"), true);
      return null;
    }

    if (guestsByCountry.length === 0 || totalGuests <= 0) {
      setFeedback(tr("errorGuestsRequired"), true);
      return null;
    }

    if (totalGuests > 10000) {
      setFeedback(tr("errorGuestMax"), true);
      return null;
    }

    return {
      agencyName,
      guideName: nullIfEmpty(form.guideName.value),
      guideEmail,
      reference: nullIfEmpty(form.reference.value),
      note: nullIfEmpty(form.note.value),
      brojOsoba: totalGuests,
      guestsByCountry: guestsByCountry.map((row) => ({
        drzavaID: row.drzavaID,
        brojOsoba: row.brojOsoba
      })),
      locale: currentLang
    };
  }

  function nullIfEmpty(value) {
    const v = (value || "").trim();
    return v.length > 0 ? v : null;
  }

  function setLoading(isNowLoading) {
    isLoading = Boolean(isNowLoading);
    submitBtn.disabled = isLoading;
    addGuestBtn.disabled = isLoading || !countriesReady;
    updateSubmitButtonText();
  }

  function updateSubmitButtonText() {
    submitBtn.textContent = isLoading ? tr("submitButtonLoading") : tr("submitButton");
  }

  function clearFeedback() {
    feedback.textContent = "";
    feedback.classList.remove("error", "success");
  }

  function setFeedback(text, isError, isSuccess) {
    feedback.textContent = text;
    feedback.classList.toggle("error", !!isError);
    feedback.classList.toggle("success", !!isSuccess);
  }
})();
