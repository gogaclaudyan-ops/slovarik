'use strict';
/* =========================================================================
   WORLDS.JS — Живые игровые вселенные Словарика 2.0
   • Андрей: «Steel Ball Run» (анимированный Джайро, карта США, дуэль с Диего)
   • Настя: «Cozy-кафе и Питомцы» (интерактивная комната Toca Boca, 8 SVG-питомцев)
   ========================================================================= */

/* ---------- SVG-иллюстрации героев (100% офлайн, с анимациями) ---------- */
function renderSteelBallSvg(cls = '', size = 40) {
  return `<svg class="spin-ball ${cls}" width="${size}" height="${size}" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="30" cy="30" r="26" fill="#00b894" stroke="#f6b93b" stroke-width="4"/>
    <circle cx="30" cy="30" r="21" fill="#00a383"/>
    <circle cx="23" cy="22" r="10" fill="#55efc4" opacity=".45"/>
    <path d="M30 8 A22 22 0 0 1 52 30 A14 14 0 0 1 38 44 A8 8 0 0 1 30 36" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/>
    <path d="M12 34 A18 18 0 0 1 34 12" fill="none" stroke="#ffeaa7" stroke-width="2" stroke-linecap="round" opacity=".8"/>
    <circle cx="19" cy="19" r="3.5" fill="#fff"/>
  </svg>`;
}

function renderGyroSvg(mood = 'idle', size = 82) {
  const isExcited = mood === 'excited' || mood === 'happy';
  const isCheer = mood === 'cheer';
  const mouth = isExcited
    ? '<path d="M38 66 Q50 76 62 66 Q50 71 38 66 Z" fill="#fff" stroke="#1e272e" stroke-width="2.5"/>'
    : isCheer
      ? '<path d="M42 67 Q50 64 58 67" fill="none" stroke="#1e272e" stroke-width="2.8" stroke-linecap="round"/>'
      : '<path d="M40 66 Q51 73 61 65" fill="none" stroke="#1e272e" stroke-width="2.8" stroke-linecap="round"/>';
  const aura = isExcited
    ? '<circle cx="50" cy="50" r="46" fill="none" stroke="#f6b93b" stroke-width="2.5" stroke-dasharray="6 5" class="gyro-aura"/>'
    : '';
  return `<svg class="hero-svg gyro-svg mood-${mood}" width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="100" height="100" rx="14" fill="#17202a"/>
    <g opacity=".22" stroke="#f6b93b" stroke-width="2">
      <line x1="0" y1="12" x2="30" y2="30"/><line x1="100" y1="15" x2="72" y2="34"/>
      <line x1="0" y1="88" x2="28" y2="70"/><line x1="100" y1="84" x2="70" y2="68"/>
    </g>
    ${aura}
    <g class="hero-body">
      <path d="M24 96 Q28 74 50 74 Q72 74 76 96 Z" fill="#2c3e50" stroke="#1e272e" stroke-width="3"/>
      <path d="M42 75 L50 86 L58 75" fill="#00b894" stroke="#f6b93b" stroke-width="2"/>
      <path d="M24 46 Q20 66 28 76 L34 62 Z" fill="#f6d55c" stroke="#1e272e" stroke-width="2"/>
      <path d="M76 46 Q80 66 72 76 L66 62 Z" fill="#f6d55c" stroke="#1e272e" stroke-width="2"/>
      <circle cx="50" cy="54" r="23" fill="#ffe0bd" stroke="#1e272e" stroke-width="3"/>
      <path d="M35 47 L46 49 M65 47 L54 49" stroke="#8a6d1d" stroke-width="2.6" stroke-linecap="round"/>
      <g class="pet-eyes">
        <ellipse cx="41" cy="54" rx="4" ry="4.4" fill="#00a8ff" stroke="#1e272e" stroke-width="1.5"/>
        <circle cx="42.5" cy="52.5" r="1.4" fill="#fff"/>
        <ellipse cx="59" cy="54" rx="4" ry="4.4" fill="#00a8ff" stroke="#1e272e" stroke-width="1.5"/>
        <circle cx="60.5" cy="52.5" r="1.4" fill="#fff"/>
      </g>
      <path d="M48 59 L50 61 L52 59" fill="none" stroke="#d4a373" stroke-width="1.8" stroke-linecap="round"/>
      ${mouth}
      <path d="M14 39 Q50 22 86 39 L78 46 Q50 34 22 46 Z" fill="#2f3640" stroke="#f6b93b" stroke-width="2.5"/>
      <path d="M26 35 Q50 9 74 35 Z" fill="#353b48" stroke="#1e272e" stroke-width="2.5"/>
      <path d="M32 33 Q50 27 68 33" fill="none" stroke="#f6b93b" stroke-width="3"/>
      <polygon points="50,18 52,24 58,24 53,27 55,33 50,29 45,33 47,27 42,24 48,24" fill="#f6b93b"/>
    </g>
    <g class="orbit-ball">
      <circle cx="81" cy="79" r="12" fill="#00b894" stroke="#f6b93b" stroke-width="2.8"/>
      <path d="M74 79 Q81 70 88 79 Q81 88 74 79" fill="none" stroke="#fff" stroke-width="1.8"/>
    </g>
  </svg>`;
}

function renderDiegoSvg(mood = 'idle', size = 76) {
  const isHit = mood === 'hit';
  const isTaunt = mood === 'taunt';
  const eyes = isHit
    ? '<path d="M36 53 L45 60 M45 53 L36 60 M55 53 L64 60 M64 53 L55 60" stroke="#1e272e" stroke-width="3" stroke-linecap="round"/>'
    : `<g class="pet-eyes">
        <ellipse cx="41" cy="57" rx="4" ry="3.4" fill="${isTaunt ? '#ff3838' : '#e17055'}" stroke="#1e272e" stroke-width="1.5"/>
        <circle cx="41" cy="57" r="1.3" fill="#fff"/>
        <ellipse cx="59" cy="57" rx="4" ry="3.4" fill="${isTaunt ? '#ff3838' : '#e17055'}" stroke="#1e272e" stroke-width="1.5"/>
        <circle cx="59" cy="57" r="1.3" fill="#fff"/>
      </g>`;
  const mouth = isHit
    ? '<ellipse cx="50" cy="70" rx="6" ry="4.5" fill="#d63031" stroke="#1e272e" stroke-width="2"/>'
    : isTaunt
      ? '<path d="M39 68 Q50 75 62 66" fill="none" stroke="#1e272e" stroke-width="3" stroke-linecap="round"/>'
      : '<path d="M40 69 L60 66" fill="none" stroke="#1e272e" stroke-width="3" stroke-linecap="round"/>';
  const fx = isHit
    ? '<polygon points="82,14 86,24 96,24 88,30 91,40 82,34 73,40 76,30 68,24 78,24" fill="#ffeaa7" stroke="#d63031" stroke-width="2"/>'
    : '<text x="8" y="24" font-size="14" font-weight="900" fill="#ff7675" opacity=".8">ゴ</text><text x="80" y="90" font-size="14" font-weight="900" fill="#ff7675" opacity=".8">ゴ</text>';
  return `<svg class="hero-svg diego-svg mood-${mood}" width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="100" height="100" rx="12" fill="${isHit ? '#8c1d18' : '#3d0c11'}"/>
    <g class="hero-body">
      <path d="M24 96 Q29 74 50 74 Q71 74 76 96 Z" fill="#006266" stroke="#1e272e" stroke-width="3"/>
      <path d="M24 44 L21 68 L30 62 Z M76 44 L79 68 L70 62 Z" fill="#f6d55c" stroke="#1e272e" stroke-width="2"/>
      <circle cx="50" cy="56" r="22" fill="#ffe0bd" stroke="#1e272e" stroke-width="3"/>
      <path d="M34 50 L46 54 M66 50 L54 54" stroke="#1e272e" stroke-width="3" stroke-linecap="round"/>
      ${eyes}
      ${mouth}
      <path d="M20 43 Q50 13 80 43 Z" fill="#0097e6" stroke="#f6b93b" stroke-width="2.6"/>
      <rect x="33" y="23" width="34" height="15" rx="5" fill="#1e272e" stroke="#f6b93b" stroke-width="1.8"/>
      <text x="50" y="34" text-anchor="middle" font-size="12" font-weight="900" fill="#f6b93b">DIO</text>
    </g>
    ${fx}
  </svg>`;
}

const SVG_ART = {
  get gyro() { return renderGyroSvg('idle', 82); },
  get diego() { return renderDiegoSvg('idle', 72); },
  get steelBall() { return renderSteelBallSvg('', 40); }
};

/* ---------- НАСТЯ: 8 ЖИВЫХ KAWAII SVG-ПИТОМЦЕВ ---------- */
const COZY_PETS = [
  { id: 'capybara', em: '🍊🦫', name: 'Капибара с мандарином', rarity: 'common', phrase: 'Спокойно и уверенно — ты молодец!' },
  { id: 'axolotl', em: '🩷🦎', name: 'Розовый Аксолотль', rarity: 'rare', phrase: 'Буль-буль! Какой классный ответ!' },
  { id: 'unicat', em: '🦄🐱', name: 'Котёнок-единорог', rarity: 'legendary', phrase: 'Волшебство! Ты настоящая звёздочка!' },
  { id: 'redpanda', em: '🦊🍒', name: 'Красная панда', rarity: 'rare', phrase: 'Ура! Ещё одно слово в копилку!' },
  { id: 'corgi', em: '🐶🎀', name: 'Пушистый корги', rarity: 'common', phrase: 'Гав! Я в тебя верю!' },
  { id: 'mochi', em: '🐰🍓', name: 'Зайчик Моти', rarity: 'common', phrase: 'Прыг-скок! Очень здорово!' },
  { id: 'bobacat', em: '🧋🐱', name: 'Боба-котик', rarity: 'rare', phrase: 'Время уютной тренировки!' },
  { id: 'clouddragon', em: '☁️🐉', name: 'Облачный дракончик', rarity: 'legendary', phrase: 'Летим выше облаков!' }
];

const PET_TAP_PHRASES = [
  'Мурр~ Щекотно! 💖',
  'Ты самая лучшая хозяйка! ✨',
  'Пошли учить новые слова? 🌟',
  'Спасибо за обнимашки! 🥰',
  'Мне так уютно в нашем кафе! 🎀'
];

const PET_HAPPY_PHRASES = [
  'Ура!! Ты просто супер! ✨',
  'Точно в цель! Лови кристаллы! 💎',
  'Вау, как быстро и правильно! 🌸',
  'Обожаю учиться с тобой! 💖'
];

const PET_CHEER_PHRASES = [
  'Не переживай! Сейчас легко запомним 💪',
  'Ошибочка — это ступенька к победе! 🌱',
  'Я рядом, в следующий раз точно получится! 💖'
];

function petFaceSvg(mood, eyeY = 55, cheekY = 62, mouthY = 65) {
  const blush = `<ellipse cx="30" cy="${cheekY}" rx="6" ry="3.6" fill="#ff8fab" opacity=".68"/>
    <ellipse cx="70" cy="${cheekY}" rx="6" ry="3.6" fill="#ff8fab" opacity=".68"/>`;
  if (mood === 'happy' || mood === 'excited') {
    return `${blush}
      <path d="M33 ${eyeY} Q39 ${eyeY - 7} 45 ${eyeY}" fill="none" stroke="#3d2442" stroke-width="3.4" stroke-linecap="round"/>
      <path d="M55 ${eyeY} Q61 ${eyeY - 7} 67 ${eyeY}" fill="none" stroke="#3d2442" stroke-width="3.4" stroke-linecap="round"/>
      <path d="M44 ${mouthY} Q50 ${mouthY + 8} 56 ${mouthY}" fill="#ff758f" stroke="#3d2442" stroke-width="2.4" stroke-linecap="round"/>
      <text x="76" y="24" font-size="15">✨</text>`;
  }
  if (mood === 'cheer') {
    return `${blush}
      <g class="pet-eyes">
        <circle cx="38" cy="${eyeY}" r="4.5" fill="#3d2442"/><circle cx="39.5" cy="${eyeY - 1.5}" r="1.6" fill="#fff"/>
        <circle cx="62" cy="${eyeY}" r="4.5" fill="#3d2442"/><circle cx="63.5" cy="${eyeY - 1.5}" r="1.6" fill="#fff"/>
      </g>
      <path d="M45 ${mouthY + 3} Q50 ${mouthY - 1} 55 ${mouthY + 3}" fill="none" stroke="#3d2442" stroke-width="2.6" stroke-linecap="round"/>`;
  }
  return `${blush}
    <g class="pet-eyes">
      <circle cx="38" cy="${eyeY}" r="4.8" fill="#3d2442"/><circle cx="39.7" cy="${eyeY - 1.7}" r="1.8" fill="#fff"/><circle cx="36.5" cy="${eyeY + 1.5}" r=".9" fill="#fff"/>
      <circle cx="62" cy="${eyeY}" r="4.8" fill="#3d2442"/><circle cx="63.7" cy="${eyeY - 1.7}" r="1.8" fill="#fff"/><circle cx="60.5" cy="${eyeY + 1.5}" r=".9" fill="#fff"/>
    </g>
    <path d="M45 ${mouthY} Q50 ${mouthY + 5} 55 ${mouthY}" fill="none" stroke="#3d2442" stroke-width="2.6" stroke-linecap="round"/>`;
}

function renderPetSvg(id, mood = 'idle', size = 84) {
  let art = '';
  switch (id) {
    case 'axolotl':
      art = `
        <g class="pet-wiggle" fill="#ff758f" stroke="#c9184a" stroke-width="2">
          <ellipse cx="18" cy="44" rx="10" ry="5" transform="rotate(-20 18 44)"/>
          <ellipse cx="15" cy="56" rx="10" ry="5"/>
          <ellipse cx="19" cy="68" rx="9" ry="4.5" transform="rotate(20 19 68)"/>
          <ellipse cx="82" cy="44" rx="10" ry="5" transform="rotate(20 82 44)"/>
          <ellipse cx="85" cy="56" rx="10" ry="5"/>
          <ellipse cx="81" cy="68" rx="9" ry="4.5" transform="rotate(-20 81 68)"/>
        </g>
        <ellipse cx="50" cy="60" rx="30" ry="26" fill="#ffc2d1" stroke="#c9184a" stroke-width="2.6"/>
        <ellipse cx="50" cy="70" rx="18" ry="11" fill="#ffe5ec"/>
        ${petFaceSvg(mood, 54, 62, 66)}
        <circle cx="78" cy="24" r="5" fill="#e0fbfc" stroke="#74c0fc" stroke-width="1.5"/>`;
      break;
    case 'unicat':
      art = `
        <polygon points="26,42 22,18 43,32" fill="#fff" stroke="#a663cc" stroke-width="2.5" stroke-linejoin="round"/>
        <polygon points="28,37 26,24 38,32" fill="#ffc2d1"/>
        <polygon points="74,42 78,18 57,32" fill="#fff" stroke="#a663cc" stroke-width="2.5" stroke-linejoin="round"/>
        <polygon points="72,37 74,24 62,32" fill="#ffc2d1"/>
        <polygon points="50,7 43,31 57,31" fill="#ffd166" stroke="#d49a00" stroke-width="2" stroke-linejoin="round"/>
        <path d="M46 22 L54 19 M45 27 L55 24" stroke="#fff" stroke-width="1.6"/>
        <ellipse cx="50" cy="60" rx="29" ry="25" fill="#ffffff" stroke="#a663cc" stroke-width="2.6"/>
        <path d="M36 36 Q50 28 64 36 Q56 44 50 40 Q44 44 36 36 Z" fill="#e0aaff"/>
        <path d="M22 60 L30 60 M23 66 L30 64 M78 60 L70 60 M77 66 L70 64" stroke="#a663cc" stroke-width="1.8" stroke-linecap="round"/>
        ${petFaceSvg(mood, 56, 63, 66)}`;
      break;
    case 'redpanda':
      art = `
        <circle cx="28" cy="30" r="11" fill="#d95d39" stroke="#5c2414" stroke-width="2.5"/>
        <circle cx="28" cy="30" r="6" fill="#fff3e6"/>
        <circle cx="72" cy="30" r="11" fill="#d95d39" stroke="#5c2414" stroke-width="2.5"/>
        <circle cx="72" cy="30" r="6" fill="#fff3e6"/>
        <ellipse cx="50" cy="59" rx="31" ry="26" fill="#e76f51" stroke="#5c2414" stroke-width="2.6"/>
        <ellipse cx="34" cy="64" rx="12" ry="10" fill="#fff3e6"/>
        <ellipse cx="66" cy="64" rx="12" ry="10" fill="#fff3e6"/>
        <ellipse cx="50" cy="67" rx="11" ry="8" fill="#fff3e6"/>
        <circle cx="40" cy="46" r="3" fill="#fff3e6"/><circle cx="60" cy="46" r="3" fill="#fff3e6"/>
        <polygon points="46,61 54,61 50,65" fill="#3d2442"/>
        ${petFaceSvg(mood, 55, 65, 68)}`;
      break;
    case 'corgi':
      art = `
        <polygon points="24,45 18,16 42,32" fill="#f4a261" stroke="#7f4f24" stroke-width="2.5" stroke-linejoin="round"/>
        <polygon points="26,39 23,23 36,33" fill="#ffd6e0"/>
        <polygon points="76,45 82,16 58,32" fill="#f4a261" stroke="#7f4f24" stroke-width="2.5" stroke-linejoin="round"/>
        <polygon points="74,39 77,23 64,33" fill="#ffd6e0"/>
        <ellipse cx="50" cy="60" rx="30" ry="26" fill="#f4a261" stroke="#7f4f24" stroke-width="2.6"/>
        <path d="M50 38 Q56 54 74 62 Q70 84 50 85 Q30 84 26 62 Q44 54 50 38 Z" fill="#fffaf3"/>
        <ellipse cx="50" cy="62" rx="4.5" ry="3.2" fill="#3d2442"/>
        ${petFaceSvg(mood, 54, 63, 67)}
        <g transform="translate(62 24)">
          <ellipse cx="-6" cy="0" rx="6" ry="4" fill="#ff4d6d"/><ellipse cx="6" cy="0" rx="6" ry="4" fill="#ff4d6d"/>
          <circle cx="0" cy="0" r="3.5" fill="#ff8fab"/>
        </g>`;
      break;
    case 'mochi':
      art = `
        <g class="pet-wiggle">
          <ellipse cx="36" cy="24" rx="8.5" ry="20" fill="#ffffff" stroke="#e5989b" stroke-width="2.5" transform="rotate(-10 36 24)"/>
          <ellipse cx="36" cy="25" rx="4.2" ry="13" fill="#ffd6e0" transform="rotate(-10 36 25)"/>
          <ellipse cx="64" cy="24" rx="8.5" ry="20" fill="#ffffff" stroke="#e5989b" stroke-width="2.5" transform="rotate(10 64 24)"/>
          <ellipse cx="64" cy="25" rx="4.2" ry="13" fill="#ffd6e0" transform="rotate(10 64 25)"/>
        </g>
        <ellipse cx="50" cy="62" rx="30" ry="25" fill="#ffffff" stroke="#e5989b" stroke-width="2.6"/>
        <circle cx="50" cy="61" r="2.8" fill="#ff758f"/>
        ${petFaceSvg(mood, 56, 63, 66)}
        <text x="65" y="42" font-size="14">🍓</text>`;
      break;
    case 'bobacat':
      art = `
        <rect x="57" y="10" width="7" height="28" rx="3" fill="#ff758f" stroke="#c9184a" stroke-width="2" transform="rotate(12 60 24)"/>
        <polygon points="30,45 27,26 42,37" fill="#ffe5c4" stroke="#8d5524" stroke-width="2.3" stroke-linejoin="round"/>
        <polygon points="70,45 73,26 58,37" fill="#ffe5c4" stroke="#8d5524" stroke-width="2.3" stroke-linejoin="round"/>
        <ellipse cx="50" cy="52" rx="24" ry="19" fill="#ffe5c4" stroke="#8d5524" stroke-width="2.4"/>
        <path d="M24 58 L76 58 L70 89 Q50 94 30 89 Z" fill="#fff0f6" stroke="#d63384" stroke-width="2.5"/>
        <rect x="22" y="54" width="56" height="8" rx="4" fill="#ffc2d1" stroke="#d63384" stroke-width="2"/>
        <circle cx="38" cy="80" r="4" fill="#4a2c2a"/><circle cx="50" cy="82" r="4.2" fill="#4a2c2a"/><circle cx="62" cy="80" r="4" fill="#4a2c2a"/>
        <circle cx="44" cy="72" r="3.4" fill="#4a2c2a"/><circle cx="57" cy="72" r="3.4" fill="#4a2c2a"/>
        ${petFaceSvg(mood, 49, 55, 57)}`;
      break;
    case 'clouddragon':
      art = `
        <g class="pet-wiggle">
          <path d="M22 60 Q4 44 18 38 Q26 45 28 54 Z" fill="#a8dadc" stroke="#457b9d" stroke-width="2.2"/>
          <path d="M78 60 Q96 44 82 38 Q74 45 72 54 Z" fill="#a8dadc" stroke="#457b9d" stroke-width="2.2"/>
        </g>
        <path d="M36 33 Q33 18 42 26 Z" fill="#ffd166" stroke="#b26a00" stroke-width="2"/>
        <path d="M64 33 Q67 18 58 26 Z" fill="#ffd166" stroke="#b26a00" stroke-width="2"/>
        <ellipse cx="50" cy="60" rx="29" ry="25" fill="#e0f7fa" stroke="#457b9d" stroke-width="2.6"/>
        <ellipse cx="50" cy="72" rx="18" ry="11" fill="#ffffff"/>
        <circle cx="42" cy="36" r="7" fill="#ffffff" opacity=".85"/>
        <circle cx="52" cy="34" r="8" fill="#ffffff" opacity=".85"/>
        <circle cx="60" cy="37" r="6" fill="#ffffff" opacity=".85"/>
        ${petFaceSvg(mood, 56, 63, 67)}`;
      break;
    case 'capybara':
    default:
      art = `
        <ellipse cx="28" cy="38" rx="8" ry="6" fill="#a67c52" stroke="#5c3d2e" stroke-width="2.4" transform="rotate(-25 28 38)"/>
        <ellipse cx="72" cy="38" rx="8" ry="6" fill="#a67c52" stroke="#5c3d2e" stroke-width="2.4" transform="rotate(25 72 38)"/>
        <rect x="20" y="34" width="60" height="52" rx="26" fill="#c69c6d" stroke="#5c3d2e" stroke-width="2.6"/>
        <ellipse cx="50" cy="67" rx="17" ry="12" fill="#e0be95"/>
        <ellipse cx="50" cy="62" rx="5.5" ry="3.5" fill="#5c3d2e"/>
        ${petFaceSvg(mood, 53, 62, 68)}
        <g class="pet-wiggle">
          <circle cx="50" cy="24" r="11" fill="#ff9f1c" stroke="#c85a00" stroke-width="2.2"/>
          <path d="M50 13 Q57 8 61 14 Q55 17 50 14 Z" fill="#2ec4b6" stroke="#006d5b" stroke-width="1.5"/>
          <circle cx="46" cy="21" r="2.2" fill="#ffeaa7" opacity=".8"/>
        </g>`;
      break;
  }
  return `<svg class="pet-svg mood-${mood}" width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <g class="pet-body">${art}</g>
  </svg>`;
}

/* ---------- АНДРЕЙ: STEEL BALL RUN ---------- */
const SBR_STAGES = [
  { id: 1, name: '1. Пляж Сан-Диего', short: 'Сан-Диего', x: 46, y: 120, unit: UNITS7[0], artifact: '🪙 Золотая шпора' },
  { id: 2, name: '2. Пустыня Аризоны', short: 'Аризона', x: 112, y: 132, unit: UNITS7[1], artifact: '🧭 Компас всадника' },
  { id: 3, name: '3. Скалистые горы', short: 'Скалистые', x: 184, y: 92, unit: UNITS7[2], artifact: '🌀 Стальной шар' },
  { id: 4, name: '4. Канзас-Сити', short: 'Канзас', x: 256, y: 112, unit: UNITS7[3], artifact: '⚡ Подкова скорости' },
  { id: 5, name: '5. Чикаго', short: 'Чикаго', x: 328, y: 74, unit: UNITS7[4], artifact: '🦅 Знак сокола' },
  { id: 6, name: '6. Макино-Сити', short: 'Макино', x: 386, y: 42, unit: UNITS7[5], artifact: '🛡️ Щит Вращения' },
  { id: 7, name: '7. Филадельфия', short: 'Филадельфия', x: 454, y: 84, unit: UNITS7[6], artifact: '📜 Карта континента' },
  { id: 8, name: '8. Геттисберг', short: 'Геттисберг', x: 504, y: 114, unit: UNITS7[7], artifact: '🔥 Пламя дуэли' },
  { id: 9, name: '9. Финиш: Манхэттен', short: 'Манхэттен', x: 556, y: 66, unit: UNITS7[8], artifact: '👑 Кубок Steel Ball Run' }
];

const SBR_QUOTES = [
  '«Золотое вращение начинается с точности. Не сбавляй темп!»',
  '«Каждый выученный юнит приближает к финишу в Нью-Йорке!»',
  '«Поймай ритм: серия из 5 верных ответов раскрутит Стальной шар на максимум!»',
  '«Ошибки — это соперники на трассе. Вызови их на дуэль и забери трофей!»',
  '«Нио-хо! Жми на меня перед заездом для заряда Золотого вращения!»'
];

const SBR_SFX = ['ゴゴゴ!', 'SPIN x2!', 'ドドド!', 'GOLDEN RATIO!', 'ORA!!'];

function sbrProgress(p) {
  let curStageIdx = 0;
  let changed = false;
  const stages = SBR_STAGES.map((st, idx) => {
    const words = EN7.filter(w => w.u === st.unit);
    const done = words.filter(w => (p.cards[w.id]?.b || 0) >= LEARNED_BOX).length;
    const pct = words.length ? Math.round(done / words.length * 100) : 0;
    const cleared = pct >= 70;
    if (cleared && !p.world.artifacts.includes(st.artifact)) {
      p.world.artifacts.push(st.artifact);
      p.world.t = Date.now();
      changed = true;
    }
    if (!cleared && curStageIdx === idx) curStageIdx = idx;
    else if (cleared && curStageIdx === idx) curStageIdx = Math.min(SBR_STAGES.length - 1, idx + 1);
    return { ...st, done, total: words.length, pct, cleared };
  });
  if (changed) save();
  return { stages, curStageIdx };
}

function renderSbrRouteSvg(stages, curStageIdx) {
  const pts = stages.map(s => `${s.x},${s.y}`).join(' ');
  const curPts = stages.slice(0, curStageIdx + 1).map(s => `${s.x},${s.y}`).join(' ');
  const curSt = stages[curStageIdx];
  return `<svg class="sbr-route-svg" viewBox="0 0 600 165" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Карта гонки Steel Ball Run">
    <defs>
      <linearGradient id="sbrSky" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0f2038"/><stop offset="55%" stop-color="#1a3358"/><stop offset="100%" stop-color="#122742"/>
      </linearGradient>
      <linearGradient id="sbrLine" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#00d2d3"/><stop offset="100%" stop-color="#f6b93b"/>
      </linearGradient>
    </defs>
    <rect width="600" height="165" rx="14" fill="url(#sbrSky)"/>
    <path d="M22 142 Q120 156 220 135 Q330 148 450 138 Q540 132 582 94 L574 34 Q490 18 395 26 Q280 20 160 36 Q65 44 26 78 Z" fill="#1e3c63" stroke="#355f91" stroke-width="2"/>
    <polyline points="${pts}" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="5" stroke-dasharray="8 6" stroke-linecap="round" stroke-linejoin="round" class="route-dash"/>
    <polyline points="${curPts}" fill="none" stroke="url(#sbrLine)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    ${stages.map((st, i) => {
      const isCur = i === curStageIdx;
      const fill = st.cleared ? '#00b894' : isCur ? '#f6b93b' : '#2d4766';
      const stroke = st.cleared ? '#55efc4' : isCur ? '#fff' : '#7f9bb8';
      return `<g class="route-node ${isCur ? 'is-cur' : ''}" data-stage-idx="${i}" style="cursor:pointer">
        ${isCur ? `<circle cx="${st.x}" cy="${st.y}" r="18" fill="#f6b93b" opacity=".32" class="pulse-ring"/>` : ''}
        <circle cx="${st.x}" cy="${st.y}" r="${isCur ? 12 : 9}" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
        <text x="${st.x}" y="${st.y + 3.8}" text-anchor="middle" font-size="10.5" font-weight="900" fill="${st.cleared || isCur ? '#141a24' : '#d2dae2'}">${st.id}</text>
        <text x="${st.x}" y="${st.y + (st.id === 6 ? -15 : i % 2 ? 25 : -16)}" text-anchor="middle" font-size="11" font-weight="700" fill="${isCur ? '#ffeaa7' : '#d2e3f5'}">${esc(st.short)}</text>
      </g>`;
    }).join('')}
    <g class="horse-marker" transform="translate(${curSt.x} ${curSt.y - 24})">
      <circle cx="0" cy="-4" r="11" fill="#f6b93b" opacity=".25"/>
      <text x="0" y="1" text-anchor="middle" font-size="18">🐎</text>
    </g>
  </svg>`;
}

function renderSbrHero(p) {
  const { stages, curStageIdx } = sbrProgress(p);
  const curSt = stages[curStageIdx];
  const quote = SBR_QUOTES[(new Date().getDate() + (p.world.bossWins || 0)) % SBR_QUOTES.length];
  return `
  <div class="sbr-hero" id="sbrHero">
    <div class="sbr-top">
      <button type="button" class="sbr-portrait tap-hero" id="gyroTap" title="Нажми на Джайро!">
        ${renderGyroSvg('idle', 82)}
      </button>
      <div style="flex:1;min-width:180px">
        <div class="world-tag sbr">STEEL BALL RUN · ЭТАП ${curSt.id}/9</div>
        <h2 style="margin:2px 0;color:#fff">${esc(curSt.name)}</h2>
        <div class="small" style="color:#d2e3f5">Рекорд Spin <b>×${p.world.spinBest || 0}</b> · Дуэлей <b>${p.world.bossWins || 0}</b> · Трофеи <b>${p.world.artifacts.length}/9</b></div>
      </div>
    </div>
    <div class="sbr-quote" id="sbrQuote">${quote}</div>
    <div class="sbr-route-wrap">${renderSbrRouteSvg(stages, curStageIdx)}</div>
    <div class="sbr-stage-detail small" id="sbrStageInfo">
      <b>${esc(curSt.name)}</b> — ${curSt.done}/${curSt.total} слов (${curSt.pct}%) · ${esc(curSt.artifact)} ${curSt.cleared ? '✅' : '(нужно 70%)'}
    </div>
    <div class="sbr-map-strip">
      ${stages.map((st, i) => `
        <button type="button" class="sbr-stage ${st.cleared ? 'done' : i === curStageIdx ? 'cur' : ''}" data-stage-idx="${i}">
          <b>${st.id}. ${esc(st.short)}</b>
          <span>${st.done}/${st.total}</span>
          <div class="stbar"><i style="width:${st.pct}%"></i></div>
        </button>`).join('')}
    </div>
  </div>`;
}

function bindSbrHero(root, p) {
  const hero = root.querySelector('#sbrHero');
  if (!hero) return;
  const { stages } = sbrProgress(p);
  const gyroBtn = hero.querySelector('#gyroTap');
  const quoteEl = hero.querySelector('#sbrQuote');
  const infoEl = hero.querySelector('#sbrStageInfo');
  const cries = ['NYO-HO!!', 'GOLDEN SPIN!', 'ゴゴゴ!', 'Вперёд, всадник!'];
  if (gyroBtn) {
    gyroBtn.onclick = () => {
      playPop();
      gyroBtn.innerHTML = renderGyroSvg('excited', 82);
      gyroBtn.classList.remove('hero-bounce'); void gyroBtn.offsetWidth; gyroBtn.classList.add('hero-bounce');
      showSfx(pick(cries));
      if (quoteEl) quoteEl.textContent = pick(SBR_QUOTES);
      setTimeout(() => { if (gyroBtn.isConnected) gyroBtn.innerHTML = renderGyroSvg('idle', 82); }, 950);
    };
  }
  hero.querySelectorAll('[data-stage-idx]').forEach(node => {
    node.onclick = () => {
      const st = stages[+node.dataset.stageIdx];
      if (!st || !infoEl) return;
      playPop();
      infoEl.innerHTML = `<b>${esc(st.name)}</b> — ${st.done}/${st.total} слов (${st.pct}%) · ${esc(st.artifact)} ${st.cleared ? '✅ Открыт!' : '(нужно 70%)'}`;
      infoEl.classList.remove('pop'); void infoEl.offsetWidth; infoEl.classList.add('pop');
    };
  });
}

function renderSpinHud(combo, mood = 'idle') {
  const mult = combo >= 5 ? 5 : combo >= 3 ? 3 : combo >= 2 ? 2 : 1;
  const cls = combo >= 4 ? 'fast' : combo >= 2 ? 'active' : '';
  const chargePct = Math.min(100, combo * 20);
  const gyroMood = mood === 'excited' || combo >= 3 ? 'excited' : mood;
  return `<div class="spin-hud" id="liveHeroHud">
    <div class="hud-avatar">${renderGyroSvg(gyroMood, 54)}</div>
    <div style="flex:1;min-width:140px">
      <div class="row" style="gap:8px;justify-content:space-between">
        <b>Золотое вращение: ${combo > 0 ? 'серия ' + combo : 'раскрути шар!'}</b>
        <span class="pill spin-mult ${mult > 1 ? 'lit' : ''}">×${mult}</span>
      </div>
      <div class="spin-gauge"><i style="width:${chargePct}%"></i></div>
      <div class="small" style="color:#f6b93b">${mult > 1 ? `Бонус энергии ×${mult} · ゴゴゴ!` : 'Отвечай подряд без ошибок для комбо'}</div>
    </div>
    ${renderSteelBallSvg(cls, 42)}
  </div>`;
}

function renderBossHud(hp, maxHp, mood = 'idle') {
  const pct = Math.max(0, Math.round(hp / Math.max(1, maxHp) * 100));
  const line = mood === 'hit'
    ? '💥 ПРЯМОЕ ПОПАДАНИЕ Стальным шаром! Диего отступает!'
    : mood === 'taunt'
      ? '😈 Диего ухмыляется: «Попробуй ещё раз!»'
      : 'Каждый верный ответ наносит удар Стальным шаром!';
  return `<div class="boss-hud ${mood === 'hit' ? 'boss-hit-anim' : ''}" id="liveHeroHud">
    <div class="boss-avatar">${renderDiegoSvg(mood, 66)}</div>
    <div style="flex:1">
      <b>⚔️ ДУЭЛЬ ВСАДНИКОВ · Соперник: Диего</b>
      <div class="small" style="color:#ffeaa7">${line}</div>
      <div class="boss-hp-bar"><i style="width:${pct}%"></i></div>
    </div>
    <div class="boss-hp-num">${hp}/${maxHp}<span>HP</span></div>
  </div>`;
}

/* ---------- НАСТЯ: COZY-КАФЕ И ПИТОМЦЫ (TOCA BOCA / KAWAII) ---------- */
const COZY_ITEMS = [
  { id: 'window', em: '🪟', name: 'Окно с облаками', price: 0, tip: 'Меняем погоду и время суток за окном! ☀️🌅🌙' },
  { id: 'rug', em: '☁️', name: 'Коврик-облачко', price: 0, tip: 'Мягкий-мягкий коврик для лапок! ☁️' },
  { id: 'plant', em: '🪴', name: 'Комнатный цветок', price: 0, tip: 'Цветочек полит и растёт вместе с твоим словарём! 🌱' },
  { id: 'lights', em: '✨', name: 'Тёплая гирлянда', price: 60, tip: 'Огоньки мерцают — стало ещё уютнее! ✨' },
  { id: 'boba', em: '🧋', name: 'Стойка с бабл-ти', price: 90, tip: 'Свежий бабл-ти с тапиокой! Ммм, вкуснота! 🧋' },
  { id: 'cake', em: '🍰', name: 'Витрина с тортиками', price: 110, tip: 'Клубничный тортик ждёт после тренировки! 🍰' },
  { id: 'books', em: '📚', name: 'Уютный книжный стеллаж', price: 120, tip: 'Здесь хранятся все твои выученные слова! 📚' },
  { id: 'neon', em: '💖', name: 'Неоновое сердечко', price: 140, tip: 'Сердечко светится от твоих успехов! 💖' },
  { id: 'plush', em: '🧸', name: 'Большой плюшевый мишка', price: 160, tip: 'Мишка обнимает тебя перед диктантом! 🧸' },
  { id: 'moon', em: '🌙', name: 'Ночник-луна', price: 180, tip: 'Волшебный лунный свет охраняет комнату! 🌙' }
];

const RARITY_RU = { common: 'Обычный', rare: 'Редкий', legendary: 'Легендарный' };
const petById = id => COZY_PETS.find(x => x.id === id) || COZY_PETS[0];

function renderCozyRoomSvg(p) {
  const has = id => (p.world.room || []).includes(id);
  const pet = petById(p.world.activePet);
  const time = p.world.roomTime || 'day';
  const wallBg = time === 'night' ? '#362752' : time === 'sunset' ? '#ffe0d2' : '#fff0f7';
  const floorBg = time === 'night' ? '#4f3a6b' : time === 'sunset' ? '#ffd5c2' : '#ffe5d9';
  const trimCol = time === 'night' ? '#7b5ca8' : '#f4c6dc';
  const skyBg = time === 'night' ? '#1e1b4b' : time === 'sunset' ? '#ff9f68' : '#c8ecff';

  const petInner = renderPetSvg(pet.id, 'idle', 92)
    .replace(/^<svg[^>]*>/, '')
    .replace(/<\/svg>$/, '');

  return `<svg class="cozy-room-svg time-${time}" viewBox="0 0 600 225" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Уютное кафе Насти">
    <rect width="600" height="152" fill="${wallBg}"/>
    <rect y="152" width="600" height="73" fill="${floorBg}"/>
    <line x1="0" y1="152" x2="600" y2="152" stroke="${trimCol}" stroke-width="4"/>
    <g opacity=".25" fill="#fff">
      <circle cx="95" cy="52" r="5"/><circle cx="155" cy="95" r="4"/>
      <circle cx="430" cy="48" r="5"/><circle cx="540" cy="108" r="4"/>
    </g>

    ${has('window') ? `<g class="room-hit" data-room-item="window">
      <rect x="228" y="20" width="144" height="88" rx="16" fill="${skyBg}" stroke="#f8b4d9" stroke-width="5"/>
      ${time === 'night'
        ? `<circle cx="332" cy="46" r="12" fill="#ffeaa7"/><circle cx="337" cy="43" r="10" fill="${skyBg}"/>
           <circle cx="256" cy="42" r="2.2" fill="#fff" class="star-twinkle"/><circle cx="288" cy="36" r="1.8" fill="#fff" class="star-twinkle"/>
           <circle cx="272" cy="72" r="2" fill="#ffeaa7" class="star-twinkle"/><circle cx="342" cy="82" r="2" fill="#fff" class="star-twinkle"/>`
        : time === 'sunset'
          ? `<circle cx="300" cy="82" r="20" fill="#ffd166" opacity=".9"/>
             <g class="cloud-drift"><ellipse cx="264" cy="52" rx="18" ry="8" fill="#ffe5ec" opacity=".9"/><ellipse cx="334" cy="44" rx="16" ry="7" fill="#ffe5ec" opacity=".85"/></g>`
          : `<circle cx="336" cy="46" r="13" fill="#ffd166"/>
             <g class="cloud-drift"><ellipse cx="264" cy="52" rx="19" ry="9" fill="#fff"/><ellipse cx="276" cy="48" rx="13" ry="8" fill="#fff"/></g>`}
      <line x1="300" y1="20" x2="300" y2="108" stroke="#f8b4d9" stroke-width="4"/>
      <line x1="228" y1="64" x2="372" y2="64" stroke="#f8b4d9" stroke-width="4"/>
      <rect x="220" y="106" width="160" height="8" rx="4" fill="#ffc2d1"/>
    </g>` : ''}

    ${has('lights') ? `<g class="room-hit" data-room-item="lights">
      <path d="M10 16 Q150 48 300 18 Q450 48 590 16" fill="none" stroke="#f6b93b" stroke-width="2.5"/>
      <circle cx="70" cy="31" r="6" fill="#ffeaa7" class="lamp-glow"/>
      <circle cx="165" cy="35" r="6" fill="#ff9ff3" class="lamp-glow"/>
      <circle cx="260" cy="24" r="6" fill="#ffeaa7" class="lamp-glow"/>
      <circle cx="345" cy="24" r="6" fill="#74b9ff" class="lamp-glow"/>
      <circle cx="445" cy="35" r="6" fill="#ffeaa7" class="lamp-glow"/>
      <circle cx="535" cy="30" r="6" fill="#ff9ff3" class="lamp-glow"/>
    </g>` : ''}

    ${has('moon') ? `<g class="room-hit" data-room-item="moon" transform="translate(46 36)">
      <circle cx="24" cy="24" r="24" fill="#ffeaa7" opacity="${time === 'night' ? '.35' : '.16'}" class="lamp-glow"/>
      <path d="M28 8 A16 16 0 1 0 38 34 A13 13 0 1 1 28 8 Z" fill="#ffd166" stroke="#f6b93b" stroke-width="2"/>
    </g>` : ''}

    ${has('neon') ? `<g class="room-hit" data-room-item="neon" transform="translate(454 34)">
      <rect width="94" height="48" rx="16" fill="${time === 'night' ? '#4a154b' : '#ffe0f0'}" stroke="#ff4d6d" stroke-width="3"/>
      <path d="M47 36 C47 36 31 26 31 18 C31 13 35 10 40 10 C43 10 46 12 47 15 C48 12 51 10 54 10 C59 10 63 13 63 18 C63 26 47 36 47 36 Z" fill="#ff4d6d" class="lamp-glow"/>
    </g>` : ''}

    ${has('books') ? `<g class="room-hit" data-room-item="books" transform="translate(22 86)">
      <rect width="78" height="72" rx="10" fill="#ffd6e7" stroke="#d63384" stroke-width="2.5"/>
      <line x1="6" y1="36" x2="72" y2="36" stroke="#d63384" stroke-width="2.5"/>
      <rect x="10" y="10" width="12" height="24" rx="3" fill="#ff758f"/>
      <rect x="24" y="14" width="12" height="20" rx="3" fill="#74c0fc"/>
      <rect x="38" y="8" width="13" height="26" rx="3" fill="#ffd166"/>
      <rect x="53" y="13" width="13" height="21" rx="3" fill="#80ed99"/>
      <rect x="12" y="43" width="14" height="22" rx="3" fill="#c77dff"/>
      <rect x="29" y="45" width="13" height="20" rx="3" fill="#ffadad"/>
      <rect x="45" y="41" width="16" height="24" rx="3" fill="#a0c4ff"/>
    </g>` : ''}

    ${has('plant') ? `<g class="room-hit" data-room-item="plant" transform="translate(118 112)">
      <path d="M12 34 L36 34 L32 54 L16 54 Z" fill="#e07a5f" stroke="#9c4221" stroke-width="2"/>
      <ellipse cx="24" cy="24" rx="8" ry="15" fill="#52b788" transform="rotate(-24 24 24)"/>
      <ellipse cx="24" cy="22" rx="8" ry="16" fill="#40916c"/>
      <ellipse cx="26" cy="25" rx="8" ry="14" fill="#74c69d" transform="rotate(25 26 25)"/>
    </g>` : ''}

    ${has('boba') ? `<g class="room-hit" data-room-item="boba" transform="translate(410 108)">
      <rect x="0" y="34" width="60" height="28" rx="6" fill="#ffc2d1" stroke="#d63384" stroke-width="2"/>
      <rect x="18" y="6" width="24" height="30" rx="6" fill="#fff" stroke="#d63384" stroke-width="2"/>
      <rect x="28" y="-2" width="4" height="12" fill="#ff4d6d"/>
      <circle cx="24" cy="30" r="2.6" fill="#4a2c2a"/><circle cx="30" cy="31" r="2.6" fill="#4a2c2a"/><circle cx="36" cy="30" r="2.6" fill="#4a2c2a"/>
    </g>` : ''}

    ${has('cake') ? `<g class="room-hit" data-room-item="cake" transform="translate(486 106)">
      <rect x="0" y="36" width="76" height="26" rx="8" fill="#ffe5ec" stroke="#e84393" stroke-width="2"/>
      <path d="M12 36 A26 26 0 0 1 64 36 Z" fill="rgba(255,255,255,.55)" stroke="#f8b4d9" stroke-width="2"/>
      <rect x="22" y="22" width="32" height="14" rx="4" fill="#ffccd5" stroke="#d63384" stroke-width="1.8"/>
      <circle cx="38" cy="18" r="4.5" fill="#ff4d6d"/>
    </g>` : ''}

    ${has('rug') ? `<g class="room-hit" data-room-item="rug">
      <ellipse cx="300" cy="188" rx="134" ry="24" fill="#ffffff" stroke="#f8b4d9" stroke-width="3" opacity=".95"/>
      <ellipse cx="300" cy="188" rx="108" ry="15" fill="#fff0f7"/>
    </g>` : ''}

    ${has('plush') ? `<g class="room-hit" data-room-item="plush" transform="translate(168 134)">
      <circle cx="14" cy="14" r="8" fill="#d4a373" stroke="#8d5524" stroke-width="2"/>
      <circle cx="38" cy="14" r="8" fill="#d4a373" stroke="#8d5524" stroke-width="2"/>
      <circle cx="26" cy="24" r="15" fill="#ddb892" stroke="#8d5524" stroke-width="2"/>
      <ellipse cx="26" cy="46" rx="16" ry="14" fill="#ddb892" stroke="#8d5524" stroke-width="2"/>
      <circle cx="21" cy="22" r="2" fill="#3d2442"/><circle cx="31" cy="22" r="2" fill="#3d2442"/>
      <ellipse cx="26" cy="27" rx="4" ry="3" fill="#fff3e6"/><circle cx="26" cy="26" r="1.8" fill="#5c3d2e"/>
    </g>` : ''}

    <g class="room-pet-hit" data-pet-tap="1" transform="translate(254 114)">
      <rect x="6" y="4" width="88" height="90" fill="transparent"/>
      <ellipse cx="46" cy="84" rx="30" ry="7" fill="rgba(61,36,66,.12)"/>
      <g class="room-pet-anim">${petInner}</g>
    </g>
  </svg>`;
}

function renderCozyHero(p) {
  const pet = petById(p.world.activePet);
  const caps = p.world.freeCapsules || 0;
  const curTime = p.world.roomTime || 'day';
  const timeMeta = {
    day: `${UI_ICO.sun}<span>День</span>`,
    sunset: `${UI_ICO.sunset}<span>Закат</span>`,
    night: `${UI_ICO.moon}<span>Вечер</span>`
  };
  return `
  <div class="cozy-stage" id="cozyHero">
    <div class="row" style="margin-bottom:8px;gap:6px;flex-wrap:nowrap">
      <div class="world-tag cozy" style="margin:0">Кафе Насти</div>
      <div class="spacer"></div>
      <div class="pill stat-pill">${UI_ICO.gem}<span>${p.world.gems || 0}</span></div>
      <button type="button" class="pill pill-btn" id="toggleRoomTime" title="Сменить атмосферу">${timeMeta[curTime]}</button>
    </div>
    <div class="room-speech" id="roomSpeech"><b>${esc(pet.name)}:</b> ${esc(pet.phrase)}</div>
    <div class="cozy-room-wrap" id="cozyRoomWrap">${renderCozyRoomSvg(p)}</div>
    <div class="cozy-actions">
      <button type="button" class="pill pill-btn pet-treat-btn" id="feedPet">🍓 Покормить</button>
      <button class="btn small btn-ico" id="openShop">${UI_ICO.shop}<span>Магазин</span></button>
      <button class="btn small gold btn-ico" id="openGacha">${UI_ICO.gacha}<span>Капсула${caps > 0 ? ` (${caps})` : ''}</span></button>
    </div>
  </div>`;
}

function spawnRoomHearts(wrap, ems = ['💖', '✨', '🌸']) {
  for (let i = 0; i < 5; i++) {
    const el = document.createElement('span');
    el.className = 'room-heart';
    el.textContent = pick(ems);
    el.style.left = (36 + Math.random() * 28) + '%';
    el.style.top = (42 + Math.random() * 16) + '%';
    el.style.animationDelay = (i * 0.07) + 's';
    wrap.appendChild(el);
    setTimeout(() => el.remove(), 950);
  }
}

function bindCozyRoom(root, p) {
  const stage = root.querySelector('#cozyHero');
  if (!stage) return;
  const speech = stage.querySelector('#roomSpeech');
  const wrap = stage.querySelector('#cozyRoomWrap');
  const pet = petById(p.world.activePet);

  const applyRoomMood = mode => {
    document.body.dataset.roomTime = mode;
    if (typeof BG_FX !== 'undefined') BG_FX.setMode('nastya', mode);
  };
  applyRoomMood(p.world.roomTime || 'day');

  const petHappyReact = (phrase, icons) => {
    playPop();
    const anim = wrap && wrap.querySelector('.room-pet-anim');
    if (anim) {
      anim.classList.remove('pet-jump-once');
      void anim.offsetWidth;
      anim.classList.add('pet-jump-once');
    }
    if (wrap) spawnRoomHearts(wrap, icons);
    if (speech) speech.innerHTML = `<b>${esc(pet.name)}:</b> ${esc(phrase)}`;
  };

  const feedBtn = stage.querySelector('#feedPet');
  if (feedBtn) {
    const treats = [
      ['Ммм, клубничка! Так вкусно, спасибо! 🍓💖', ['🍓', '💖', '✨']],
      ['Ням-ням, сладкий моти! Зарядился энергией! 🍡✨', ['🍡', '✨', '🌸']],
      ['Обожаю бабл-ти! Теперь готовы к новым словам! 🧋💖', ['🧋', '💖', '⭐']]
    ];
    feedBtn.onclick = () => {
      const [txt, icos] = pick(treats);
      petHappyReact(txt, icos);
      beep(true, 4);
    };
  }

  const cycleTime = () => {
    const order = ['day', 'sunset', 'night'];
    const next = order[(order.indexOf(p.world.roomTime || 'day') + 1) % order.length];
    p.world.roomTime = next;
    p.world.t = Date.now();
    save();
    playPop();
    applyRoomMood(next);
    const meta = {
      day: `${UI_ICO.sun}<span>День</span>`,
      sunset: `${UI_ICO.sunset}<span>Закат</span>`,
      night: `${UI_ICO.moon}<span>Вечер</span>`
    };
    const btn = stage.querySelector('#toggleRoomTime');
    if (btn) btn.innerHTML = meta[next];
    if (wrap) {
      wrap.innerHTML = renderCozyRoomSvg(p);
      bindRoomSvgEvents();
    }
    if (speech) {
      const lines = {
        day: 'Солнечное утро в кафе — самое время для новых слов!',
        sunset: 'Какой красивый розовый закат за окном!',
        night: 'Включили уютный вечерний свет и звёздочки!'
      };
      speech.innerHTML = `<b>${esc(pet.name)}:</b> ${lines[next]}`;
    }
  };

  const timeBtn = stage.querySelector('#toggleRoomTime');
  if (timeBtn) timeBtn.onclick = cycleTime;

  function bindRoomSvgEvents() {
    if (!wrap) return;
    const petHit = wrap.querySelector('[data-pet-tap]');
    if (petHit) {
      petHit.onclick = () => petHappyReact(pick(PET_TAP_PHRASES), ['💖', '✨', '🌸']);
    }
    wrap.querySelectorAll('[data-room-item]').forEach(el => {
      el.onclick = () => {
        const id = el.dataset.roomItem;
        if (id === 'window') { cycleTime(); return; }
        playPop();
        el.classList.remove('item-boing'); void el.offsetWidth; el.classList.add('item-boing');
        const it = COZY_ITEMS.find(x => x.id === id);
        if (it && speech) speech.innerHTML = `<b>${esc(pet.name)}:</b> ${esc(it.tip)}`;
        spawnRoomHearts(wrap, ['✨', it ? it.em : '💖']);
      };
    });
  }
  bindRoomSvgEvents();
}

function renderPetCheer(p, customText, mood = 'idle', combo = 0) {
  const pet = petById(p.world.activePet);
  const text = customText || pet.phrase;
  return `<div class="pet-cheer mood-${mood}" id="liveHeroHud">
    <div class="pet-ico-svg">${renderPetSvg(pet.id, mood, 62)}</div>
    <div style="flex:1">
      <div class="row" style="gap:6px">
        <b>${esc(pet.name)}</b>
        ${combo >= 2 ? `<span class="combo-chip">🔥 Серия ×${combo}</span>` : ''}
      </div>
      <div class="small muted pet-msg">${esc(text)}</div>
    </div>
  </div>`;
}

function rollGachaPet(p) {
  const owned = new Set(p.world.pets || []);
  const unowned = COZY_PETS.filter(x => !owned.has(x.id));
  const pool = unowned.length ? unowned : COZY_PETS;
  const r = Math.random();
  let pickPool = pool.filter(x => r > .82 ? x.rarity === 'legendary' : r > .45 ? x.rarity === 'rare' : x.rarity === 'common');
  if (!pickPool.length) pickPool = pool;
  const pet = pick(pickPool);
  const isNewPet = !owned.has(pet.id);
  if (isNewPet) p.world.pets.push(pet.id);
  else p.world.gems = (p.world.gems || 0) + 50;
  p.world.activePet = pet.id;
  p.world.t = Date.now();
  save();
  return { pet, isNewPet };
}

/* ---------- Ежедневные мини-квесты (совместимы с форматом v1/v2) ---------- */
function renderDailyQuests(p) {
  const t = dayTot(p);
  const isSbr = p.id === 'andrey';
  const quests = [
    { ico: '🎯', title: '10 верных ответов', cur: Math.min(10, t.ok), max: 10 },
    { ico: '✨', title: '3 новых слова', cur: Math.min(3, t.nw), max: 3 },
    { ico: isSbr ? '⚔️' : '🎮', title: '1 тренировка или игра', cur: Math.min(1, t.ses + t.games), max: 1 }
  ];
  return `<div class="quests-row">
    ${quests.map(q => {
      const done = q.cur >= q.max;
      const pct = Math.round(q.cur / q.max * 100);
      return `<div class="quest-chip ${done ? 'done' : ''}">
        <div class="row" style="gap:6px;justify-content:space-between">
          <span class="small"><b>${done ? '✅' : q.ico} ${q.title}</b></span>
          <span class="small muted">${q.cur}/${q.max}</span>
        </div>
        <div class="qbar"><i style="width:${pct}%"></i></div>
      </div>`;
    }).join('')}
  </div>`;
}
