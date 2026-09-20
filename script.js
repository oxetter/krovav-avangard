document.addEventListener("DOMContentLoaded", () => {

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
});
