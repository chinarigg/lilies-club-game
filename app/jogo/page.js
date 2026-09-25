'use client';

import { useEffect, useRef, useState } from 'react';

const MAX_ATTEMPTS = 2;
const REVEAL_INSETS = [38, 15, 0];

export default function JogoPage() {
  const [authed, setAuthed] = useState(null); // null = checking, false = show login, true = show game
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [authMsg, setAuthMsg] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [state, setState] = useState(null); // {streak,best,attemptsToday,finished,result,correctName,maxAttempts}
  const [guess, setGuess] = useState('');
  const [feedback, setFeedback] = useState({ text: '', cls: '' });
  const [prize, setPrize] = useState(false);
  const [spriteKey, setSpriteKey] = useState(0);
  const spriteRef = useRef(null);

  useEffect(() => {
    loadGameState();
  }, []);

  async function loadGameState() {
    const res = await fetch('/api/game');
    if (res.status === 401) {
      setAuthed(false);
      return;
    }
    const data = await res.json();
    setAuthed(true);
    setState(data);
    applyInset(data.finished ? 0 : data.attemptsToday, data.finished);

    if (data.finished && data.result === 'correct') {
      setFeedback({ text: 'você já acertou hoje! volta amanhã pra continuar a sequência.', cls: 'info' });
    } else if (data.finished && data.result === 'failed') {
      setFeedback({
        text: `hoje não rolou. era ${data.correctName || 'esse pokémon'}. volta amanhã pra tentar de novo.`,
        cls: 'bad'
      });
    }
  }

  function applyInset(attemptsUsed, revealed) {
    if (!spriteRef.current) return;
    if (revealed) {
      spriteRef.current.style.clipPath = 'inset(0%)';
      spriteRef.current.classList.add('revealed');
    } else {
      spriteRef.current.classList.remove('revealed');
      const inset = REVEAL_INSETS[Math.min(attemptsUsed, REVEAL_INSETS.length - 1)];
      spriteRef.current.style.clipPath = `inset(${inset}%)`;
    }
  }

  async function submitAuth(e) {
    e.preventDefault();
    setAuthMsg('');
    setAuthLoading(true);
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, pin })
    });
    const data = await res.json();
    setAuthLoading(false);
    if (!res.ok) {
      setAuthMsg(data.error || 'algo deu errado');
      return;
    }
    loadGameState();
  }

  async function submitGuess() {
    if (!guess.trim() || state?.finished) return;
    const res = await fetch('/api/game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guess })
    });
    const data = await res.json();
    setState(data);
    setGuess('');

    if (data.finished && data.result === 'correct') {
      applyInset(0, true);
      setFeedback({ text: `isso aí! é ${data.correctName}. volta amanhã pra manter a sequência.`, cls: 'ok' });
      if (data.wonPrize) setPrize(true);
    } else if (data.finished && data.result === 'failed') {
      applyInset(0, true);
      setFeedback({ text: `acabaram as chances! era ${data.correctName}. volta amanhã pra recomeçar.`, cls: 'bad' });
    } else if (data.wrong) {
      applyInset(data.attemptsToday, false);
      setFeedback({ text: 'não é esse não, tenta de novo!', cls: 'bad' });
    }
  }

  async function logout() {
    await fetch('/api/auth', { method: 'DELETE' });
    setAuthed(false);
    setState(null);
    setPrize(false);
  }

  const attemptsLeft = state ? MAX_ATTEMPTS - state.attemptsToday : MAX_ATTEMPTS;

  return (
    <>
      <header className="site">
        <img src="/logo.png" alt="Lilie's Club" />
        <a href="https://www.chinaritcg.com.br">← voltar pra loja</a>
        <a href="https://forms.chinaritcg.com.br">mural da comunidade</a>
      </header>

      <div className="wrap">
        <h1>quem é esse pokémon?</h1>
        <span className="underline"></span>
        <p className="lede">
          complete uma sequência de 15 dias e ganhe cartinhas sortidas ✨
          <br />
          pode ser carta comum, rara ou full art, dependendo da disponibilidade.
          <br />
          <br />
          ao completar os 15 dias, dá um alô na adm para que seja conferido tudo certinho, beleza?
          <br />
          suas cartinhas podem ficar armazenadas até você solicitar o envio. o frete fica por sua conta!
        </p>

        {authed === null && <p className="msg info">carregando…</p>}

        {authed === false && (
          <div className="card">
            <form onSubmit={submitAuth}>
              <div className="field">
                <label htmlFor="email">seu e-mail</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@email.com"
                />
              </div>
              <div className="field">
                <label htmlFor="pin">pin de 4 números</label>
                <input
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  pattern="\d{4}"
                  maxLength={4}
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="0000"
                />
              </div>
              <button className="primary" type="submit" disabled={authLoading}>
                {authLoading ? 'entrando…' : 'entrar / criar conta'}
              </button>
            </form>
            <p className="msg bad">{authMsg}</p>
            <p className="msg info">digite seu e-mail e crie um pin de 4 dígitos numéricos para salvar seu progresso na conta.</p>
          </div>
        )}

        {authed === true && state && (
          <>
            <div className="streak-row">
              <div className="streak-card">
                <div className="streak-num">{state.streak}</div>
                <div className="streak-label">sequência atual</div>
              </div>
              <div className="streak-card">
                <div className="streak-num">{state.best}</div>
                <div className="streak-label">recorde</div>
              </div>
            </div>

            <div className="card">
              <div className="sprite-box">
                <div
                  key={spriteKey}
                  ref={spriteRef}
                  className="sprite-img"
                  style={{ backgroundImage: `url("/api/game/sprite")` }}
                  onContextMenu={(e) => e.preventDefault()}
                  role="img"
                  aria-label="silhueta do pokémon do dia"
                />
              </div>

              {!state.finished && (
                <p className="attempts-label">
                  {attemptsLeft === MAX_ATTEMPTS
                    ? `você tem ${MAX_ATTEMPTS} chances hoje`
                    : attemptsLeft > 0
                    ? `só sobrou ${attemptsLeft} chance!`
                    : ''}
                </p>
              )}

              <div className="guess-row">
                <input
                  type="text"
                  placeholder="quem é esse pokémon?"
                  autoComplete="off"
                  disabled={state.finished}
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitGuess()}
                />
                <button disabled={state.finished} onClick={submitGuess}>
                  chutar
                </button>
              </div>

              <p className={`msg ${feedback.cls}`}>{feedback.text}</p>

              {prize && (
                <div className="prize-banner">
                  você completou os 15 dias! 🎉
                  <br />
                  <a
                    className="wa-btn"
                    href="https://wa.me/5511959606083?text=Oi!%20Bati%2015%20dias%20seguidos%20no%20Quem%20%C3%A9%20esse%20Pok%C3%A9mon%20do%20Lilie's%20Club%20e%20quero%20resgatar%20minhas%20cartinhas!"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    mande o print aqui
                  </a>
                </div>
              )}
            </div>

            <footer className="foot">
              seu progresso fica salvo na sua conta, pode jogar de qualquer aparelho.{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); logout(); }}>
                sair
              </a>
            </footer>
          </>
        )}
      </div>
    </>
  );
}
