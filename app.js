
const TAB_COUNT = 48;
const tabsEl = document.getElementById('tabs');
const quizEl = document.getElementById('quiz');
const scoreBox = document.getElementById('scoreBox');
const modelTitle = document.getElementById('modelTitle');
const submitBtn = document.getElementById('submitBtn');
const resetBtn = document.getElementById('resetBtn');
const teacherBtn = document.getElementById('teacherBtn');
const downloadBtn = document.getElementById('downloadBtn');

let currentIndex = 1;
let questions = [];
let teacherMode = false;

function tabTitle(i){ return `النموذج ${i}`; }

async function loadModel(i){
  scoreBox.innerHTML = '';
  quizEl.innerHTML = '<div class="card">جاري تحميل الأسئلة…</div>';
  modelTitle.textContent = `Grammar — قرامر · ${tabTitle(i)}`;
  try{
    const res = await fetch(`data/model${String(i).padStart(2,'0')}.json`);
    questions = await res.json();
  }catch(e){
    questions = [];
  }
  renderQuestions();
  setCountBadge(i, questions.length);
}

function renderTabs(){
  tabsEl.innerHTML = '';
  for(let i=1;i<=TAB_COUNT;i++){
    const btn = document.createElement('button');
    btn.className = 'tab'+(i===currentIndex?' active':'');
    btn.innerHTML = `${tabTitle(i)} <span class="count" id="count-${i}"></span>`;
    btn.addEventListener('click', ()=>{
      currentIndex = i;
      document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
      btn.classList.add('active');
      loadModel(i);
      window.scrollTo({top:0,behavior:'smooth'});
    });
    tabsEl.appendChild(btn);
  }
}
function setCountBadge(i, n){
  const el = document.getElementById(`count-${i}`);
  if(el) el.textContent = `(${n})`;
}

function renderQuestions(){
  quizEl.innerHTML = '';
  if(!questions.length){
    quizEl.innerHTML = `<div class="card"><div class="q-text">لا توجد أسئلة بعد في هذا التبويب.</div>
    <div class="meta">قد يكون هذا النموذج غير موجود في الملف الأصلي (أرفق حتى 42 نموذجًا). تستطيع/ين إضافة أسئلة لاحقًا.</div></div>`;
    return;
  }

  questions.forEach((item, idx)=>{
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.qindex = idx;

    const q = document.createElement('div');
    q.className = 'q-text';
    q.textContent = (idx+1)+'. '+item.q;
    card.appendChild(q);

    const ruleLine = document.createElement('div');
    ruleLine.className = 'rule';
    ruleLine.textContent = 'القاعدة: ' + (item.rule || '—');
    card.appendChild(ruleLine);

    const choices = document.createElement('div');
    choices.className = 'choices';
    (item.a||[]).forEach((text, i)=>{
      const row = document.createElement('label');
      row.className = 'choice';
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'q'+idx;
      radio.value = i;
      row.appendChild(radio);
      const span = document.createElement('span');
      span.textContent = text;
      row.appendChild(span);

      // teacher mode: double click to set correct
      row.addEventListener('dblclick', ()=>{
        if(!teacherMode) return;
        item.correct = i;
        [...choices.children].forEach(c=>c.classList.remove('correct'));
        row.classList.add('correct');
      });

      choices.appendChild(row);
    });
    card.appendChild(choices);

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = 'اختر إجابة واحدة';
    card.appendChild(meta);

    quizEl.appendChild(card);
  });
}

submitBtn.addEventListener('click', ()=>{
  if(!questions.length) return;
  document.querySelectorAll('.result').forEach(x=>x.remove());
  document.querySelectorAll('.choice').forEach(x=>x.classList.remove('correct','wrong','hinted'));

  let correctCount = 0;
  questions.forEach((item, idx)=>{
    const chosen = document.querySelector(`input[name="q${idx}"]:checked`);
    const card = document.querySelector(`.card[data-qindex="${idx}"]`);
    const res = document.createElement('div');
    const choiceEls = card.querySelectorAll('.choice');

    if(item.correct == null){
      res.className = 'result bad';
      res.innerHTML = `⚠️ لم يتم تعيين المفتاح لهذا السؤال بعد.`;
      card.appendChild(res);
      return;
    }

    if(chosen && Number(chosen.value) === item.correct){
      correctCount++;
      res.className = 'result ok';
      res.innerHTML = '✔️ إجابة صحيحة';
      choiceEls[Number(chosen.value)].classList.add('correct');
    }else{
      res.className = 'result bad';
      const correctText = item.a[item.correct];
      const explanation = item.explain || '';
      res.innerHTML = `❌ إجابة غير صحيحة<br>
        <div class="explain"><b>الصحيح:</b> ${correctText}${explanation?'<br>'+explanation:''}</div>`;
      if(chosen){ choiceEls[Number(chosen.value)].classList.add('wrong'); }
      if(item.correct!=null){ choiceEls[item.correct].classList.add('correct'); }
    }
    card.appendChild(res);
  });

  const score = Math.round(100 * correctCount / questions.length);
  scoreBox.innerHTML = `<div class="card">
    <div class="q-text">نتيجتك في ${tabTitle(currentIndex)}: ${correctCount} / ${questions.length} — ${score}%</div>
    <div class="meta">يمكن تعديل المفاتيح لاحقًا عبر "وضع المعلّم".</div>
  </div>`;
  window.scrollTo({top:0,behavior:'smooth'});
});

resetBtn.addEventListener('click', ()=>{
  document.querySelectorAll('input[type=radio]').forEach(r=> r.checked=false);
  document.querySelectorAll('.result').forEach(x=>x.remove());
  scoreBox.innerHTML='';
});

teacherBtn.addEventListener('click', ()=>{
  teacherMode = !teacherMode;
  teacherBtn.textContent = teacherMode ? 'إيقاف وضع المعلّم' : 'وضع المعلّم';
  if(teacherMode){
    alert('وضع المعلّم: انقر نقرتين سريعًا على الخيار الصحيح لتعيينه. ثم استخدم "تنزيل JSON" لحفظ الملف.');
  }
});

downloadBtn.addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify(questions, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `model${String(currentIndex).padStart(2,'0')}.json`;
  a.click();
});

renderTabs();
loadModel(currentIndex);
