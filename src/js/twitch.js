// Twitch chat integration: anonymous read-only connection to a channel's chat (no login, no tokens).
// Viewers type commands that affect the world: spawn themselves as NPC heroes, gift items, heal, vote for hordes/wars, change weather.
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});
  const KEY = 'dyvo_twitch';
  let ws = null, chan = null, retry = 0, wantOn = false;
  const cooldown = new Map(); // user → last time
  try { const s = JSON.parse(localStorage.getItem(KEY) || '{}'); chan = s.channel || 'mi_miracle'; wantOn = !!s.on; } catch (e) { chan = 'mi_miracle'; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ channel: chan, on: wantOn })); } catch (e) { /* ignore */ } };
  const WEATHER_WORDS = { дощ: 'rain', сніг: 'snow', буря: 'storm', туман: 'fog', ясно: 'clear', спека: 'heat', сонце: 'clear' };

  function toast(t, k) { if (ISK.ui && ISK.ui.toast) ISK.ui.toast(t, k || '', 4000); }
  function handle(user, msg) {
    const G = ISK.ui && ISK.ui.G; if (!G) return;
    const m = msg.trim().toLowerCase(); if (!m.startsWith('!')) return;
    const now = Date.now(); if (now - (cooldown.get(user) || 0) < 20000) return; cooldown.set(user, now);
    const [cmd, ...args] = m.split(/\s+/);
    const L = ISK.life;
    switch (cmd) {
      case '!герой': case '!hero': { const e = L.viewerHero(G, user); toast(e || `📡 ${user} переродився в Дивосвіті як НПС-герой!`, e ? '' : 'epic'); break; }
      case '!подарунок': case '!gift': L.viewerGift(G, user); break;
      case '!лікуй': case '!heal': L.viewerHeal(G, user); break;
      case '!орда': case '!horde': L.viewerHorde(G, user); break;
      case '!війна': case '!war': L.viewerWar(G, user); break;
      case '!погода': case '!weather': L.viewerWeather(G, user, WEATHER_WORDS[args[0]] || args[0]); break;
      case '!жарт': case '!joke': { const j = ISK.data.JOKES[Math.floor(Math.random() * ISK.data.JOKES.length)]; toast(`😄 ${user}: ${j}`); ISK.voice.say('Богиня Люмі', j, 'f'); break; }
      case '!допомога': case '!help': toast('📡 Команди: !герой !подарунок !лікуй !орда !війна !погода !жарт'); break;
      default: return;
    }
    if (ISK.ui && ISK.ui.showNews) ISK.ui.showNews([]);
  }
  function connect(channel) {
    if (channel) chan = channel.replace(/^#/, '').toLowerCase();
    wantOn = true; save(); disconnect(true);
    try { ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443'); } catch (e) { toast('📡 Не вдалося підключитися до Twitch', 'bad'); return; }
    ws.onopen = () => { ws.send('CAP REQ :twitch.tv/tags'); ws.send('PASS SCHMOOPIIE'); ws.send('NICK justinfan' + Math.floor(10000 + Math.random() * 80000)); ws.send('JOIN #' + chan); retry = 0; toast(`📡 Підключено до чату twitch.tv/${chan}. Глядачі, пишіть !допомога`, 'good'); };
    ws.onmessage = (ev) => {
      for (const line of String(ev.data).split('\r\n')) {
        if (!line) continue;
        if (line.startsWith('PING')) { ws.send('PONG :tmi.twitch.tv'); continue; }
        const mm = /(?:@(\S+) )?:(\w+)!\S+ PRIVMSG #\S+ :(.*)$/.exec(line);
        if (mm) { const tags = mm[1] || ''; const dn = /display-name=([^;]*)/.exec(tags); handle((dn && dn[1]) || mm[2], mm[3]); }
      }
    };
    ws.onclose = () => { ws = null; if (wantOn && retry < 6) { retry++; setTimeout(() => connect(), 3000 * retry); } };
    ws.onerror = () => { /* onclose handles retry */ };
  }
  function disconnect(keep) { if (!keep) { wantOn = false; save(); } if (ws) { const w = ws; ws = null; try { w.onclose = null; w.close(); } catch (e) { /* ignore */ } } }
  ISK.twitch = { connect, disconnect, connected: () => !!(ws && ws.readyState === 1), channel: () => chan, handle, autoStart: () => { if (wantOn) connect(); } };
})();
