(function () {
  const form = document.getElementById("voucherForm");
  const submitBtn = document.getElementById("submitBtn");
  const feedback = document.getElementById("feedback");
  const resultCard = document.getElementById("resultCard");
  const resultOrder = document.getElementById("resultOrder");
  const resultPayment = document.getElementById("resultPayment");
  const resultLink = document.getElementById("resultLink");
  const voucherDateInput = document.getElementById("voucherDate");

  const cfg = window.IZLETNICKA_CONFIG || {};
  const apiBase = resolveApiBase(cfg);

  setDefaultDate();

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
    const brojOsobaRaw = form.brojOsoba.value;
    const brojOsoba = Number(brojOsobaRaw);

    if (!agencyName) {
      setFeedback("Naziv agencije je obavezan.", true);
      return null;
    }

    if (!guideEmail) {
      setFeedback("Email je obavezan.", true);
      return null;
    }

    if (!Number.isInteger(brojOsoba) || brojOsoba <= 0) {
      setFeedback("Broj osoba mora biti cijeli broj veći od 0.", true);
      return null;
    }

    const voucherDateValue = form.voucherDate.value;

    return {
      agencyName,
      guideName: nullIfEmpty(form.guideName.value),
      guideEmail,
      guidePhone: nullIfEmpty(form.guidePhone.value),
      reference: nullIfEmpty(form.reference.value),
      note: nullIfEmpty(form.note.value),
      brojOsoba,
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
