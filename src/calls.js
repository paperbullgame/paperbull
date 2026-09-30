/* =====================================================================
   VOICE CALLS — 1-on-1 calls between friends (both 14+), peer to peer
   with WebRTC. The server only passes the handshake along
   (pb_call_* RPCs); the audio goes straight between the two players
   and is never recorded. Start a call from a private chat.
   ===================================================================== */
(() => {
  const tok = () => window.PBCloud && PBCloud.C && PBCloud.C.s && PBCloud.C.s.token;
  const linked = () => !!(tok() && typeof acct !== 'undefined' && acct && acct.user && acct.user === PBCloud.C.s.u);
  const on = () => !(window.PBSite && PBSite.features && PBSite.features.calls === false);
  const rpc = (fn, a) => PBCloud.rpc(fn, Object.assign({ p_token: tok() }, a || {}));
  const E = s => esc(s == null ? '' : String(s));
  const ICE = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }, { urls: 'stun:stun.cloudflare.com:3478' }];
  const ERR = {
    feature_off: 'Calls are turned off right now.',
    age_needed: 'Add your birth year first (Settings → Data & about).',
    kid_blocked: 'Calls are for players 14 and up.',
    cant_call: 'You can’t call this player.',
    not_friends: 'You can only call friends.',
    dm_closed: 'They only take calls from friends. Send a friend request.',
    in_call: 'You’re already in a call.',
    busy: 'They’re on another call. Try again soon.',
    slow_down: 'Too many calls. Wait a few minutes.',
    muted: 'You’re muted right now.',
    call_over: 'That call already ended.',
    not_found: 'That player isn’t available.',
  };
  const say = e => ERR[e && e.message] || (e && e.message) || 'Call failed';

  let C = null; // the current call: {id, caller, with, status, pc, stream, after, t0, muted, ...}
  let pollT = 0,
    tickT = 0,
    ring = null;

  /* ---------- sounds: ringtone (incoming) and ringback (outgoing), made with WebAudio ---------- */
  function tone(kind) {
    stopTone();
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      const g = ac.createGain();
      g.gain.value = 0;
      g.connect(ac.destination);
      const o1 = ac.createOscillator(),
        o2 = ac.createOscillator();
      o1.frequency.value = kind === 'in' ? 880 : 440;
      o2.frequency.value = kind === 'in' ? 1320 : 480;
      o1.connect(g);
      o2.connect(g);
      o1.start();
      o2.start();
      const beat = () => {
        const t = ac.currentTime,
          v = kind === 'in' ? 0.07 : 0.035;
        g.gain.cancelScheduledValues(t);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(v, t + 0.03);
        g.gain.setValueAtTime(v, t + (kind === 'in' ? 0.35 : 1.2));
        g.gain.linearRampToValueAtTime(0, t + (kind === 'in' ? 0.4 : 1.25));
        if (kind === 'in') {
          g.gain.linearRampToValueAtTime(v, t + 0.55);
          g.gain.setValueAtTime(v, t + 0.9);
          g.gain.linearRampToValueAtTime(0, t + 0.95);
        }
      };
      beat();
      const iv = setInterval(beat, kind === 'in' ? 2200 : 3000);
      ring = { ac, iv };
    } catch (e) {}
    if (kind === 'in' && navigator.vibrate) navigator.vibrate([300, 200, 300]);
  }
  function stopTone() {
    if (!ring) return;
    clearInterval(ring.iv);
    try {
      ring.ac.close();
    } catch (e) {}
    ring = null;
  }

  /* ---------- UI ---------- */
  const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const I = {
    phone: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z"/></svg>',
    mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
    micOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M15 10V6a3 3 0 0 0-5.7-1.3M9 9v2a3 3 0 0 0 5 2.2M5 11a7 7 0 0 0 11.5 5.4M19 11a7 7 0 0 1-.6 2.8M12 18v3M3 3l18 18"/></svg>',
  };
  function ui() {
    let el = document.getElementById('pbCall');
    if (!C) return el && el.remove();
    if (!el) {
      el = document.createElement('div');
      el.id = 'pbCall';
      document.body.appendChild(el);
      el.addEventListener('click', onClick);
    }
    const w = C.with || {},
      face = typeof avatarArt === 'function' ? avatarArt(w.avatar || 'av_bull') : '';
    const big = C.status === 'ringing' || (C.status === 'active' && !C.connected && !C.min);
    el.className = big ? 'pc-big' : 'pc-bar';
    if (big) {
      const incoming = C.status === 'ringing' && !C.caller;
      el.innerHTML = `<div class="pc-card" role="dialog" aria-label="Voice call"><div class="pc-av${C.status === 'ringing' ? ' ringing' : ''}"><i></i><i></i><span>${face}</span></div>
        <b class="pc-n">${E(w.name || w.username)}</b><small class="pc-s">${incoming ? 'Incoming voice call' : C.status === 'ringing' ? 'Calling…' : 'Connecting…'}</small>
        <div class="pc-btns">${incoming ? `<button class="pc-b red" data-pc="decline" aria-label="Decline">${I.phone}</button><button class="pc-b green" data-pc="accept" aria-label="Accept">${I.phone}</button>` : `<button class="pc-b red" data-pc="end" aria-label="${C.status === 'ringing' ? 'Cancel' : 'Hang up'}">${I.phone}</button>`}</div>
        ${incoming ? '<small class="pc-note">Only accept calls from people you know.</small>' : ''}</div>`;
    } else {
      el.innerHTML = `<div class="pc-pill" role="status"><span class="pc-mini">${face}</span><span class="pc-t"><b>${E(w.name || w.username)}</b><small data-pct>${C.connected ? mmss((Date.now() - C.t0) / 1000) : 'Connecting…'}</small></span>
        <button class="pc-b sm${C.muted ? ' on' : ''}" data-pc="mute" aria-label="${C.muted ? 'Unmute' : 'Mute'}">${C.muted ? I.micOff : I.mic}</button><button class="pc-b sm red" data-pc="end" aria-label="Hang up">${I.phone}</button></div>`;
    }
  }
  function onClick(e) {
    const b = e.target.closest('[data-pc]');
    if (!b) return;
    const a = b.dataset.pc;
    if (a === 'accept') accept();
    else if (a === 'decline' || a === 'end') hangup(true);
    else if (a === 'mute' && C && C.stream) {
      C.muted = !C.muted;
      C.stream.getAudioTracks().forEach(t => (t.enabled = !C.muted));
      ui();
    }
  }

  /* ---------- WebRTC ---------- */
  async function mic() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('This browser can’t do calls.');
    try {
      return await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false });
    } catch (e) {
      throw new Error('Allow the microphone to make calls.');
    }
  }
  function peer() {
    const pc = new RTCPeerConnection({ iceServers: ICE });
    C.stream.getTracks().forEach(t => pc.addTrack(t, C.stream));
    pc.onicecandidate = e => e.candidate && send('ice', e.candidate.toJSON());
    pc.ontrack = e => {
      let a = document.getElementById('pbCallAudio');
      if (!a) {
        a = document.createElement('audio');
        a.id = 'pbCallAudio';
        a.autoplay = true;
        a.setAttribute('playsinline', '');
        document.body.appendChild(a);
      }
      a.srcObject = e.streams[0];
      a.play().catch(() => {});
    };
    pc.onconnectionstatechange = () => {
      if (!C || C.pc !== pc) return;
      const s = pc.connectionState;
      if (s === 'connected' && !C.connected) {
        C.connected = true;
        C.t0 = Date.now();
        stopTone();
        SFX.play('coin');
        ui();
      } else if (s === 'failed') {
        toast('Couldn’t connect the call. One of your networks may block calls.', 'err');
        hangup(true);
      }
    };
    return pc;
  }
  const send = (kind, data) => C && rpc('pb_call_signal', { p_call: C.id, p_kind: kind, p_data: data }).catch(() => {});
  async function onSignals(list) {
    if (!C.pc) return; // not answered yet: leave the messages on the server until we are
    for (const s of list) {
      C.after = Math.max(C.after, s.id);
      try {
        if (s.kind === 'offer' && !C.caller && C.pc && !C.pc.currentRemoteDescription) {
          await C.pc.setRemoteDescription(s.data);
          const ans = await C.pc.createAnswer();
          await C.pc.setLocalDescription(ans);
          send('answer', { type: ans.type, sdp: ans.sdp });
          for (const c of C.pendIce.splice(0)) await C.pc.addIceCandidate(c).catch(() => {});
        } else if (s.kind === 'answer' && C.caller && C.pc && !C.pc.currentRemoteDescription) {
          await C.pc.setRemoteDescription(s.data);
          for (const c of C.pendIce.splice(0)) await C.pc.addIceCandidate(c).catch(() => {});
        } else if (s.kind === 'ice') {
          if (C.pc && C.pc.remoteDescription) await C.pc.addIceCandidate(s.data).catch(() => {});
          else C.pendIce.push(s.data);
        }
      } catch (e) {
        console.warn('call signal', e);
      }
    }
  }

  /* ---------- the call loop: status + handshake messages ---------- */
  async function poll() {
    clearTimeout(pollT);
    if (!C) return;
    const id = C.id;
    try {
      const r = await rpc('pb_call_poll', { p_call: id, p_after: C.after });
      if (!C || C.id !== id) return;
      if (r.status !== C.status) {
        const was = C.status;
        C.status = r.status;
        if (r.status === 'active' && was === 'ringing' && C.caller) {
          stopTone();
          ui();
        }
        if (['ended', 'declined', 'missed', 'busy'].includes(r.status)) return finish(r.status);
      }
      if (r.signals && r.signals.length) await onSignals(r.signals);
    } catch (e) {
      if (e && e.message === 'not_found') return finish('ended');
    }
    if (C && C.id === id) pollT = setTimeout(poll, C.connected ? 2500 : 900);
  }
  function finish(status, quiet) {
    if (!C) return;
    const w = C.with || {},
      dur = C.connected ? mmss((Date.now() - C.t0) / 1000) : '';
    try {
      C.pc && C.pc.close();
    } catch (e) {}
    try {
      C.stream && C.stream.getTracks().forEach(t => t.stop());
    } catch (e) {}
    document.getElementById('pbCallAudio')?.remove();
    stopTone();
    clearTimeout(pollT);
    clearInterval(tickT);
    C = null;
    ui();
    if (!quiet) {
      const who = '@' + (w.username || 'friend');
      const msg = { declined: `${who} declined the call.`, missed: `${who} didn’t pick up.`, busy: `${who} is on another call.` }[status] || (dur ? `Call ended · ${dur}` : 'Call ended');
      toast(msg, status === 'ended' ? 'info' : 'err');
    }
  }
  function startLoop() {
    poll();
    clearInterval(tickT);
    tickT = setInterval(() => {
      const t = document.querySelector('#pbCall [data-pct]');
      if (t && C && C.connected) t.textContent = mmss((Date.now() - C.t0) / 1000);
    }, 1000);
  }

  /* ---------- actions ---------- */
  async function start(username) {
    if (!linked()) return toast('Sign up to make calls.', 'err');
    if (C) return toast(ERR.in_call, 'err');
    let stream;
    try {
      stream = await mic();
    } catch (e) {
      return toast(e.message, 'err');
    }
    let r;
    try {
      r = await rpc('pb_call_start', { p_username: username });
    } catch (e) {
      stream.getTracks().forEach(t => t.stop());
      return toast(say(e), 'err');
    }
    C = { id: r.id, caller: true, with: r.with, status: r.status, stream, after: 0, pendIce: [], muted: false };
    C.pc = peer();
    const off = await C.pc.createOffer();
    await C.pc.setLocalDescription(off);
    send('offer', { type: off.type, sdp: off.sdp });
    tone('out');
    ui();
    startLoop();
  }
  async function accept() {
    if (!C || C.caller || C.status !== 'ringing') return;
    stopTone();
    try {
      C.stream = await mic();
    } catch (e) {
      toast(e.message, 'err');
      return hangup(true);
    }
    try {
      const r = await rpc('pb_call_answer', { p_call: C.id, p_accept: true });
      C.status = r.status;
    } catch (e) {
      toast(say(e), 'err');
      return finish('ended', true);
    }
    C.pc = peer();
    ui();
    poll();
  }
  async function hangup(tell) {
    if (!C) return;
    const id = C.id,
      incoming = !C.caller && C.status === 'ringing';
    finish(incoming ? 'declined' : 'ended', true);
    if (tell) rpc(incoming ? 'pb_call_answer' : 'pb_call_end', incoming ? { p_call: id, p_accept: false } : { p_call: id }).catch(() => {});
  }
  // someone is calling me?
  let checking = false;
  async function checkIncoming() {
    if (!linked() || !on() || checking || C) return;
    checking = true;
    try {
      const l = await rpc('pb_call_incoming');
      const c = Array.isArray(l) && l[0];
      if (c && !C) {
        C = { id: c.id, caller: false, with: c.with, status: 'ringing', after: 0, pendIce: [], muted: false };
        tone('in');
        ui();
        startLoop();
        try {
          window.PBNotify && PBNotify.push({ kind: 'msg', title: `@${c.with && c.with.username} is calling you`, body: 'Voice call' });
        } catch (e) {}
      }
    } catch (e) {}
    checking = false;
  }

  if (window.PBLive && PBLive.on)
    PBLive.on('call', p => {
      const mine = PBLive.myTag && PBLive.myTag();
      if (p && p.u && mine && p.u !== mine) return;
      if (C) poll();
      else checkIncoming();
    });
  setTimeout(checkIncoming, 5000);
  setInterval(() => {
    if (document.visibilityState !== 'visible' || C) return;
    const up = window.PBLive && PBLive.state && PBLive.state() === 'on';
    if (!up || Math.random() < 0.25) checkIncoming();
  }, 12000);
  addEventListener('pagehide', () => C && hangup(true));
  window.PBCalls = { start, hangup, state: () => C, check: checkIncoming };
})();
