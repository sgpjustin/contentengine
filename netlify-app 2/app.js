var COLORS = {
  dad:    {tag:"#7EC8A4", border:"rgba(126,200,164,0.3)", bg:"rgba(126,200,164,0.08)"},
  market: {tag:"#E8956D", border:"rgba(232,149,109,0.3)", bg:"rgba(232,149,109,0.08)"},
  team:   {tag:"#7BB3E0", border:"rgba(123,179,224,0.3)", bg:"rgba(123,179,224,0.08)"},
  money:  {tag:"#E1C340", border:"rgba(225,195,64,0.25)", bg:"rgba(225,195,64,0.15)"},
  hottake:{tag:"#FF6B6B", border:"rgba(255,107,107,0.35)", bg:"rgba(255,107,107,0.08)"},
  live:   {tag:"#A78BFA", border:"rgba(167,139,250,0.35)", bg:"rgba(167,139,250,0.08)"},
};

var liveTopics = [];
var activeFilter = "all";

function allTopics() { return liveTopics.concat(STATIC_TOPICS); }

function updateCounts() {
  var total = allTopics().length;
  document.getElementById("navCount").textContent = total;
  document.getElementById("heroTotal").textContent = total;
}

function render() {
  var all = allTopics();
  var list = activeFilter === "all" ? all : all.filter(function(t){ return t.pillar === activeFilter; });
  document.getElementById("cnt").textContent = list.length;
  updateCounts();

  var grid = document.getElementById("grid");
  if (!list.length) {
    grid.innerHTML = '<div class="empty">NO TOPICS YET — TYPE SOMETHING ABOVE AND HIT GENERATE</div>';
    return;
  }

  grid.innerHTML = list.map(function(t, i) {
    var c = COLORS[t.pillar] || COLORS.live;
    var newBadge = t.isNew ? '<span class="new-badge">NEW</span>' : '';
    var newCls = t.isNew ? ' is-new' : '';
    var delay = Math.min(i * 0.025, 0.5) + 's';
    var hookSafe = t.hook.replace(/</g,'&lt;').replace(/>/g,'&gt;');
    var subSafe = (t.hookSub||'').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    var truthSafe = (t.truth||'').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    var ctaSafe = (t.cta||'').replace(/</g,'&lt;').replace(/>/g,'&gt;');

    return (
      '<div class="card' + newCls + '" style="animation-delay:' + delay + '" onclick="toggleCard(this)">' +
        '<div class="card-top">' +
          '<div class="card-tags">' +
            '<span class="tag" style="color:' + c.tag + ';border:1px solid ' + c.border + ';background:' + c.bg + '">' + t.pillarLabel + '</span>' +
            newBadge +
          '</div>' +
          '<div class="hook">' + hookSafe + '</div>' +
          '<div class="hook-sub">' + subSafe + '</div>' +
        '</div>' +
        '<div class="card-foot">' +
          '<span class="card-num">#' + String(i+1).padStart(2,'0') + '</span>' +
          '<div class="expand-row">Full script <span class="arrow">&#8595;</span></div>' +
        '</div>' +
        '<div class="card-detail">' +
          '<div class="dlabel">The Truth — say this on camera</div>' +
          '<div class="dtext">' + truthSafe + '</div>' +
          '<div class="dlabel">Call to Action</div>' +
          '<div class="cta-box"><p>' + ctaSafe + '</p></div>' +
          '<div class="card-actions">' +
            '<button class="act-btn" onclick="copyScript(event,' +
              JSON.stringify(t.hook) + ',' +
              JSON.stringify(t.truth||'') + ',' +
              JSON.stringify(t.cta||'') +
            ')">&#128203; Copy Script</button>' +
            '<button class="act-btn" onclick="copyHook(event,' + JSON.stringify(t.hook) + ')">Copy Hook Only</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }).join('');
}

function toggleCard(el) {
  // Close others
  document.querySelectorAll('.card.open').forEach(function(c){ if(c !== el) c.classList.remove('open'); });
  el.classList.toggle('open');
}

function setFilter(f, btn) {
  activeFilter = f;
  document.querySelectorAll('.filter-btn').forEach(function(b){ b.classList.remove('active'); });
  btn.classList.add('active');
  render();
}

function setPrompt(text) {
  document.getElementById("genPrompt").value = text;
  document.getElementById("genPrompt").focus();
}

function showToast(msg) {
  var t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(function(){ t.classList.remove("show"); }, 2500);
}

function copyScript(e, hook, truth, cta) {
  e.stopPropagation();
  var text = '🎬 HOOK (text overlay):\n' + hook + '\n\n📹 TRUTH (say this on camera):\n' + truth + '\n\n📲 CTA:\n' + cta;
  navigator.clipboard.writeText(text).then(function(){
    showToast('✓ Full script copied');
  }).catch(function(){
    showToast('Select and copy manually');
  });
}

function copyHook(e, hook) {
  e.stopPropagation();
  navigator.clipboard.writeText(hook).then(function(){
    showToast('✓ Hook copied');
  });
}

function showSkeletons(count) {
  var grid = document.getElementById("grid");
  var s = '';
  for (var i = 0; i < count; i++) {
    s += '<div class="skel"><div class="skel-top"><div class="skel-line w40"></div><div class="skel-line w80 tall"></div><div class="skel-line w60"></div></div><div class="skel-foot"><div class="skel-line w40"></div></div></div>';
  }
  grid.innerHTML = s + grid.innerHTML;
}

async function generate() {
  var prompt = document.getElementById("genPrompt").value.trim();
  var pillar = document.getElementById("genPillar").value;
  var count = parseInt(document.getElementById("genCount").value);
  var btn = document.getElementById("genBtn");
  var statusEl = document.getElementById("genStatus");
  var statusMsg = document.getElementById("statusMsg");
  var spinner = document.getElementById("spinner");

  btn.disabled = true;
  statusEl.className = "gen-status show";
  spinner.style.display = "block";
  statusMsg.textContent = "Generating fresh topics...";

  var grid = document.getElementById("grid");
  var savedHTML = grid.innerHTML;
  showSkeletons(count);

  // Scroll to library
  document.getElementById("library").scrollIntoView({behavior:"smooth", block:"start"});

  var pillarMap = {
    any: "a natural mix of: dad (Dad of 4), market (Market Truth), team (Team Leader), money (Money Talk), hottake (Hot Take)",
    dad: 'ONLY "dad" — Dad of 4 content (parenting + real estate tension, family stakes, father mindset)',
    market: 'ONLY "market" — Market Truth (brutal market facts, buyer/seller realities, Montgomery & Bucks County PA)',
    hottake: 'ONLY "hottake" — Hot Takes (controversial industry opinions, NAR, commissions, agent behavior)',
    team: 'ONLY "team" — Team Leader (agent management, culture, recruiting, leadership)',
    money: 'ONLY "money" — Money Talk (income streams, agent finances, passive income, financial freedom)'
  };

  var today = new Date().toLocaleDateString("en-US", {month:"long", day:"numeric", year:"numeric"});
  var context = prompt
    ? 'The user typed this thought or topic: "' + prompt + '". Build ALL ' + count + ' topics specifically reacting to or expanding on this idea. Make them feel personal to Justin and directly tied to this topic.'
    : 'Today is ' + today + '. Generate topics that feel current for spring 2026 real estate — mortgage rates in the high 6s, tight suburban Philadelphia inventory, post-NAR-settlement commission shifts, sellers sitting on equity but afraid to move. Make each topic feel ripped from today.';

  var systemPrompt = 'You are a content strategist for Justin Heath — real estate team leader at Selling Greater Philly (Real Broker) in Montgomery and Bucks County, PA. Justin\'s brand: dad of 4, always in his car, straight-talking, edgy, authentic. His Instagram content is bold selfie-cam car videos with text overlay — raw, honest, slightly controversial. They make agents and sellers uncomfortable in a way that builds trust.\n\n' +
    context + '\n\n' +
    'Generate EXACTLY ' + count + ' content topics. Use ' + (pillarMap[pillar] || pillarMap.any) + '.\n\n' +
    'CRITICAL RULES:\n' +
    '1. Respond with ONLY a raw JSON array. Nothing before [. Nothing after ].\n' +
    '2. No markdown fences. No backticks. No explanation.\n' +
    '3. Every hook must be ALL CAPS and genuinely edgy/controversial.\n' +
    '4. Each topic must feel like something Justin would say in his car today.\n\n' +
    'Each object must have exactly these 6 fields:\n' +
    '{ "pillar": "dad|market|team|money|hottake", "pillarLabel": "Dad of 4|Market Truth|Team Leader|Money Talk|Hot Take", "hook": "ALL CAPS BOLD STATEMENT", "hookSub": "lowercase curiosity gap", "truth": "3-5 sentences raw and direct", "cta": "specific CTA with DM keyword" }';

  try {
    // Call our secure Netlify function — API key never touches the browser
    var res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: systemPrompt }]
      })
    });

    if (!res.ok) {
      var errText = await res.text();
      throw new Error("Server error " + res.status + ": " + errText.substring(0, 120));
    }

    var data = await res.json();
    if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));

    var raw = (data.content || [])
      .filter(function(b){ return b.type === "text"; })
      .map(function(b){ return b.text; })
      .join("");

    raw = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    var match = raw.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("No JSON array in response");

    var parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed) || !parsed.length) throw new Error("Empty array returned");

    var stamped = parsed.map(function(t){
      return Object.assign({}, t, {
        isNew: true,
        pillar: t.pillar || "live",
        pillarLabel: t.pillarLabel || "Generated"
      });
    });

    liveTopics = stamped.concat(liveTopics);

    // Switch to show all and re-render
    activeFilter = "all";
    document.querySelectorAll(".filter-btn").forEach(function(b){ b.classList.remove("active"); });
    document.querySelectorAll(".filter-btn")[0].classList.add("active");
    render();

    spinner.style.display = "none";
    statusEl.className = "gen-status show ok";
    statusMsg.textContent = "✓ " + stamped.length + " fresh topics added to your library";

    // Expire new badges after 5 mins
    setTimeout(function(){
      liveTopics = liveTopics.map(function(t){ return Object.assign({}, t, {isNew: false}); });
      render();
    }, 300000);

    setTimeout(function(){ statusEl.className = "gen-status"; }, 6000);

  } catch(err) {
    grid.innerHTML = savedHTML;
    spinner.style.display = "none";
    statusEl.className = "gen-status show err";
    statusMsg.textContent = "Error: " + err.message;
    setTimeout(function(){ statusEl.className = "gen-status"; }, 8000);
  }

  btn.disabled = false;
}

// Enter key in textarea
document.getElementById("genPrompt").addEventListener("keydown", function(e){
  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generate();
});

// Init
render();
