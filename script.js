document.addEventListener("DOMContentLoaded", () => {

  // ====== ТАБЫ ======
  const buttons = document.querySelectorAll(".tab-btn");
  const contents = document.querySelectorAll(".tab-content");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;
      buttons.forEach((b) => b.classList.remove("active"));
      contents.forEach((c) => c.classList.remove("active"));
      btn.classList.add("active");
      const targetEl = document.getElementById(target);
      if (targetEl) targetEl.classList.add("active");
      history.replaceState(null, "", "#" + target);
    });
  });

  const hash = window.location.hash.replace("#", "");
  if (hash) {
    const btn = document.querySelector('.tab-btn[data-tab="' + hash + '"]');
    if (btn) btn.click();
  }

  // ====== ПРОВЕРКА (ТЕСТ) ======
  const form = document.getElementById("checkForm");
  const resultBox = document.getElementById("quizResult");
  const STORAGE_KEY = "krovav_check_lock";
  const LOCK_HOURS = 24;

  const ANSWERS = {
    q1: "c",
    q2: "a",
    q3: "d",
    q4: "b",
    q5: "a",
    q6: "c",
    q7: "c"
  };

  function normalize(str) {
    return (str || "")
      .toString()
      .toLowerCase()
      .replace(/ё/g, "е")
      .replace(/[^a-zа-я0-9]/g, "");
  }

  function checkTask(fio, area) {
    const f = normalize(fio);
    const a = normalize(area);
    const fioOk = f.includes("ковалев") && f.includes("матвей") && f.includes("алексеевич");
    const areaOk = a.includes("тверск");
    return fioOk && areaOk;
  }

  function getLock() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data.until) return null;
      if (Date.now() > data.until) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return data;
    } catch (e) {
      return null;
    }
  }

  function setLock() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        until: Date.now() + LOCK_HOURS * 3600 * 1000,
        ts: Date.now()
      }));
    } catch (e) {}
  }

  function hoursLeft(until) {
    return Math.ceil((until - Date.now()) / 3600 / 1000);
  }

  if (form) {
    const lock = getLock();
    if (lock) {
      const h = hoursLeft(lock.until);
      form.querySelectorAll("input, button").forEach((el) => el.disabled = true);
      resultBox.className = "quiz-result error";
      resultBox.innerHTML = "⏳ Вы уже проходили тест. Попробуйте снова через " + h + " ч.";
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      if (getLock()) {
        const lock2 = getLock();
        const h2 = hoursLeft(lock2.until);
        resultBox.className = "quiz-result error";
        resultBox.innerHTML = "⏳ Попробуйте снова через " + h2 + " ч.";
        return;
      }

      let score = 0;
      Object.keys(ANSWERS).forEach((q) => {
        const selected = form.querySelector('input[name="' + q + '"]:checked');
        if (selected && selected.value === ANSWERS[q]) score++;
      });

      const fio = form.querySelector('input[name="taskFio"]').value;
      const area = form.querySelector('input[name="taskArea"]').value;
      if (checkTask(fio, area)) score += 3;

      setLock();
      form.querySelectorAll("input, button").forEach((el) => el.disabled = true);

      if (score >= 8) {
        const tgText = encodeURIComponent(
          "Привет! Я прошёл тест OSINT на сайте Krovav Avangard.\nРезультат: " + score + "/10"
        );
        resultBox.className = "quiz-result success";
        resultBox.innerHTML =
          "🎉 <strong>Поздравляю, вы нам подходите!</strong><br><br>" +
          "Результат: <strong>" + score + "/10</strong><br><br>" +
          "Отпишите в личные сообщения: <strong>@dusususu</strong><br>" +
          '<a class="tg-btn" href="https://t.me/dusususu?text=' + tgText + '" target="_blank" rel="noopener">Отправить результат в Telegram</a>';
      } else {
        resultBox.className = "quiz-result error";
        resultBox.innerHTML =
          "😓 Увы, вы нам не подходите.<br>Попробуйте снова через 24 часа.<br><br>" +
          "Результат: <strong>" + score + "/10</strong>";
      }
    });
  }

  // ====== TARGET ======
  (function() {
    const steps = document.querySelectorAll(".target-step");
    if (!steps.length) return;

    const prevBtn = document.getElementById("targetPrev");
    const nextBtn = document.getElementById("targetNext");
    const counter = document.getElementById("targetCounter");

    let current = 0;

    function showStep(i) {
      steps.forEach((s, idx) => {
        s.classList.toggle("active", idx === i);
      });
      counter.textContent = (i + 1) + " / " + steps.length;

      prevBtn.disabled = i === 0;

      if (i === steps.length - 1) {
        nextBtn.textContent = "Готово ✓";
        nextBtn.classList.add("done");
        nextBtn.disabled = true;
      } else {
        nextBtn.textContent = "Далее ▶";
        nextBtn.classList.remove("done");
        nextBtn.disabled = false;
      }
    }

    nextBtn.addEventListener("click", () => {
      if (current < steps.length - 1) {
        current++;
        showStep(current);
      }
    });

    prevBtn.addEventListener("click", () => {
      if (current > 0) {
        current--;
        showStep(current);
      }
    });

    showStep(0);
  })();

  // ====== ЗАГРУЗКА ТЕКСТОВ ИЗ SUPABASE ======
  const SB_URL = "https://bnkxugykixafzxrctgbs.supabase.co/rest/v1/";
  const SB_KEY = "sb_publishable_uF5oRwmW1WUa4cc2Mv-Gfw_7chz4_EB";

  async function loadSiteContent() {
    try {
      const res = await fetch(SB_URL + "/rest/v1/site_content?select=key,value", {
        headers: {
          "apikey": SB_KEY,
          "Authorization": "Bearer " + SB_KEY
        }
      });
      const data = await res.json();
      const map = {};
      data.forEach(row => map[row.key] = row.value);

      function setTitle(sel, val) {
        if (!val) return;
        const el = document.querySelector(sel);
        if (el) el.textContent = val;
      }

      function setCard(sel, val) {
        if (!val) return;
        const el = document.querySelector(sel);
        if (el) el.innerHTML = val.split("\n").map(p => "<p>" + p + "</p>").join("");
      }

      setTitle("#info h2", map.info_title);
      setCard("#info .card", map.info_content);
      setTitle("#members h2", map.members_title);
      setCard("#members .card", map.members_content);
      setTitle("#ads h2", map.ads_title);
      setCard("#ads .card", map.ads_content);

      ["target_step_1", "target_step_2", "target_step_3"].forEach((key, idx) => {
        if (map[key]) {
          const el = document.querySelector('.target-step[data-step="' + (idx + 1) + '"] .target-text');
          if (el) el.textContent = map[key];
        }
      });

    } catch (e) {
      console.error("Ошибка загрузки контента:", e);
    }
  }

  loadSiteContent();

});
