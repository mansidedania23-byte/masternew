const SECRET_BIRTHDAY = '05/11/2002';
const STORAGE_KEY = 'shivam_birthday_site';
const ENTRY_ANIMATION = {
  buildMs: 180,
  warpMs: 620,
  transitionMs: 100,
  flashMs: 850,
  musicFile: '', // Optional royalty-free file path, for example: audio/cosmic-ambient.mp3
  chimeFile: '' // Optional royalty-free file path, for example: audio/magic-chime.mp3
};
const state = {
  giftChoice: null,
  giftNote: '',
  lastUnlock: '',
  wheelResults: [],
  wheelSpinsLeft: 3,
  wheelRewardPending: false,
  fortuneText: '',
  fortuneOpened: false,
  questionChoice: null,
  rotation: 0,
  nextWheelIndex: 0
};

const rewards = [
  { title: 'Birthday Boy Privileges 👑', desc: 'For one day, you make the rules, pick the plans, and get VIP treatment. No arguments, your highness.' },
  { title: 'Your Wishlist, My Mission 🎁', desc: 'Name one little thing you’ve been wanting, and I’ll try to make it happen.' },
  { title: 'One Day, One Adventure 🎡', desc: 'You pick an experience we’ve never tried together, and we turn it into a new memory.' },
  { title: 'A Little Healing, From Me 🤍', desc: 'A little something from me to help you slow down, recharge, and give yourself the care you deserve.' },
  { title: 'The Teasing Pass 😏', desc: 'One free pass to tease me about something. Use it wisely; revenge is always a possibility.' },
  { title: 'The Honest Answer 🎤', desc: 'Ask me one question, and I’ll answer honestly within our comfort levels.' },
  { title: 'Instant Mood Booster 🍫', desc: 'A little pick-me-up from me, delivered when you need a bad day to become slightly less bad.' },
  { title: 'The Getaway Pass ✈️', desc: 'Pick a place you’ve been wanting to visit, and let me take care of planning and funding the getaway. Your destination, your adventure — this one’s on me.' }
];

const fortunes = [
  'Today’s forecast: 100% chance of being spoiled.',
  'Someone thinks you’re more special than you realise.',
  'Your next favourite memory might be closer than you think.',
  'Your next adventure may begin with a simple yes.',
  'A little patience. A little courage. A lot of good things ahead.',
  'The best things in life don’t always arrive wrapped in a box.',
  'One star, one wish, and a whole year of possibilities.',
  'Someone out there is quietly wishing you the happiest year yet.',
  'Your birthday luck says you’re allowed to be a little dramatic today. 😌',
  'Your stars suggest more laughter, more adventures, and at least one plan we shouldn’t cancel.',
  'The stars predict someone is going to annoy you lovingly. No refunds. 😌',
  'A little more time together could make an ordinary life unforgettable.',
  'Breaking news: Birthday boy is officially too handsome to be this dramatic.',
  'Your stars are aligned. Your sleep schedule, however, is questionable.',
  'You may act like you need nobody, but even superheroes need a sidekick.',
  'Your next favourite memory might start with one word: “YES.”',
  'The universe has confirmed: Sober Shivam is cute, but nashe wala Shivam is a whole entertainment package. 🍻😂',
  'Fortune predicts a successful businessman who can solve every problem except the mystery of why he never switches off. 💻',
  'Breaking news: Local genius discovers that taking a break does not cause professional failure. More updates pending. 😂',
  'You may act like a logical man, but the universe knows there’s a softie hiding somewhere behind all that attitude. 🤍',
  'You’re everyone’s problem when drunk and someone’s favourite problem when drunk. Guess who? 🤭❤️'
];

const screens = document.querySelectorAll('.screen');
const wheelShell = document.getElementById('wheelShell');
const spinCounter = document.getElementById('spinCounter');
const rewardCard = document.getElementById('rewardCard');
const rewardTitle = document.getElementById('rewardTitle');
const rewardDesc = document.getElementById('rewardDesc');
const choiceMessage = document.getElementById('choiceMessage');
const fortuneNote = document.getElementById('fortuneNote');
const fortuneCookie = document.getElementById('fortuneCookie');
const nextStarBtn = document.getElementById('nextStarBtn');
const wheelFinalLine = document.getElementById('wheelFinalLine');
const fortuneBtn = document.getElementById('fortuneBtn');

let unlockInProgress = false;
let screenTransitionInProgress = false;
let wheelIsSpinning = false;
let questionDecisionInProgress = false;
const audio = {
  ctx: null,
  masterGain: null,
  musicGain: null,
  musicOscillators: [],
  musicElement: document.getElementById('cosmicMusic'),
  chimeElement: document.getElementById('entryChime'),
  musicFadeTimer: 0,
  init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.7;
    this.masterGain.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0;
    this.musicGain.connect(this.masterGain);
  },
  startMusic() {
    this.init();
    if (this.ctx) this.ctx.resume();
    if (ENTRY_ANIMATION.musicFile) {
      this.musicElement.src = ENTRY_ANIMATION.musicFile;
      this.musicElement.volume = 0.02;
      this.musicElement.play().catch(error => {
        console.warn('Cosmic music file could not be played; using the soft synth instead.', error);
        this.musicElement.pause();
        this.musicElement.removeAttribute('src');
        this.startSynthMusic();
      });
    } else {
      this.startSynthMusic();
    }
  },
  startSynthMusic() {
    if (!this.ctx || !this.musicGain || this.musicOscillators.length) return;
    const now = this.ctx.currentTime;
    [146.83, 174.61, 220].forEach((frequency, index) => {
      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();
      osc.type = index === 2 ? 'sine' : 'triangle';
      osc.frequency.value = frequency;
      noteGain.gain.value = index === 2 ? 0.025 : 0.018;
      osc.connect(noteGain).connect(this.musicGain);
      osc.start(now);
      this.musicOscillators.push(osc);
    });
    this.rampMusic(0.55, 1800);
  },
  rampMusic(level, durationMs) {
    if (this.musicElement.src) {
      window.clearInterval(this.musicFadeTimer);
      const start = this.musicElement.volume;
      const startTime = performance.now();
      this.musicFadeTimer = window.setInterval(() => {
        const progress = Math.min((performance.now() - startTime) / durationMs, 1);
        this.musicElement.volume = start + (level - start) * progress;
        if (progress >= 1) window.clearInterval(this.musicFadeTimer);
      }, 40);
      return;
    }
    if (!this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;
    this.musicGain.gain.cancelScheduledValues(now);
    this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
    this.musicGain.gain.linearRampToValueAtTime(level, now + durationMs / 1000);
  },
  softenMusic() {
    this.rampMusic(0.22, 700);
  },
  playChime() {
    this.init();
    if (this.ctx) this.ctx.resume();
    if (ENTRY_ANIMATION.chimeFile) {
      this.chimeElement.src = ENTRY_ANIMATION.chimeFile;
      this.chimeElement.currentTime = 0;
      this.chimeElement.volume = 0.38;
      this.chimeElement.play().catch(error => {
        console.warn('Chime file could not be played; using the soft synth instead.', error);
        this.playSynthChime();
      });
      return;
    }
    this.playSynthChime();
  },
  playSelectionSound() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    this.ctx.resume();
    const now = this.ctx.currentTime;
    [880, 1174.66].forEach((frequency, index) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = now + index * 0.055;
      osc.type = 'sine';
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.035, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);
      osc.connect(gain).connect(this.masterGain);
      osc.start(start);
      osc.stop(start + 0.3);
    });
  },
  playSynthChime() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    [659.25, 987.77, 1318.51].forEach((frequency, index) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = now + index * 0.075;
      osc.type = 'sine';
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.065 / (index + 1), start + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.1);
      osc.connect(gain).connect(this.masterGain);
      osc.start(start);
      osc.stop(start + 1.15);
    });
  }
};

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.shivamBirthdayState = state;
}

function hydrateState() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return;
  try {
    const parsed = JSON.parse(data);
    Object.assign(state, parsed);
  } catch (error) {
    console.warn('Could not parse saved state', error);
  }
  window.shivamBirthdayState = state;
}

function showScreen(id) {
  screens.forEach(screen => {
    screen.classList.toggle('active', screen.id === id);
    screen.classList.remove('exiting');
    screen.classList.remove('transition-arriving', 'transition-leaving');
    screen.style.opacity = '';
    screen.style.transform = '';
    screen.style.filter = '';
    screen.style.clipPath = '';
    screen.style.zIndex = '';
  });
  const transitionStar = document.getElementById('screenTransitionStar');
  transitionStar.classList.remove('active');
  transitionStar.style.left = '';
  transitionStar.style.top = '';
  transitionStar.style.transform = '';
  document.getElementById('birthdayVideo').pause();
  const canvas = document.getElementById('starsCanvas');
  canvas.style.visibility = 'visible';
  canvas.style.zIndex = '1';
  document.getElementById('unlock-screen').classList.remove('building', 'warping');
}

function transitionToScreen(id, sourceButton = document.activeElement, onComplete) {
  if (screenTransitionInProgress) return;
  const currentScreen = document.querySelector('.screen.active');
  const nextScreen = document.getElementById(id);
  if (!nextScreen || currentScreen === nextScreen) return;
  screenTransitionInProgress = true;
  const transitionStar = document.getElementById('screenTransitionStar');
  const origin = getTransitionOrigin(sourceButton, currentScreen);
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const destination = { x: viewportWidth + 64, y: origin.y - viewportHeight * 0.34 };
  const vector = { x: destination.x - origin.x, y: destination.y - origin.y };
  const vectorLength = Math.hypot(vector.x, vector.y) || 1;
  vector.x /= vectorLength;
  vector.y /= vectorLength;
  const transitionMs = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 480 : 860;
  let finished = false;
  let animationFrame = 0;

  currentScreen.classList.add('transition-leaving');
  nextScreen.classList.add('active', 'transition-arriving');
  currentScreen.style.zIndex = '2';
  nextScreen.style.zIndex = '1';
  nextScreen.style.opacity = '1';
  nextScreen.style.clipPath = 'inset(0 100% 0 0)';
  currentScreen.style.clipPath = getStarRevealClip(origin.x, origin.y, -vector.x, -vector.y, viewportWidth, viewportHeight);
  transitionStar.style.left = `${origin.x}px`;
  transitionStar.style.top = `${origin.y}px`;
  transitionStar.style.transform = 'translate(-50%, -50%) rotate(-19deg)';
  transitionStar.classList.remove('active');
  void transitionStar.offsetWidth;
  transitionStar.classList.add('active');

  const startTime = performance.now();
  const finishTransition = () => {
    if (finished) return;
    finished = true;
    window.cancelAnimationFrame(animationFrame);
    transitionStar.removeEventListener('animationend', finishTransition);
    transitionStar.classList.remove('active');
    currentScreen.classList.remove('active', 'transition-leaving');
    nextScreen.classList.remove('transition-arriving');
    currentScreen.style.opacity = '';
    currentScreen.style.transform = '';
    currentScreen.style.filter = '';
    currentScreen.style.clipPath = '';
    currentScreen.style.zIndex = '';
    nextScreen.style.opacity = '';
    nextScreen.style.transform = '';
    nextScreen.style.filter = '';
    nextScreen.style.clipPath = '';
    nextScreen.style.zIndex = '';
    transitionStar.style.left = '';
    transitionStar.style.top = '';
    transitionStar.style.transform = '';
    document.getElementById('birthdayVideo').pause();
    document.getElementById('starsCanvas').style.visibility = 'visible';
    document.getElementById('starsCanvas').style.zIndex = '1';
    document.getElementById('unlock-screen').classList.remove('building', 'warping');
    screenTransitionInProgress = false;
    if (typeof onComplete === 'function') onComplete();
  };

  const animateTransition = (now) => {
    const progress = Math.min((now - startTime) / transitionMs, 1);
    const eased = progress * progress * (3 - 2 * progress);
    const headX = origin.x + (destination.x - origin.x) * eased;
    const headY = origin.y + (destination.y - origin.y) * eased;
    transitionStar.style.transform = `translate(-50%, -50%) translate(${headX - origin.x}px, ${headY - origin.y}px) rotate(-19deg) scale(${0.9 + eased * 0.45})`;
    currentScreen.style.opacity = String(1 - eased * 0.12);
    currentScreen.style.filter = `brightness(${1 - eased * 0.08})`;
    currentScreen.style.clipPath = getStarRevealClip(headX, headY, -vector.x, -vector.y, viewportWidth, viewportHeight);
    nextScreen.style.clipPath = getStarRevealClip(headX, headY, vector.x, vector.y, viewportWidth, viewportHeight);

    if (progress >= 1) {
      nextScreen.style.clipPath = 'none';
      finishTransition();
      return;
    }
    animationFrame = window.requestAnimationFrame(animateTransition);
  };

  animationFrame = window.requestAnimationFrame(animateTransition);
}

function getStarRevealClip(headX, headY, directionX, directionY, width, height) {
  const corners = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height }
  ];
  const signedDistance = (point) => (point.x - headX) * directionX + (point.y - headY) * directionY;
  const clipped = [];

  corners.forEach((start, index) => {
    const end = corners[(index + 1) % corners.length];
    const startDistance = signedDistance(start);
    const endDistance = signedDistance(end);
    const startInside = startDistance <= 0;
    const endInside = endDistance <= 0;

    if (startInside && endInside) {
      clipped.push(end);
    } else if (startInside && !endInside) {
      const ratio = startDistance / (startDistance - endDistance);
      clipped.push({
        x: start.x + (end.x - start.x) * ratio,
        y: start.y + (end.y - start.y) * ratio
      });
    } else if (!startInside && endInside) {
      const ratio = startDistance / (startDistance - endDistance);
      clipped.push({
        x: start.x + (end.x - start.x) * ratio,
        y: start.y + (end.y - start.y) * ratio
      }, end);
    }
  });

  if (clipped.length < 3) return 'inset(0 100% 0 0)';
  const points = clipped.map(point => `${(point.x / width) * 100}% ${(point.y / height) * 100}%`);
  return `polygon(${points.join(', ')})`;
}

function getTransitionOrigin(source, currentScreen) {
  if (source && Number.isFinite(source.x) && Number.isFinite(source.y)) return source;
  const bounds = source && source.isConnected && source.getBoundingClientRect
    ? source.getBoundingClientRect()
    : currentScreen.getBoundingClientRect();
  return {
    x: bounds.left + bounds.width / 2,
    y: bounds.top + bounds.height / 2
  };
}

function validateBirthday(raw) {
  const value = (raw || '').trim();
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return false;
  const [day, month, year] = value.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function unlockFlow() {
  if (unlockInProgress) return;
  const unlockScreen = document.getElementById('unlock-screen');
  const input = document.getElementById('birthdayInput');
  const value = input.value.trim();
  const error = document.getElementById('unlockError');
  if (!validateBirthday(value) || value !== SECRET_BIRTHDAY) {
    error.textContent = 'That date doesn’t match. Please check and try again.';
    error.classList.add('visible');
    input.classList.add('invalid');
    input.setAttribute('aria-invalid', 'true');
    input.focus();
    return;
  }

  unlockInProgress = true;
  document.getElementById('unlockBtn').disabled = true;
  error.textContent = '';
  error.classList.remove('visible');
  input.classList.remove('invalid');
  input.removeAttribute('aria-invalid');
  state.lastUnlock = value;
  persistState();
  audio.startMusic();
  unlockScreen.classList.add('building');
  window.setTimeout(() => {
    unlockScreen.classList.remove('building');
    unlockScreen.classList.add('warping', 'exiting');
    audio.playChime();
    audio.softenMusic();
    const flash = document.getElementById('entryFlash');
    flash.classList.remove('active');
    void flash.offsetWidth;
    flash.classList.add('active');
  }, ENTRY_ANIMATION.buildMs);

  window.setTimeout(() => {
    unlockScreen.classList.remove('exiting', 'warping');
    showScreen('birthday-video-screen');
  }, ENTRY_ANIMATION.buildMs + ENTRY_ANIMATION.warpMs);

  window.setTimeout(() => {
    document.getElementById('entryFlash').classList.remove('active');
  }, ENTRY_ANIMATION.buildMs + ENTRY_ANIMATION.flashMs);

}

function playBirthdayVideo() {
  const video = document.getElementById('birthdayVideo');
  const status = document.getElementById('birthdayVideoStatus');
  const playRequest = video.play();
  if (playRequest) {
    playRequest.catch(() => {
      status.textContent = 'Add your video as birthday-video.mp4 beside index.html, then try again.';
      status.classList.add('visible');
    });
  }
}

function followStars(event) {
  transitionToScreen('wish-prompt-screen', event.currentTarget);
}

function slideWishPromptToGift(sourceElement) {
  const promptScreen = document.getElementById('wish-prompt-screen');
  if (!promptScreen.classList.contains('active')) return;
  if (screenTransitionInProgress) return;

  state.giftChoice = null;
  state.giftNote = '';
  document.querySelectorAll('.gift-card').forEach(card => {
    card.classList.remove('selected');
    card.setAttribute('aria-pressed', 'false');
  });
  const wishInput = document.getElementById('wishInput');
  wishInput.value = '';
  wishInput.disabled = true;
  wishInput.removeAttribute('aria-invalid');
  document.getElementById('wishLabel').textContent = 'Choose a category to tell me what you have in mind';
  document.getElementById('wishError').hidden = true;
  document.getElementById('wishSubmit').disabled = true;
  persistState();

  transitionToScreen('gift-screen', sourceElement || promptScreen);
}

function setupGiftCards() {
  const cards = document.querySelectorAll('.gift-card');
  const input = document.getElementById('wishInput');
  const submitButton = document.getElementById('wishSubmit');
  const wishLabel = document.getElementById('wishLabel');
  const wishError = document.getElementById('wishError');
  const wishPrompts = {
    Star: { label: 'What style item or accessory would you love?', placeholder: 'Name a clothing item, accessory, size, colour, or style…' },
    'Useful One': { label: 'What gadget or useful thing do you have in mind?', placeholder: 'Describe the gadget or useful thing you’d like…' },
    'Little Treat': { label: 'What food, dessert, or outing would make you happy?', placeholder: 'Tell me the treat, food, dessert, or outing you’re wishing for…' },
    Keep: { label: 'What sentimental keepsake would you like?', placeholder: 'Describe the keepsake and the story or meaning you’d like it to hold…' },
    'New Memory': { label: 'What experience or adventure should we do?', placeholder: 'Describe the experience, adventure, or new thing you’d like to try…' },
    'Surprise Me': { label: 'Any hints for your surprise?', placeholder: 'Share a hint, or leave it to me to surprise you…' }
  };
  const selectCard = (card) => {
    const choiceChanged = state.giftChoice !== card.dataset.label;
    cards.forEach(item => {
      const selected = item === card;
      item.classList.toggle('selected', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    state.giftChoice = card.dataset.label;
    const prompt = wishPrompts[state.giftChoice];
    wishLabel.textContent = prompt.label;
    input.placeholder = prompt.placeholder;
    if (choiceChanged) {
      input.value = '';
      state.giftNote = '';
    } else {
      input.value = state.giftNote || '';
    }
    input.disabled = false;
    input.required = true;
    submitButton.disabled = !input.value.trim();
    wishError.hidden = true;
    input.removeAttribute('aria-invalid');
    persistState();
    audio.playSelectionSound();
  };

  cards.forEach(card => {
    card.addEventListener('click', () => selectCard(card));
  });

  input.addEventListener('input', () => {
    state.giftNote = input.value;
    const hasDescription = Boolean(input.value.trim());
    submitButton.disabled = !hasDescription;
    if (hasDescription) {
      wishError.hidden = true;
      input.removeAttribute('aria-invalid');
    }
    persistState();
  });
}

function sendWish(sourceButton) {
  const sourceOrigin = getTransitionOrigin(sourceButton, document.getElementById('gift-screen'));
  const selected = document.querySelector('.gift-card.selected');
  if (!selected) {
    return;
  }

  const input = document.getElementById('wishInput');
  const note = (input.value || '').trim();
  if (!note) {
    const wishError = document.getElementById('wishError');
    wishError.hidden = false;
    input.setAttribute('aria-invalid', 'true');
    input.focus();
    return;
  }
  state.giftNote = note;
  persistState();
  transitionToScreen('bridge-screen', sourceOrigin);
}

function updateSpinCounter() {
  const left = state.wheelSpinsLeft + (wheelIsSpinning ? 1 : 0);
  spinCounter.textContent = left === 1 ? '1 SPIN LEFT' : `${left} SPINS LEFT`;
  spinCounter.style.display = left > 0 ? 'block' : 'none';
  document.getElementById('spinBtn').disabled = left <= 0 || state.wheelRewardPending || wheelIsSpinning;
}

function showRewardCard(reward) {
  rewardTitle.textContent = reward.title;
  rewardDesc.textContent = reward.desc;
  rewardCard.classList.add('active');
}

function spinWheel() {
  if (state.wheelSpinsLeft <= 0 || state.wheelRewardPending || wheelIsSpinning) return;

  const chosenIndex = Math.floor(Math.random() * rewards.length);
  const reward = rewards[chosenIndex];
  state.wheelResults.push(reward.title);
  state.wheelSpinsLeft -= 1;
  state.wheelRewardPending = true;
  wheelIsSpinning = true;
  updateSpinCounter();

  const segment = 360 / rewards.length;
  const offset = (chosenIndex + 0.5) * segment;
  const targetAngle = (360 - offset) % 360;
  const currentAngle = state.rotation % 360;
  const rotationDelta = (targetAngle - currentAngle + 360) % 360;
  const targetRotation = 360 * 5 + rotationDelta;
  state.rotation = state.rotation + targetRotation;
  wheelShell.style.transform = `rotate(${state.rotation}deg)`;
  persistState();
  window.setTimeout(() => {
    wheelIsSpinning = false;
    showRewardCard(reward);
    updateSpinCounter();
  }, 3600);
}

function collectReward() {
  if (!state.wheelRewardPending) return;
  rewardCard.classList.remove('active');
  state.wheelRewardPending = false;
  if (state.wheelResults.length === 3 && state.wheelSpinsLeft === 0) {
    document.getElementById('wheel-screen').classList.add('wheel-complete');
    wheelFinalLine.classList.add('show');
    fortuneBtn.style.display = 'inline-block';
  }
  persistState();
  updateSpinCounter();
}

function openFortuneScreen(sourceButton) {
  state.fortuneText = fortunes[Math.floor(Math.random() * fortunes.length)];
  state.fortuneOpened = false;
  fortuneCookie.classList.remove('broken');
  fortuneCookie.disabled = false;
  fortuneNote.textContent = state.fortuneText;
  fortuneNote.classList.remove('show');
  nextStarBtn.style.display = 'none';
  transitionToScreen('fortune-screen', sourceButton);
}

function startWheelFlow(sourceButton) {
  state.wheelResults = [];
  state.wheelSpinsLeft = 3;
  state.wheelRewardPending = false;
  state.rotation = 0;
  wheelIsSpinning = false;
  wheelShell.style.transition = 'none';
  wheelShell.style.transform = 'rotate(0deg)';
  void wheelShell.offsetWidth;
  wheelShell.style.transition = '';
  rewardCard.classList.remove('active');
  wheelFinalLine.classList.remove('show');
  document.getElementById('wheel-screen').classList.remove('wheel-complete');
  fortuneBtn.style.display = 'none';
  updateSpinCounter();
  persistState();
  transitionToScreen('wheel-screen', sourceButton);
}

function revealFortune() {
  if (state.fortuneOpened || !state.fortuneText) return;
  state.fortuneOpened = true;
  fortuneCookie.classList.add('broken');
  fortuneCookie.disabled = true;
  fortuneNote.classList.add('show');
  nextStarBtn.style.display = 'inline-block';
}

function openMemoryModal(event) {
  const card = event.currentTarget;
  const modal = document.getElementById('photoModal');
  const caption = card.dataset.caption || 'A tiny piece of our story, saved right here.';
  const image = card.querySelector('.polaroid-photo');
  const video = card.querySelector('.polaroid-video');
  const modalImage = modal.querySelector('.modal-photo');
  const modalVideo = modal.querySelector('.modal-video');
  if (video) {
    modalImage.hidden = true;
    modalVideo.src = video.src;
    modalVideo.hidden = false;
    modalVideo.load();
  } else if (image) {
    modalVideo.pause();
    modalVideo.removeAttribute('src');
    modalVideo.load();
    modalVideo.hidden = true;
    modalImage.src = image.src;
    modalImage.alt = caption;
    modalImage.hidden = false;
  }
  modal.querySelector('.modal-caption').textContent = caption;
  modal.classList.add('active');
}

function closeMemoryModal(event) {
  if (event.target !== event.currentTarget) return;
  const modal = document.getElementById('photoModal');
  const modalVideo = modal.querySelector('.modal-video');
  modalVideo.pause();
  modalVideo.removeAttribute('src');
  modalVideo.load();
  modalVideo.hidden = true;
  modal.querySelector('.modal-photo').hidden = false;
  modal.classList.remove('active');
}

function handleQuestionDecision(choice, sourceButton) {
  if (questionDecisionInProgress) return;
  questionDecisionInProgress = true;
  state.questionChoice = choice;
  persistState();

  const questionScreen = document.getElementById('question-screen');
  document.getElementById('yesBtn').disabled = true;
  document.getElementById('talkBtn').disabled = true;
  questionScreen.classList.add(choice === 'yes' ? 'decision-yes' : 'decision-talk');
  const message = choice === 'yes'
    ? 'Then maybe this is where a beautiful little story begins. ❤️'
    : 'That’s okay. Some things deserve a real conversation, not a button.';

  choiceMessage.textContent = message;
  choiceMessage.classList.add('active');

  window.setTimeout(() => {
    transitionToScreen('final-screen', sourceButton, startFinalBirthdaySequence);
  }, 2600);
}

function startFinalBirthdaySequence() {
  const finalScreen = document.getElementById('final-screen');
  const finalMessage = finalScreen.querySelector('.final-message');
  finalScreen.classList.remove('intro-dismissed', 'headline-raised', 'message-visible', 'final-ready', 'ending');
  finalMessage.querySelectorAll('.final-message-paragraph').forEach(paragraph => {
    paragraph.classList.remove('visible');
  });

  window.setTimeout(() => {
    finalScreen.classList.add('intro-dismissed');
    window.setTimeout(() => {
      finalScreen.classList.add('headline-raised');
      window.setTimeout(() => {
        finalScreen.classList.add('message-visible');
        const paragraphs = finalMessage.querySelectorAll('.final-message-paragraph');
        paragraphs.forEach((paragraph, index) => {
          window.setTimeout(() => paragraph.classList.add('visible'), index * 850);
        });
        const revealDuration = paragraphs.length ? (paragraphs.length - 1) * 850 + 1000 : 0;
        window.setTimeout(() => finalScreen.classList.add('final-ready'), revealDuration);
      }, 1300);
    }, 950);
  }, 1500);
}

function beginFinalFade() {
  const finalScreen = document.getElementById('final-screen');
  if (!finalScreen.classList.contains('final-ready') || finalScreen.classList.contains('ending')) return;
  finalScreen.classList.add('ending');
  document.body.classList.add('ending-complete');
}

function bindEvents() {
  document.getElementById('unlockBtn').addEventListener('click', unlockFlow);
  document.getElementById('birthdayVideoPlay').addEventListener('click', playBirthdayVideo);
  document.getElementById('birthdayVideoContinue').addEventListener('click', (event) => transitionToScreen('surprise-screen', event.currentTarget));
  document.getElementById('followStarsBtn').addEventListener('click', followStars);
  const wishPromptScreen = document.getElementById('wish-prompt-screen');
  wishPromptScreen.addEventListener('click', (event) => slideWishPromptToGift(event.currentTarget));
  wishPromptScreen.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      slideWishPromptToGift(event.currentTarget);
    }
  });
  document.getElementById('wishSubmit').addEventListener('click', (event) => sendWish(event.currentTarget));
  document.getElementById('luckBtn').addEventListener('click', (event) => startWheelFlow(event.currentTarget));
  document.getElementById('spinBtn').addEventListener('click', spinWheel);
  document.getElementById('collectRewardBtn').addEventListener('click', collectReward);
  document.getElementById('fortuneBtn').addEventListener('click', (event) => openFortuneScreen(event.currentTarget));
  fortuneCookie.addEventListener('click', revealFortune);
  document.getElementById('nextStarBtn').addEventListener('click', (event) => transitionToScreen('memory-screen', event.currentTarget));
  document.getElementById('memoryNextBtn').addEventListener('click', (event) => transitionToScreen('question-screen', event.currentTarget));
  document.getElementById('yesBtn').addEventListener('click', (event) => handleQuestionDecision('yes', event.currentTarget));
  document.getElementById('talkBtn').addEventListener('click', (event) => handleQuestionDecision('talk', event.currentTarget));
  const finalScreen = document.getElementById('final-screen');
  finalScreen.addEventListener('click', beginFinalFade);
  finalScreen.addEventListener('keydown', (event) => {
    if ((event.key === 'Enter' || event.key === ' ') && finalScreen.classList.contains('final-ready')) {
      event.preventDefault();
      beginFinalFade();
    }
  });
  document.getElementById('photoModal').addEventListener('click', closeMemoryModal);
  document.querySelectorAll('.polaroid').forEach(card => card.addEventListener('click', openMemoryModal));
  document.getElementById('birthdayInput').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') unlockFlow();
  });
  document.getElementById('birthdayInput').addEventListener('input', (event) => {
    const input = event.target;
    input.classList.remove('invalid');
    input.removeAttribute('aria-invalid');
    const error = document.getElementById('unlockError');
    error.textContent = '';
    error.classList.remove('visible');
    const value = event.target.value.replace(/[^\d/]/g, '');
    let digits = value.replace(/\//g, '');
    if (digits.length > 8) digits = digits.slice(0, 8);
    if (digits.length > 0) {
      const out = [];
      for (let i = 0; i < digits.length; i++) {
        if (i === 2 || i === 4) out.push('/');
        out.push(digits[i]);
      }
      event.target.value = out.join('');
    } else {
      event.target.value = '';
    }
  });
  const birthdayVideo = document.getElementById('birthdayVideo');
  const birthdayVideoFrame = document.getElementById('birthdayVideoFrame');
  const birthdayVideoStatus = document.getElementById('birthdayVideoStatus');
  birthdayVideo.addEventListener('play', () => {
    birthdayVideoFrame.classList.add('playing');
    birthdayVideoStatus.classList.remove('visible');
  });
  birthdayVideo.addEventListener('pause', () => birthdayVideoFrame.classList.remove('playing'));
  birthdayVideo.addEventListener('ended', () => birthdayVideoFrame.classList.remove('playing'));
  birthdayVideo.addEventListener('error', () => {
    birthdayVideoStatus.textContent = 'Add your video as birthday-video.mp4 beside index.html.';
    birthdayVideoStatus.classList.add('visible');
  });
}

function drawStars() {
  const canvas = document.getElementById('starsCanvas');
  const ctx = canvas.getContext('2d');
  const stars = [];
  let previousFrameTime = 0;

  function resizeCanvas() {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * pixelRatio;
    canvas.height = window.innerHeight * pixelRatio;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  function createStarField() {
    stars.length = 0;
    const count = Math.min(90, Math.max(48, Math.floor(window.innerWidth / 18)));
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 0.4 + 0.15,
        a: Math.random() * 0.16 + 0.06,
        drift: Math.random() * 0.5 + 0.3,
        phase: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.0015 + 0.0005
      });
    }
  }

  function animate() {
    const time = performance.now();
    const delta = previousFrameTime ? Math.min((time - previousFrameTime) / 1000, 0.05) : 1 / 60;
    previousFrameTime = time;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (const star of stars) {
      star.x = (star.x + star.drift * delta * 4) % window.innerWidth;
      const twinkle = 0.2 + 0.8 * ((Math.sin(time * star.twinkleSpeed + star.phase) + 1) / 2);
      ctx.beginPath();
      ctx.fillStyle = `rgba(226, 237, 255, ${star.a * twinkle})`;
      ctx.arc(star.x, star.y, star.r * (0.8 + twinkle * 0.2), 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(animate);
  }

  resizeCanvas();
  createStarField();
  animate();
  window.addEventListener('resize', () => {
    resizeCanvas();
    createStarField();
  });
}

function init() {
  hydrateState();
  showScreen('unlock-screen');
  bindEvents();
  setupGiftCards();
  drawStars();
  updateSpinCounter();
  if (state.wheelRewardPending && state.wheelResults.length > 0) {
    const lastReward = rewards.find(reward => reward.title === state.wheelResults[state.wheelResults.length - 1]);
    if (lastReward) showRewardCard(lastReward);
  }
  if (state.wheelResults.length === 3 && state.wheelSpinsLeft === 0 && !state.wheelRewardPending) {
    document.getElementById('wheel-screen').classList.add('wheel-complete');
    wheelFinalLine.classList.add('show');
    fortuneBtn.style.display = 'inline-block';
  }
}

init();
