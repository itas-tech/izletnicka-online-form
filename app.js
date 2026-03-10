(function () {
  const form = document.getElementById("voucherForm");
  const submitBtn = document.getElementById("submitBtn");
  const feedback = document.getElementById("feedback");
  const resultCard = document.getElementById("resultCard");
  const resultOrder = document.getElementById("resultOrder");
  const resultPayment = document.getElementById("resultPayment");
  const resultLink = document.getElementById("resultLink");
  const voucherDateInput = document.getElementById("voucherDate");
  const brojOsobaInput = document.getElementById("brojOsoba");
  const guestCountrySelect = document.getElementById("guestCountry");
  const guestCountInput = document.getElementById("guestCount");
  const addGuestBtn = document.getElementById("addGuestBtn");
  const guestsList = document.getElementById("guestsList");
  const guestBuilderHint = document.getElementById("guestBuilderHint");

  const cfg = window.IZLETNICKA_CONFIG || {};
  const apiBase = resolveApiBase(cfg);
  let guestsByCountry = [];
  let countriesReady = false;

  setDefaultDate();
  initializeGuestBuilder();
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
      setFeedback("API URL nije konfigurisan. Kontaktirajte podršku.", true);
      return;
    }

    const endpoint = `${apiBase.replace(/\/$/, "")}/api/v2/ITPayments/public/checkout`;

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
          : `Greška (${response.status})`;
        setFeedback(err, true);
        return;
      }

      if (!data || !data.redirectUrl) {
        setFeedback("API nije vratio redirect URL.", true);
        return;
      }

      resultOrder.textContent = data.merchantOrderId || "-";
      resultPayment.textContent = data.paymentId != null ? String(data.paymentId) : "-";
      resultLink.href = data.redirectUrl;
      resultCard.hidden = false;

      setFeedback("Za nastavak otvorite stranicu za plaćanje.", false, true);

      form.reset();
      setDefaultDate();
      resetGuestBuilder();
    } catch (error) {
      setFeedback("Nije moguće kontaktirati API. Provjerite CORS i dostupnost API-ja.", true);
    } finally {
      setLoading(false);
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
      setFeedback("API URL nije konfigurisan. Kontaktirajte podršku.", true);
      disableGuestBuilder(true);
      return;
    }

    const endpoint = `${apiBase.replace(/\/$/, "")}/api/v2/ITPayments/public/countries`;

    try {
      const response = await fetch(endpoint, {
        method: "GET"
      });

      if (!response.ok) {
        setFeedback("Nije moguće učitati listu država. Pokušajte ponovo.", true);
        disableGuestBuilder(true);
        return;
      }

      const data = await response.json().catch(() => []);
      const countries = Array.isArray(data) ? data : [];
      fillCountries(countries);
      countriesReady = countries.length > 0;

      if (!countriesReady) {
        setFeedback("Lista država je prazna. Kontaktirajte podršku.", true);
        disableGuestBuilder(true);
      } else {
        disableGuestBuilder(false);
      }
    } catch (error) {
      setFeedback("Nije moguće učitati listu država. Provjerite API i CORS.", true);
      disableGuestBuilder(true);
    }
  }

  function fillCountries(items) {
    guestCountrySelect.innerHTML = "";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Izaberite državu";
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
      setFeedback("Lista država nije dostupna.", true);
      return;
    }

    const countryId = Number(guestCountrySelect.value);
    const guestsCount = Number(guestCountInput.value);

    if (!Number.isInteger(countryId) || countryId <= 0) {
      setFeedback("Izaberite državu.", true);
      return;
    }

    if (!Number.isInteger(guestsCount) || guestsCount <= 0) {
      setFeedback("Broj osoba mora biti cijeli broj veći od 0.", true);
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

    guestsByCountry.sort((a, b) => a.naziv.localeCompare(b.naziv, "sr-Latn-ME"));
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
      empty.innerHTML = '<p class="guests-item-text">Nijeste dodali goste po državi.</p>';
      guestsList.appendChild(empty);
      guestBuilderHint.textContent = "Dodajte jednu ili više država sa brojem osoba.";
      brojOsobaInput.value = "0";
      return;
    }

    for (const row of guestsByCountry) {
      const item = document.createElement("li");
      item.className = "guests-item";
      item.innerHTML = `
        <p class="guests-item-text">${escapeHtml(row.naziv)}: <strong>${row.brojOsoba}</strong></p>
        <button type="button" class="guests-remove" data-country-id="${row.drzavaID}">Ukloni</button>
      `;
      guestsList.appendChild(item);
    }

    const totalGuests = guestsByCountry.reduce((sum, row) => sum + row.brojOsoba, 0);
    guestBuilderHint.textContent = `Ukupno unijeto osoba: ${totalGuests}`;
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

  function setDefaultDate() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    voucherDateInput.value = `${yyyy}-${mm}-${dd}`;
  }

  function buildPayload() {
    const agencyName = form.agencyName.value.trim();
    const guideEmail = form.guideEmail.value.trim();
    const totalGuests = guestsByCountry.reduce((sum, row) => sum + row.brojOsoba, 0);

    if (!agencyName) {
      setFeedback("Naziv agencije je obavezan.", true);
      return null;
    }

    if (!guideEmail) {
      setFeedback("Email je obavezan.", true);
      return null;
    }

    if (guestsByCountry.length === 0 || totalGuests <= 0) {
      setFeedback("Unesite barem jednu državu sa brojem osoba.", true);
      return null;
    }

    if (totalGuests > 10000) {
      setFeedback("Ukupan broj osoba ne može biti veći od 10000.", true);
      return null;
    }

    const voucherDateValue = form.voucherDate.value;

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
      voucherDate: voucherDateValue ? `${voucherDateValue}T00:00:00` : null,
      locale: "me"
    };
  }

  function nullIfEmpty(value) {
    const v = (value || "").trim();
    return v.length > 0 ? v : null;
  }

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    addGuestBtn.disabled = isLoading || !countriesReady;
    submitBtn.textContent = isLoading
      ? "Kreiranje plaćanja..."
      : "Nastavi na kartično plaćanje";
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
