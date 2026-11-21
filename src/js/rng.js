// Seeded RNG, noise and name generation. Pure logic, works in browser and Node.
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  class RNG {
    constructor(seed) {
      this.seed = seed >>> 0;
      this.state = this.seed;
      this._f = mulberry32(this.seed);
      this.calls = 0;
    }
    next() { this.calls++; return this._f(); }
    float(a = 0, b = 1) { return a + (b - a) * this.next(); }
    int(a, b) { return Math.floor(a + (b - a + 1) * this.next()); }
    chance(p) { return this.next() < p; }
    pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
    shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(this.next() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }
    weighted(items, wfn) {
      let total = 0;
      for (const it of items) total += Math.max(0, wfn(it));
      let r = this.next() * total;
      for (const it of items) {
        r -= Math.max(0, wfn(it));
        if (r <= 0) return it;
      }
      return items[items.length - 1];
    }
    // serialisable state: re-seed from a derived seed
    snapshot() { return Math.floor(this.next() * 4294967296); }
  }

  function hash2(x, y, seed) {
    let h = (x * 374761393 + y * 668265263 + seed * 982451653) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  function smooth(t) { return t * t * (3 - 2 * t); }

  function valueNoise(x, y, seed) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const a = hash2(xi, yi, seed), b = hash2(xi + 1, yi, seed);
    const c = hash2(xi, yi + 1, seed), d = hash2(xi + 1, yi + 1, seed);
    const u = smooth(xf), v = smooth(yf);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }

  function fbm(x, y, seed, oct = 5, lac = 2, gain = 0.5) {
    let amp = 1, freq = 1, sum = 0, norm = 0;
    for (let i = 0; i < oct; i++) {
      sum += amp * valueNoise(x * freq, y * freq, seed + i * 101);
      norm += amp;
      amp *= gain;
      freq *= lac;
    }
    return sum / norm;
  }

  // Name generator — different "cultures" per realm for flavour.
  const CULTURES = {
    imperial: { pre: ['Аур', 'Вал', 'Кай', 'Лум', 'Мар', 'Сол', 'Тер', 'Вер', 'Октав', 'Цез'], mid: ['е', 'і', 'ор', 'ан', 'ел', 'ір', 'ус'], suf: ['іум', 'енція', 'арис', 'он', 'ея', 'ія', 'ус', 'ар'] },
    north: { pre: ['Сног', 'Хьор', 'Ульф', 'Бйор', 'Ейр', 'Тор', 'Гримм', 'Скал', 'Фрей', 'Квел'], mid: ['ва', 'ге', 'ст', 'ри', 'нг', 'ло'], suf: ['гард', 'хейм', 'фйорд', 'борг', 'вік', 'дал', 'стад'] },
    elven: { pre: ['Ель', 'Лі', 'Сіл', 'Аел', 'Ітіл', 'Ная', 'Фае', 'Мір', 'Таль', 'Ері'], mid: ['ан', 'ія', 'ель', 'ір', 'ае', 'ло'], suf: ['дор', 'ендель', 'ріель', 'ланте', 'віаль', 'норе', 'тіль'] },
    desert: { pre: ['Каср', 'Зах', 'Шар', 'Амр', 'Ель-Бад', 'Хаз', 'Сафр', 'Джин', 'Мір', 'Зулф'], mid: ['а', 'і', 'ум', 'ар', 'ад'], suf: ['абад', 'ія', 'ан', 'ар', 'ум', 'іра', 'еш'] },
    eastern: { pre: ['Ко', 'Ямо', 'Сакур', 'Хіно', 'Цуки', 'Мізу', 'Кура', 'Ака', 'Сора', 'Широ'], mid: ['ра', 'то', 'на', 'ке', 'мі', 'са'], suf: ['ґава', 'ямa', 'шіма', 'дзакі', 'хара', 'мура', 'кава'] },
    slavic: { pre: ['Звен', 'Бор', 'Ліс', 'Чорн', 'Свят', 'Яр', 'Вишн', 'Зор', 'Лад', 'Мир'], mid: ['о', 'е', 'ин', 'ов', 'ан'], suf: ['город', 'ів', 'ополь', 'ець', 'ень', 'ичі', 'ава', 'гір'] },
    dwarven: { pre: ['Кхаз', 'Дур', 'Барук', 'Гром', 'Торін', 'Кірк', 'Мор', 'Бальд', 'Двал', 'Ґунд'], mid: ['а', 'ум', 'ор', 'ук', 'ар'], suf: ['-дум', 'горн', 'кар', 'бад', 'ріль', 'зан', 'гол'] },
  };

  function makeName(rng, culture) {
    const c = CULTURES[culture] || CULTURES.slavic;
    let n = rng.pick(c.pre);
    if (rng.chance(0.4)) n += rng.pick(c.mid);
    n += rng.pick(c.suf);
    return n.replace('a', 'а');
  }

  const PERSON = {
    m: ['Альберт', 'Бруно', 'Вільгельм', 'Гаральд', 'Дарій', 'Едмунд', 'Златомир', 'Ігор', 'Казимир', 'Лоренц', 'Мстислав', 'Нестор', 'Освальд', 'Родрик', 'Святослав', 'Теодор', 'Ульріх', 'Фенрір', 'Хірото', 'Цезар', 'Ярополк', 'Кенджі', 'Ельрон', 'Зафір', 'Бйорн', 'Торвальд', 'Ромуальд', 'Аурелій'],
    f: ['Аделаїда', 'Беатріс', 'Ванда', 'Гелена', 'Дарина', 'Евеліна', 'Ізольда', 'Катерина', 'Ліліана', 'Мирослава', 'Нефертарі', 'Оксана', 'Роксолана', 'Сакура', 'Тесса', 'Улла', 'Фрея', 'Юкі', 'Ярослава', 'Елара', 'Зара', 'Сіґрід'],
    epithet: [['Хоробрий', 'Хоробра'], ['Мудрий', 'Мудра'], ['Лисий', 'Золотокоса'], ['Жорстокий', 'Жорстока'], ['Щедрий', 'Щедра'], ['Боязкий', 'Боязка'], ['Залізний', 'Залізна'], ['Ласий до пиріжків', 'Ласа до пиріжків'], ['Безсонний', 'Безсонна'], ['Трохи божевільний', 'Трохи божевільна'], ['Справедливий', 'Справедлива'], ['Великий', 'Велика'], ['Бородатий', 'Прекрасна'], ['Невдаха', 'Невдаха'], ['Святий', 'Свята'], ['Хитрий', 'Хитра'], ['Сонний', 'Сонна'], ['Грізний', 'Грізна'], ['Пихатий', 'Пихата'], ['Миролюбний', 'Миролюбна']],
  };

  function personName(rng, female) {
    return rng.pick(female ? PERSON.f : PERSON.m);
  }

  ISK.RNG = RNG;
  ISK.noise = { valueNoise, fbm, hash2 };
  ISK.names = { makeName, personName, PERSON, CULTURES };
})();
