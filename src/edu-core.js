/* ===================== PAPERBULL LEARN — CORE (question engine) ===================== */
const EDU = (function () {
  'use strict';
  const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const P = a => a[Math.floor(Math.random() * a.length)];
  const SH = a => {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const GCD = (a, b) => {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) [a, b] = [b, a % b];
    return a;
  };
  const LCM = (a, b) => (a / GCD(a, b)) * b;
  const FR = (n, d) => {
    if (d < 0) {
      n = -n;
      d = -d;
    }
    const g = GCD(n, d) || 1;
    n /= g;
    d /= g;
    const s = n < 0 ? '−' : '';
    n = Math.abs(n);
    return s + (d === 1 ? String(n) : n + '/' + d);
  };
  const FN = n => {
    n = +(+n).toFixed(6);
    if (Object.is(n, -0)) n = 0;
    if (n < 0) return '−' + FN(-n);
    return Number.isInteger(n)
      ? n.toLocaleString('en-US')
      : n.toLocaleString('en-US', { maximumFractionDigits: 6 });
  };
  const USD = c => (c < 0 ? '−' : '') + '$' + (Math.abs(c) / 100).toFixed(2);
  const CENTS = c => (c < 100 ? c + '¢' : USD(c));
  const SN = x => (x < 0 ? '(−' + -x + ')' : String(x)); // signed number for display
  const MS = x => (x < 0 ? '−' + -x : String(x)); // minus-sign display
  const range = (a, b, s = 1) => {
    const o = [];
    for (let i = a; i <= b; i += s) o.push(i);
    return o;
  };
  const chunk = (arr, n) => {
    const o = [];
    for (let i = 0; i < arr.length; i += n) o.push(arr.slice(i, i + n));
    return o;
  };
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const ord = n =>
    n + (['th', 'st', 'nd', 'rd'][((n % 100) - 20) % 10] || ['th', 'st', 'nd', 'rd'][n % 100] || 'th');

  /* numeric answer + 3 plausible wrong answers */
  function NC(ans, o = {}) {
    const min = o.min ?? -Infinity,
      st = o.step || 1,
      f = o.fmt || FN;
    const big = Math.max(st, Math.round((Math.abs(ans) * 0.1) / st) * st);
    const pool = [
      ans + st,
      ans - st,
      ans + 2 * st,
      ans - 2 * st,
      ans + big,
      ans - big,
      ans + 3 * st,
      ans - 3 * st,
      ans + 10 * st,
      ans - 10 * st,
    ];
    if (Number.isInteger(ans) && Math.abs(ans) > 3) pool.push(ans * 2, Math.round(ans / 2));
    const out = [ans],
      seen = new Set([f(ans)]);
    const tryAdd = c => {
      const v = +(+c).toFixed(6);
      const k = f(v);
      if (out.length >= 4 || v < min || !isFinite(v) || seen.has(k)) return;
      seen.add(k);
      out.push(v);
    };
    (o.extra || []).forEach(tryAdd);
    SH(pool).forEach(tryAdd);
    for (let k = 4; out.length < 4 && k < 200; k++) {
      tryAdd(ans + k * st);
      tryAdd(ans - k * st);
    }
    return { a: f(ans), ch: SH(out.map(f)) };
  }
  const Q = (q, ans, o) => Object.assign({ q }, NC(ans, o));
  /* bank answer + wrong answers drawn from a pool */
  function BC(q, ans, pool, n = 4) {
    const others = SH([...new Set(pool.map(String))].filter(x => x !== String(ans))).slice(0, n - 1);
    return { q, a: String(ans), ch: SH([String(ans), ...others]) };
  }
  /* fraction answer; wrong answers must have a different VALUE */
  function FQ(q, n, d, cands) {
    const val = n / d,
      seen = new Set([val.toFixed(9)]),
      out = [FR(n, d)];
    for (const [cn, cd] of SH(cands)) {
      if (out.length >= 4 || !cd || (cn < 0 && n >= 0)) continue;
      const v = (cn / cd).toFixed(9);
      if (seen.has(v)) continue;
      seen.add(v);
      out.push(FR(cn, cd));
    }
    for (let k = 1; out.length < 4 && k < 50; k++) {
      const v = ((n + k) / (d + k)).toFixed(9);
      if (!seen.has(v)) {
        seen.add(v);
        out.push(FR(n + k, d + k));
      }
    }
    return { q, a: FR(n, d), ch: SH(out) };
  }

  /* ------------------------------ BANKS ------------------------------ */
  const EMO = [
    '🍎',
    '🐶',
    '⭐',
    '🌸',
    '🚗',
    '🐟',
    '🎈',
    '🍪',
    '🦋',
    '⚽',
    '🐱',
    '🍌',
    '🌳',
    '🐸',
    '🍓',
    '🚀',
    '🐝',
    '🍩',
    '🦆',
    '🎁',
    '🐢',
    '🍇',
    '🐘',
    '🌙',
    '🧁',
    '🐰',
    '🍊',
    '🦊',
    '🐧',
    '🍉',
  ];
  const ITEMS = [
    'apples',
    'stickers',
    'marbles',
    'cookies',
    'books',
    'pencils',
    'crayons',
    'toy cars',
    'seashells',
    'balloons',
    'cupcakes',
    'baseball cards',
    'flowers',
    'coins',
    'blocks',
    'beads',
    'erasers',
    'oranges',
    'strawberries',
    'muffins',
    'buttons',
    'rocks',
    'stamps',
    'candles',
    'grapes',
    'markers',
    'puzzles',
    'fish',
    'bananas',
    'carrots',
  ];
  const NAMES = [
    'Maya',
    'Leo',
    'Ava',
    'Noah',
    'Zoe',
    'Eli',
    'Mia',
    'Omar',
    'Lily',
    'Sam',
    'Ruby',
    'Jay',
    'Nora',
    'Ben',
    'Ivy',
    'Max',
  ];
  const WORDS = `apple ant arrow animal airplane answer alligator anchor autumn adventure astronaut ankle
ball bear banana basket bridge butterfly button balloon blanket brother bicycle beautiful
cat cake candle castle camera circle carrot cookie country calendar chocolate curious
dog duck door dinosaur dragon dolphin desert diamond dentist daughter different dictionary
egg elephant engine eagle earth elbow envelope evening eleven exercise enormous equator
fish fox flower forest feather family finger farmer festival favorite furniture fountain
goat garden giraffe guitar grape gravity glove gentle garbage government grandmother galaxy
hat horse house honey hammer helmet holiday hospital history hamburger harvest hurricane
igloo insect island iron ice invent idea imagine important instrument interesting invitation
jar jam jelly jacket jungle jellyfish journey juice judge jewelry january jaguar
kite king kitten kangaroo kitchen kettle keyboard knight knee knowledge koala kayak
lion lamp lemon ladder leaf library lizard language laughter lightning lettuce luggage
moon mouse monkey mountain magnet mirror museum medicine machine mystery message muscle
nest nose needle napkin noodle nature necklace neighbor newspaper notebook nephew nutrition
owl orange ocean octopus onion oven orchestra oxygen opposite ostrich object observe
pig pen pizza pumpkin penguin pencil planet puzzle picture parachute potato president
queen quilt quiet quick question quarter quote quiz quality quantity
rabbit rain rocket river robot rainbow rectangle restaurant raccoon remember reptile recipe
sun sock snake spider sandwich scissors squirrel science shadow stomach strawberry skeleton
tree turtle tiger table tomato teacher telephone tornado treasure triangle thermometer tongue
umbrella uncle unicorn uniform universe unusual upstairs useful underground understand
van violin vase volcano village vegetable valley vacation vitamin visitor voyage vacuum
whale window wagon water winter wizard walrus weather whistle wonderful wheelchair watermelon
xylophone
yarn yellow yogurt young yard year yesterday yawn yolk youth
zebra zoo zero zipper zone zigzag zucchini`.split(/\s+/);
  const WSET = new Set(WORDS);
  const BYL = {};
  WORDS.forEach(w => (BYL[w[0]] = BYL[w[0]] || []).push(w));
  const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const RHYME = {
    at: 'cat hat bat mat rat sat',
    an: 'can fan man pan van ran',
    ig: 'big dig pig wig fig jig',
    op: 'hop mop top pop stop shop',
    ug: 'bug hug mug rug jug tug',
    en: 'hen pen ten men den',
    et: 'jet net pet wet vet get',
    in: 'pin tin fin win bin chin',
    ip: 'dip hip lip ship zip trip',
    ot: 'hot pot dot cot lot knot',
    ake: 'cake lake bake rake snake make',
    ing: 'king ring sing wing swing thing',
    ell: 'bell well shell yell smell spell',
    ick: 'kick sick brick stick chick pick',
    ain: 'rain train chain brain pain plain',
    ay: 'day play say hay tray gray',
    ight: 'night light fight right bright sight',
    ook: 'book cook look hook took brook',
    ock: 'rock sock clock lock block knock',
    un: 'sun fun run bun',
    ail: 'mail tail nail pail sail snail',
    own: 'crown brown down town clown gown',
    ee: 'bee tree see three free knee',
  };
  Object.keys(RHYME).forEach(k => (RHYME[k] = RHYME[k].split(' ')));
  const SYN = [
    ['happy', 'glad'],
    ['big', 'large'],
    ['small', 'tiny'],
    ['fast', 'quick'],
    ['begin', 'start'],
    ['end', 'finish'],
    ['smart', 'clever'],
    ['angry', 'mad'],
    ['scared', 'afraid'],
    ['shout', 'yell'],
    ['hard', 'difficult'],
    ['easy', 'simple'],
    ['pretty', 'beautiful'],
    ['sad', 'unhappy'],
    ['jump', 'leap'],
    ['near', 'close'],
    ['sick', 'ill'],
    ['gift', 'present'],
    ['rich', 'wealthy'],
    ['brave', 'courageous'],
    ['tired', 'sleepy'],
    ['huge', 'enormous'],
    ['fix', 'repair'],
    ['quiet', 'silent'],
    ['choose', 'select'],
    ['strange', 'odd'],
    ['correct', 'right'],
    ['cold', 'chilly'],
    ['wet', 'damp'],
    ['funny', 'humorous'],
    ['rude', 'impolite'],
    ['shy', 'timid'],
    ['story', 'tale'],
    ['buy', 'purchase'],
    ['help', 'assist'],
    ['ancient', 'old'],
    ['famous', 'well-known'],
    ['gather', 'collect'],
    ['polite', 'courteous'],
    ['vanish', 'disappear'],
    ['brief', 'short'],
    ['reply', 'answer'],
    ['grateful', 'thankful'],
    ['precise', 'exact'],
    ['abundant', 'plentiful'],
    ['candid', 'frank'],
    ['diligent', 'hardworking'],
    ['obstinate', 'stubborn'],
    ['benevolent', 'kind'],
    ['meticulous', 'careful'],
    ['ominous', 'threatening'],
    ['lethargic', 'sluggish'],
    ['ambiguous', 'unclear'],
    ['frugal', 'thrifty'],
    ['eloquent', 'well-spoken'],
    ['tenacious', 'persistent'],
    ['placid', 'calm'],
  ];
  const ANT = [
    ['hot', 'cold'],
    ['up', 'down'],
    ['big', 'small'],
    ['happy', 'sad'],
    ['fast', 'slow'],
    ['open', 'closed'],
    ['day', 'night'],
    ['wet', 'dry'],
    ['full', 'empty'],
    ['early', 'late'],
    ['loud', 'quiet'],
    ['hard', 'soft'],
    ['young', 'old'],
    ['win', 'lose'],
    ['push', 'pull'],
    ['give', 'take'],
    ['above', 'below'],
    ['before', 'after'],
    ['friend', 'enemy'],
    ['strong', 'weak'],
    ['rough', 'smooth'],
    ['arrive', 'depart'],
    ['true', 'false'],
    ['buy', 'sell'],
    ['ancient', 'modern'],
    ['brave', 'cowardly'],
    ['accept', 'refuse'],
    ['generous', 'selfish'],
    ['float', 'sink'],
    ['increase', 'decrease'],
    ['maximum', 'minimum'],
    ['expand', 'shrink'],
    ['victory', 'defeat'],
    ['rare', 'common'],
    ['include', 'exclude'],
    ['temporary', 'permanent'],
    ['optimistic', 'pessimistic'],
    ['scarce', 'plentiful'],
    ['transparent', 'opaque'],
    ['humble', 'arrogant'],
    ['praise', 'criticize'],
    ['reckless', 'cautious'],
    ['vague', 'specific'],
    ['novice', 'expert'],
    ['sharp', 'dull'],
    ['deep', 'shallow'],
  ];
  const POS = {
    noun: 'table elephant city teacher river pencil mountain window garden friend library ocean doctor bicycle castle island village planet kitchen blanket'.split(
      ' '
    ),
    verb: 'eat write arrive explain borrow forgive bring choose freeze grow teach speak steal forget destroy invent breathe sing sleep think'.split(
      ' '
    ),
    adjective:
      'happy tiny bright soft brave purple noisy gentle huge delicious clever fuzzy ancient careful lazy shiny polite heavy empty famous'.split(
        ' '
      ),
    adverb:
      'quickly slowly loudly quietly happily carefully often never soon always gently bravely softly politely suddenly rarely easily badly neatly calmly'.split(
        ' '
      ),
  };
  const PLURAL = {
    'add -s': [
      ['cat', 'cats'],
      ['dog', 'dogs'],
      ['book', 'books'],
      ['tree', 'trees'],
      ['car', 'cars'],
      ['girl', 'girls'],
      ['apple', 'apples'],
      ['hat', 'hats'],
    ],
    'add -es': [
      ['box', 'boxes'],
      ['bus', 'buses'],
      ['dish', 'dishes'],
      ['fox', 'foxes'],
      ['watch', 'watches'],
      ['glass', 'glasses'],
      ['bench', 'benches'],
      ['wish', 'wishes'],
    ],
    'y → ies': [
      ['baby', 'babies'],
      ['city', 'cities'],
      ['puppy', 'puppies'],
      ['story', 'stories'],
      ['berry', 'berries'],
      ['party', 'parties'],
      ['lady', 'ladies'],
      ['pony', 'ponies'],
    ],
    'f → ves': [
      ['leaf', 'leaves'],
      ['wolf', 'wolves'],
      ['knife', 'knives'],
      ['half', 'halves'],
      ['shelf', 'shelves'],
      ['loaf', 'loaves'],
      ['calf', 'calves'],
      ['life', 'lives'],
    ],
    irregular: [
      ['child', 'children'],
      ['mouse', 'mice'],
      ['man', 'men'],
      ['woman', 'women'],
      ['tooth', 'teeth'],
      ['foot', 'feet'],
      ['goose', 'geese'],
      ['ox', 'oxen'],
      ['sheep', 'sheep'],
      ['deer', 'deer'],
    ],
  };
  const CONTR = {
    'with not': [
      ['do not', "don't"],
      ['does not', "doesn't"],
      ['did not', "didn't"],
      ['is not', "isn't"],
      ['are not', "aren't"],
      ['was not', "wasn't"],
      ['were not', "weren't"],
      ['cannot', "can't"],
      ['could not', "couldn't"],
      ['would not', "wouldn't"],
      ['should not', "shouldn't"],
      ['will not', "won't"],
      ['have not', "haven't"],
      ['has not', "hasn't"],
    ],
    'with is': [
      ['he is', "he's"],
      ['she is', "she's"],
      ['it is', "it's"],
      ['that is', "that's"],
      ['there is', "there's"],
      ['what is', "what's"],
    ],
    'with will': [
      ['I will', "I'll"],
      ['you will', "you'll"],
      ['we will', "we'll"],
      ['they will', "they'll"],
      ['she will', "she'll"],
    ],
    'with are': [
      ['you are', "you're"],
      ['we are', "we're"],
      ['they are', "they're"],
    ],
    'with have': [
      ['I have', "I've"],
      ['you have', "you've"],
      ['we have', "we've"],
      ['they have', "they've"],
    ],
    'with would': [
      ['I would', "I'd"],
      ['you would', "you'd"],
      ['she would', "she'd"],
      ['we would', "we'd"],
    ],
    'with am / us': [
      ['I am', "I'm"],
      ['let us', "let's"],
    ],
  };
  const HOMO = [
    ['I can ___ the music.', 'hear', ['hear', 'here']],
    ['Come over ___.', 'here', ['hear', 'here']],
    ['The ___ is shining.', 'sun', ['sun', 'son']],
    ['Their ___ plays soccer.', 'son', ['sun', 'son']],
    ['I ate ___ cookies.', 'eight', ['eight', 'ate']],
    ['We ___ pizza last night.', 'ate', ['eight', 'ate']],
    ['The dog wagged its ___.', 'tail', ['tail', 'tale']],
    ['She read a fairy ___.', 'tale', ['tail', 'tale']],
    ['I ___ the answer.', 'know', ['know', 'no']],
    ['There is ___ milk left.', 'no', ['know', 'no']],
    ['___ going to the park.', "They're", ['Their', 'There', "They're"]],
    ['The kids forgot ___ coats.', 'their', ['their', 'there', "they're"]],
    ['Put the box over ___.', 'there', ['their', 'there', "they're"]],
    ['I want ___ go home.', 'to', ['to', 'too', 'two']],
    ['I have ___ dogs.', 'two', ['to', 'too', 'two']],
    ['Can I come ___?', 'too', ['to', 'too', 'two']],
    ['___ is your jacket?', 'Where', ['Where', 'Wear']],
    ['I will ___ my red hat.', 'wear', ['where', 'wear']],
    ['Please ___ me a letter.', 'write', ['write', 'right']],
    ['Turn ___ at the corner.', 'right', ['write', 'right']],
    ['The ___ is eating grass.', 'deer', ['deer', 'dear']],
    ["She wrote, '___ Grandma.'", 'Dear', ['Deer', 'Dear']],
    ['We saw a ___ in the woods.', 'bear', ['bear', 'bare']],
    ['He walked on the sand with ___ feet.', 'bare', ['bear', 'bare']],
    ['Which ___ is the library?', 'way', ['way', 'weigh']],
    ["Let's ___ the apples on the scale.", 'weigh', ['way', 'weigh']],
    ['The ship had a white ___.', 'sail', ['sail', 'sale']],
    ['The shoes are on ___ today.', 'sale', ['sail', 'sale']],
    ['The ___ flew over the clouds.', 'plane', ['plane', 'plain']],
    ['I like ___ yogurt.', 'plain', ['plane', 'plain']],
    ['___ dog is that?', 'Whose', ['Whose', "Who's"]],
    ['___ coming to the party?', "Who's", ['Whose', "Who's"]],
  ];
  const PREFIX = [
    ['un-', 'not', 'unhappy'],
    ['re-', 'again', 'replay'],
    ['pre-', 'before', 'preview'],
    ['mis-', 'wrongly', 'misspell'],
    ['sub-', 'under', 'submarine'],
    ['inter-', 'between', 'international'],
    ['super-', 'above or beyond', 'superhuman'],
    ['tri-', 'three', 'tricycle'],
    ['bi-', 'two', 'bicycle'],
    ['anti-', 'against', 'antifreeze'],
    ['auto-', 'self', 'autograph'],
    ['mid-', 'middle', 'midnight'],
    ['over-', 'too much', 'overcook'],
    ['post-', 'after', 'postgame'],
    ['semi-', 'half', 'semicircle'],
    ['trans-', 'across', 'transport'],
    ['micro-', 'very small', 'microscope'],
    ['multi-', 'many', 'multicolor'],
  ];
  const SUFFIX = [
    ['-ful', 'full of', 'hopeful'],
    ['-less', 'without', 'fearless'],
    ['-er', 'one who does', 'teacher'],
    ['-est', 'the most', 'tallest'],
    ['-ly', 'in a certain way', 'slowly'],
    ['-able', 'can be done', 'washable'],
    ['-ness', 'state of being', 'kindness'],
    ['-ment', 'the act or result of', 'movement'],
    ['-ology', 'the study of', 'biology'],
    ['-ish', 'somewhat like', 'childish'],
    ['-ward', 'in the direction of', 'homeward'],
    ['-ize', 'to make or become', 'modernize'],
  ];
  const VOCAB = {
    A: [
      ['ancient', 'very old'],
      ['brave', 'not afraid of danger'],
      ['curious', 'eager to learn or know'],
      ['enormous', 'extremely large'],
      ['fragile', 'easily broken'],
      ['hibernate', 'to sleep through the winter'],
      ['habitat', 'the natural home of an animal or plant'],
      ['predict', 'to say what will happen before it does'],
      ['observe', 'to watch carefully'],
      ['exhausted', 'very tired'],
      ['furious', 'very angry'],
      ['ordinary', 'normal or usual'],
      ['rapid', 'very fast'],
      ['vanish', 'to disappear suddenly'],
      ['scarce', 'hard to find; not enough'],
      ['nervous', 'worried or uneasy'],
      ['glimpse', 'a quick look'],
      ['cooperate', 'to work together'],
      ['gather', 'to bring together into one place'],
      ['generous', 'happy to give or share'],
      ['journey', 'a long trip'],
      ['wander', 'to walk around with no plan'],
      ['drowsy', 'sleepy'],
      ['confident', 'sure of yourself'],
      ['fierce', 'wild and dangerous'],
      ['invent', 'to create something new'],
    ],
    B: [
      ['abundant', 'more than enough; plentiful'],
      ['benevolent', 'kind and generous'],
      ['contradict', 'to say the opposite of'],
      ['deteriorate', 'to become worse over time'],
      ['eloquent', 'speaking clearly and persuasively'],
      ['feasible', 'possible to do'],
      ['hypothesis', 'an idea that can be tested'],
      ['inevitable', 'certain to happen'],
      ['meticulous', 'very careful about details'],
      ['novice', 'a beginner'],
      ['obsolete', 'no longer used; out of date'],
      ['persevere', 'to keep trying despite difficulty'],
      ['reluctant', 'unwilling'],
      ['skeptical', 'doubtful; not easily convinced'],
      ['tedious', 'long and boring'],
      ['vivid', 'bright and clear'],
      ['ambiguous', 'having more than one meaning'],
      ['concise', 'short and clear'],
      ['diligent', 'hard-working'],
      ['empathy', "understanding others' feelings"],
      ['frugal', 'careful with money'],
      ['hostile', 'unfriendly'],
      ['impartial', 'fair; not taking sides'],
      ['lenient', 'not strict'],
      ['mediocre', 'only average'],
      ['nostalgia', 'longing for the past'],
    ],
    C: [
      ['ubiquitous', 'found everywhere'],
      ['ephemeral', 'lasting a very short time'],
      ['pragmatic', 'practical; focused on results'],
      ['esoteric', 'understood by only a few'],
      ['cacophony', 'a harsh mix of sounds'],
      ['juxtapose', 'to place side by side for contrast'],
      ['laconic', 'using very few words'],
      ['magnanimous', 'generous in forgiving'],
      ['obfuscate', 'to make unclear'],
      ['paradigm', 'a framework or pattern of thinking'],
      ['quintessential', 'the most perfect example of something'],
      ['recalcitrant', 'stubbornly uncooperative'],
      ['sycophant', 'a person who flatters to gain favor'],
      ['tenuous', 'very weak or thin'],
      ['vindicate', 'to clear of blame'],
      ['wistful', 'sadly longing'],
      ['zealous', 'very enthusiastic'],
      ['anachronism', 'something out of its proper time'],
      ['benign', 'harmless'],
      ['capricious', 'likely to change suddenly'],
      ['didactic', 'meant to teach'],
      ['equivocate', 'to speak vaguely to avoid commitment'],
      ['fastidious', 'very attentive to detail'],
      ['gregarious', 'sociable; likes company'],
      ['hubris', 'excessive pride'],
      ['insidious', 'harmful in a slow, hidden way'],
      ['loquacious', 'very talkative'],
      ['mitigate', 'to make less severe'],
      ['serendipity', 'finding good things by chance'],
    ],
  };
  const DEVICES = {
    simile: [
      'Her smile was as bright as the sun.',
      'He ran like the wind.',
      'The baby slept like a log.',
      'Her eyes sparkled like diamonds.',
      'The water was as cold as ice.',
    ],
    metaphor: [
      'Time is a thief.',
      'The classroom was a zoo.',
      'Her voice is music to my ears.',
      'Life is a roller coaster.',
      'He is a shining star on the team.',
    ],
    personification: [
      'The wind whispered through the trees.',
      'The sun smiled down on us.',
      'The old car groaned up the hill.',
      'The flowers danced in the breeze.',
      'The stars winked at me.',
    ],
    hyperbole: [
      "I've told you a million times!",
      'My backpack weighs a ton.',
      "I'm so hungry I could eat a horse.",
      'I waited forever in that line.',
      'This is the best sandwich in the history of the universe.',
    ],
    alliteration: [
      'Sally sells seashells by the seashore.',
      'Big brown bears bounce balls.',
      'Silly snakes slither slowly.',
      'Fred found five fresh figs.',
      'Tiny Tim took two turtles.',
    ],
    onomatopoeia: [
      'Crash! The glass hit the floor.',
      'The snake hissed at the mouse.',
      'The clock went tick-tock.',
      'Sizzle went the bacon in the pan.',
      'The cow said moo.',
    ],
  };
  const ROOTS = [
    ['bio', 'life', 'biology'],
    ['geo', 'earth', 'geography'],
    ['graph', 'write', 'autograph'],
    ['photo', 'light', 'photograph'],
    ['tele', 'far', 'telescope'],
    ['phon', 'sound', 'telephone'],
    ['micro', 'small', 'microscope'],
    ['scope', 'see or look at', 'periscope'],
    ['chron', 'time', 'chronological'],
    ['therm', 'heat', 'thermometer'],
    ['aqua', 'water', 'aquarium'],
    ['port', 'carry', 'transport'],
    ['dict', 'say', 'predict'],
    ['rupt', 'break', 'erupt'],
    ['struct', 'build', 'construct'],
    ['ject', 'throw', 'eject'],
    ['tract', 'pull', 'tractor'],
    ['cred', 'believe', 'incredible'],
    ['mort', 'death', 'mortal'],
    ['astro', 'star', 'astronaut'],
    ['manu', 'hand', 'manual'],
    ['ped', 'foot', 'pedal'],
    ['voc', 'voice or call', 'vocal'],
    ['logy', 'study of', 'zoology'],
    ['anthrop', 'human', 'anthropology'],
    ['dem', 'people', 'democracy'],
  ];
  const PUNCT = [
    ['Where is my backpack', '?'],
    ['I like to read books', '.'],
    ['Watch out for that car', '!'],
    ['Do you want to play', '?'],
    ['The cat is sleeping', '.'],
    ['We won the game', '!'],
    ['What time is it', '?'],
    ['My sister is ten years old', '.'],
    ['Ouch, that hurts', '!'],
    ['Can we go to the park', '?'],
    ['The sky is blue today', '.'],
    ['Wow, look at that rainbow', '!'],
    ['How many apples are there', '?'],
    ['Dad made pancakes for breakfast', '.'],
    ['Hooray, school is out', '!'],
  ];
  const SVA_S = [
    ['The dog', 's'],
    ['My friend', 's'],
    ['The teacher', 's'],
    ['A bird', 's'],
    ['She', 's'],
    ['He', 's'],
    ['The baby', 's'],
    ['The dogs', 'p'],
    ['My friends', 'p'],
    ['The teachers', 'p'],
    ['Birds', 'p'],
    ['They', 'p'],
    ['We', 'p'],
    ['The kids', 'p'],
  ];
  const SVA_V = [
    ['run', 'runs', 'fast'],
    ['eat', 'eats', 'lunch at noon'],
    ['play', 'plays', 'outside'],
    ['sing', 'sings', 'every morning'],
    ['jump', 'jumps', 'over the puddle'],
    ['read', 'reads', 'before bed'],
    ['swim', 'swims', 'in the lake'],
    ['walk', 'walks', 'to school'],
    ['laugh', 'laughs', 'at the joke'],
    ['sleep', 'sleeps', 'all afternoon'],
    ['draw', 'draws', 'pictures'],
    ['bake', 'bakes', 'cookies'],
    ['climb', 'climbs', 'the tree'],
    ['watch', 'watches', 'the birds'],
    ['wash', 'washes', 'the dishes'],
    ['fix', 'fixes', 'the bike'],
    ['carry', 'carries', 'the box'],
    ['fly', 'flies', 'the kite'],
    ['go', 'goes', 'home'],
    ['do', 'does', 'homework'],
  ];

  const ANIMALS = {
    mammal:
      'dog cat whale dolphin bat elephant lion horse cow bear kangaroo rabbit monkey giraffe mouse'.split(
        ' '
      ),
    bird: 'eagle penguin owl ostrich parrot robin duck flamingo hawk chicken peacock hummingbird'.split(' '),
    reptile: [
      'snake',
      'lizard',
      'turtle',
      'crocodile',
      'alligator',
      'iguana',
      'gecko',
      'chameleon',
      'tortoise',
      'komodo dragon',
    ],
    amphibian: 'frog toad salamander newt axolotl'.split(' '),
    fish: 'shark salmon goldfish tuna clownfish trout seahorse stingray catfish'.split(' '),
    insect: 'ant bee butterfly beetle grasshopper ladybug dragonfly mosquito cricket moth'.split(' '),
  };
  const MATTER = {
    solid: [
      'rock',
      'ice cube',
      'book',
      'pencil',
      'chair',
      'coin',
      'apple',
      'brick',
      'spoon',
      'shoe',
      'crayon',
      'wooden block',
    ],
    liquid: [
      'water',
      'milk',
      'juice',
      'honey',
      'cooking oil',
      'rain',
      'lemonade',
      'vinegar',
      'syrup',
      'shampoo',
    ],
    gas: [
      'steam',
      'air',
      'oxygen',
      'helium',
      'carbon dioxide',
      'water vapor',
      'neon',
      'hydrogen',
      'nitrogen',
    ],
  };
  const LIVING = {
    living: [
      'tree',
      'dog',
      'mushroom',
      'grass',
      'bird',
      'frog',
      'flower',
      'butterfly',
      'fish',
      'worm',
      'cactus',
      'spider',
    ],
    nonliving: [
      'rock',
      'car',
      'cloud',
      'chair',
      'toy',
      'shoe',
      'pencil',
      'sand',
      'ice',
      'robot',
      'bicycle',
      'spoon',
    ],
  };
  const PLANETS = ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];
  const PFACTS = [
    ['is the largest planet', 'Jupiter'],
    ['is the smallest planet', 'Mercury'],
    ['is the hottest planet', 'Venus'],
    ['is known as the Red Planet', 'Mars'],
    ['is the planet we live on', 'Earth'],
    ['is the farthest planet from the Sun', 'Neptune'],
    ['is the closest planet to the Sun', 'Mercury'],
    ['spins on its side', 'Uranus'],
    ['is famous for its bright rings', 'Saturn'],
    ['has the Great Red Spot storm', 'Jupiter'],
    ['has Olympus Mons, the tallest volcano in the solar system', 'Mars'],
    ['is the only planet known to have life', 'Earth'],
  ];
  const ELEM = [
    [1, 'H', 'Hydrogen'],
    [2, 'He', 'Helium'],
    [3, 'Li', 'Lithium'],
    [4, 'Be', 'Beryllium'],
    [5, 'B', 'Boron'],
    [6, 'C', 'Carbon'],
    [7, 'N', 'Nitrogen'],
    [8, 'O', 'Oxygen'],
    [9, 'F', 'Fluorine'],
    [10, 'Ne', 'Neon'],
    [11, 'Na', 'Sodium'],
    [12, 'Mg', 'Magnesium'],
    [13, 'Al', 'Aluminum'],
    [14, 'Si', 'Silicon'],
    [15, 'P', 'Phosphorus'],
    [16, 'S', 'Sulfur'],
    [17, 'Cl', 'Chlorine'],
    [18, 'Ar', 'Argon'],
    [19, 'K', 'Potassium'],
    [20, 'Ca', 'Calcium'],
    [21, 'Sc', 'Scandium'],
    [22, 'Ti', 'Titanium'],
    [23, 'V', 'Vanadium'],
    [24, 'Cr', 'Chromium'],
    [25, 'Mn', 'Manganese'],
    [26, 'Fe', 'Iron'],
    [27, 'Co', 'Cobalt'],
    [28, 'Ni', 'Nickel'],
    [29, 'Cu', 'Copper'],
    [30, 'Zn', 'Zinc'],
    [31, 'Ga', 'Gallium'],
    [32, 'Ge', 'Germanium'],
    [33, 'As', 'Arsenic'],
    [34, 'Se', 'Selenium'],
    [35, 'Br', 'Bromine'],
    [36, 'Kr', 'Krypton'],
    [47, 'Ag', 'Silver'],
    [50, 'Sn', 'Tin'],
    [53, 'I', 'Iodine'],
    [54, 'Xe', 'Xenon'],
    [79, 'Au', 'Gold'],
    [80, 'Hg', 'Mercury'],
    [82, 'Pb', 'Lead'],
    [92, 'U', 'Uranium'],
  ];
  const ISO = [
    ['Hydrogen', 1, 1],
    ['Helium', 2, 4],
    ['Lithium', 3, 7],
    ['Beryllium', 4, 9],
    ['Boron', 5, 11],
    ['Carbon', 6, 12],
    ['Nitrogen', 7, 14],
    ['Oxygen', 8, 16],
    ['Fluorine', 9, 19],
    ['Neon', 10, 20],
    ['Sodium', 11, 23],
    ['Magnesium', 12, 24],
    ['Aluminum', 13, 27],
    ['Silicon', 14, 28],
    ['Phosphorus', 15, 31],
    ['Sulfur', 16, 32],
    ['Chlorine', 17, 35],
    ['Argon', 18, 40],
    ['Potassium', 19, 39],
    ['Calcium', 20, 40],
    ['Iron', 26, 56],
    ['Copper', 29, 63],
    ['Zinc', 30, 64],
    ['Silver', 47, 107],
    ['Iodine', 53, 127],
    ['Gold', 79, 197],
    ['Lead', 82, 208],
    ['Uranium', 92, 238],
  ];
  const BODY = [
    ['heart', 'pumps blood through the body', 'circulatory'],
    ['lungs', 'take in oxygen when you breathe', 'respiratory'],
    ['brain', 'controls the body and your thinking', 'nervous'],
    ['stomach', 'breaks down food with acid', 'digestive'],
    ['skin', 'covers and protects the body from germs', 'integumentary'],
    ['kidneys', 'filter waste out of the blood', 'urinary'],
    ['bones', 'support the body and protect organs', 'skeletal'],
    ['muscles', 'pull on bones so the body can move', 'muscular'],
    ['small intestine', 'absorbs nutrients from food', 'digestive'],
    ['liver', 'cleans the blood and makes bile', 'digestive'],
    ['eyes', 'sense light so you can see', 'nervous'],
    ['large intestine', 'absorbs water from leftover food', 'digestive'],
    ['spinal cord', 'carries messages between the brain and body', 'nervous'],
    ['blood vessels', 'carry blood to every part of the body', 'circulatory'],
  ];
  const CELL = [
    ['nucleus', 'controls the cell and holds its DNA'],
    ['mitochondria', "releases energy from food (the cell's powerhouse)"],
    ['cell membrane', 'controls what enters and leaves the cell'],
    ['cell wall', 'gives plant cells a stiff, rigid shape'],
    ['chloroplast', 'makes food using sunlight'],
    ['ribosome', 'makes proteins'],
    ['vacuole', 'stores water and nutrients'],
    ['cytoplasm', 'jelly-like fluid that holds the organelles'],
    ['Golgi apparatus', 'packages and ships proteins'],
    ['endoplasmic reticulum', 'transports materials inside the cell'],
    ['lysosome', 'breaks down waste and worn-out parts'],
  ];
  const MACHINES = {
    lever: ['a seesaw', 'a crowbar', 'a bottle opener'],
    pulley: ['a flagpole rope', 'window blinds', 'a well bucket rope'],
    'wheel and axle': ['a doorknob', 'a steering wheel', 'a rolling pin'],
    'inclined plane': ['a wheelchair ramp', 'a playground slide', 'a sloped driveway'],
    wedge: ['an axe', 'a knife', 'a doorstop'],
    screw: ['a jar lid', 'a light bulb base', 'a bolt'],
  };
  const FOODCHAIN = {
    producer: ['grass', 'an oak tree', 'algae', 'a sunflower', 'seaweed', 'a cactus'],
    herbivore: ['a rabbit', 'a deer', 'a cow', 'a caterpillar', 'a grasshopper', 'a zebra'],
    carnivore: ['a lion', 'a wolf', 'a shark', 'an eagle', 'a snake', 'a tiger'],
    omnivore: ['a bear', 'a raccoon', 'a pig', 'a chicken', 'a human'],
    decomposer: ['a mushroom', 'bacteria', 'an earthworm', 'mold'],
  };
  const ROCKS = {
    igneous: ['granite', 'basalt', 'obsidian', 'pumice'],
    sedimentary: ['sandstone', 'limestone', 'shale', 'conglomerate'],
    metamorphic: ['marble', 'slate', 'quartzite', 'gneiss'],
  };
  const ROCKHOW = {
    igneous: 'forms when melted rock (magma or lava) cools',
    sedimentary: 'forms when layers of sediment are pressed together',
    metamorphic: 'forms when rock is changed by heat and pressure',
  };
  const EARTHSCI = [
    ['The process where liquid water turns into water vapor', 'evaporation'],
    ['The process where water vapor cools into tiny droplets', 'condensation'],
    ['Water falling from clouds as rain, snow, sleet, or hail', 'precipitation'],
    ['Water gathering in oceans, lakes, and rivers', 'collection'],
    ['The tool that measures temperature', 'thermometer'],
    ['The tool that measures air pressure', 'barometer'],
    ['The tool that measures wind speed', 'anemometer'],
    ['The tool that measures rainfall', 'rain gauge'],
    ['The tool that shows wind direction', 'wind vane'],
    ['The thin, outer layer of Earth we live on', 'crust'],
    ['The thickest layer of Earth, made of hot flowing rock', 'mantle'],
    ['The layer of Earth made of liquid iron and nickel', 'outer core'],
    ['The solid metal center of Earth', 'inner core'],
    ['A huge slab of Earth’s crust that slowly moves', 'tectonic plate'],
    ['The shaking of the ground caused by moving plates', 'earthquake'],
  ];
  const STATES = [
    ['Alabama', 'Montgomery'],
    ['Alaska', 'Juneau'],
    ['Arizona', 'Phoenix'],
    ['Arkansas', 'Little Rock'],
    ['California', 'Sacramento'],
    ['Colorado', 'Denver'],
    ['Connecticut', 'Hartford'],
    ['Delaware', 'Dover'],
    ['Florida', 'Tallahassee'],
    ['Georgia', 'Atlanta'],
    ['Hawaii', 'Honolulu'],
    ['Idaho', 'Boise'],
    ['Illinois', 'Springfield'],
    ['Indiana', 'Indianapolis'],
    ['Iowa', 'Des Moines'],
    ['Kansas', 'Topeka'],
    ['Kentucky', 'Frankfort'],
    ['Louisiana', 'Baton Rouge'],
    ['Maine', 'Augusta'],
    ['Maryland', 'Annapolis'],
    ['Massachusetts', 'Boston'],
    ['Michigan', 'Lansing'],
    ['Minnesota', 'Saint Paul'],
    ['Mississippi', 'Jackson'],
    ['Missouri', 'Jefferson City'],
    ['Montana', 'Helena'],
    ['Nebraska', 'Lincoln'],
    ['Nevada', 'Carson City'],
    ['New Hampshire', 'Concord'],
    ['New Jersey', 'Trenton'],
    ['New Mexico', 'Santa Fe'],
    ['New York', 'Albany'],
    ['North Carolina', 'Raleigh'],
    ['North Dakota', 'Bismarck'],
    ['Ohio', 'Columbus'],
    ['Oklahoma', 'Oklahoma City'],
    ['Oregon', 'Salem'],
    ['Pennsylvania', 'Harrisburg'],
    ['Rhode Island', 'Providence'],
    ['South Carolina', 'Columbia'],
    ['South Dakota', 'Pierre'],
    ['Tennessee', 'Nashville'],
    ['Texas', 'Austin'],
    ['Utah', 'Salt Lake City'],
    ['Vermont', 'Montpelier'],
    ['Virginia', 'Richmond'],
    ['Washington', 'Olympia'],
    ['West Virginia', 'Charleston'],
    ['Wisconsin', 'Madison'],
    ['Wyoming', 'Cheyenne'],
  ];
  const COUNTRIES = [
    ['United States', 'Washington, D.C.', 'North America'],
    ['Canada', 'Ottawa', 'North America'],
    ['Mexico', 'Mexico City', 'North America'],
    ['Cuba', 'Havana', 'North America'],
    ['Jamaica', 'Kingston', 'North America'],
    ['Guatemala', 'Guatemala City', 'North America'],
    ['Costa Rica', 'San José', 'North America'],
    ['Panama', 'Panama City', 'North America'],
    ['Haiti', 'Port-au-Prince', 'North America'],
    ['Honduras', 'Tegucigalpa', 'North America'],
    ['Dominican Republic', 'Santo Domingo', 'North America'],
    ['Bahamas', 'Nassau', 'North America'],
    ['Brazil', 'Brasília', 'South America'],
    ['Argentina', 'Buenos Aires', 'South America'],
    ['Chile', 'Santiago', 'South America'],
    ['Peru', 'Lima', 'South America'],
    ['Colombia', 'Bogotá', 'South America'],
    ['Venezuela', 'Caracas', 'South America'],
    ['Ecuador', 'Quito', 'South America'],
    ['Uruguay', 'Montevideo', 'South America'],
    ['Paraguay', 'Asunción', 'South America'],
    ['Guyana', 'Georgetown', 'South America'],
    ['United Kingdom', 'London', 'Europe'],
    ['France', 'Paris', 'Europe'],
    ['Germany', 'Berlin', 'Europe'],
    ['Italy', 'Rome', 'Europe'],
    ['Spain', 'Madrid', 'Europe'],
    ['Portugal', 'Lisbon', 'Europe'],
    ['Netherlands', 'Amsterdam', 'Europe'],
    ['Belgium', 'Brussels', 'Europe'],
    ['Switzerland', 'Bern', 'Europe'],
    ['Austria', 'Vienna', 'Europe'],
    ['Sweden', 'Stockholm', 'Europe'],
    ['Norway', 'Oslo', 'Europe'],
    ['Denmark', 'Copenhagen', 'Europe'],
    ['Finland', 'Helsinki', 'Europe'],
    ['Poland', 'Warsaw', 'Europe'],
    ['Ireland', 'Dublin', 'Europe'],
    ['Greece', 'Athens', 'Europe'],
    ['Hungary', 'Budapest', 'Europe'],
    ['Czech Republic', 'Prague', 'Europe'],
    ['Ukraine', 'Kyiv', 'Europe'],
    ['Romania', 'Bucharest', 'Europe'],
    ['Iceland', 'Reykjavík', 'Europe'],
    ['Croatia', 'Zagreb', 'Europe'],
    ['Serbia', 'Belgrade', 'Europe'],
    ['Bulgaria', 'Sofia', 'Europe'],
    ['China', 'Beijing', 'Asia'],
    ['Japan', 'Tokyo', 'Asia'],
    ['India', 'New Delhi', 'Asia'],
    ['South Korea', 'Seoul', 'Asia'],
    ['Thailand', 'Bangkok', 'Asia'],
    ['Vietnam', 'Hanoi', 'Asia'],
    ['Philippines', 'Manila', 'Asia'],
    ['Pakistan', 'Islamabad', 'Asia'],
    ['Bangladesh', 'Dhaka', 'Asia'],
    ['Saudi Arabia', 'Riyadh', 'Asia'],
    ['Iran', 'Tehran', 'Asia'],
    ['Iraq', 'Baghdad', 'Asia'],
    ['Nepal', 'Kathmandu', 'Asia'],
    ['Malaysia', 'Kuala Lumpur', 'Asia'],
    ['Mongolia', 'Ulaanbaatar', 'Asia'],
    ['Afghanistan', 'Kabul', 'Asia'],
    ['Qatar', 'Doha', 'Asia'],
    ['United Arab Emirates', 'Abu Dhabi', 'Asia'],
    ['Jordan', 'Amman', 'Asia'],
    ['Syria', 'Damascus', 'Asia'],
    ['Kazakhstan', 'Astana', 'Asia'],
    ['Egypt', 'Cairo', 'Africa'],
    ['Nigeria', 'Abuja', 'Africa'],
    ['Kenya', 'Nairobi', 'Africa'],
    ['Ethiopia', 'Addis Ababa', 'Africa'],
    ['Morocco', 'Rabat', 'Africa'],
    ['Ghana', 'Accra', 'Africa'],
    ['Algeria', 'Algiers', 'Africa'],
    ['Tanzania', 'Dodoma', 'Africa'],
    ['Uganda', 'Kampala', 'Africa'],
    ['Senegal', 'Dakar', 'Africa'],
    ['Zimbabwe', 'Harare', 'Africa'],
    ['Tunisia', 'Tunis', 'Africa'],
    ['Libya', 'Tripoli', 'Africa'],
    ['Madagascar', 'Antananarivo', 'Africa'],
    ['Angola', 'Luanda', 'Africa'],
    ['Cameroon', 'Yaoundé', 'Africa'],
    ['Zambia', 'Lusaka', 'Africa'],
    ['Rwanda', 'Kigali', 'Africa'],
    ['Somalia', 'Mogadishu', 'Africa'],
    ['Mali', 'Bamako', 'Africa'],
    ['Australia', 'Canberra', 'Oceania'],
    ['New Zealand', 'Wellington', 'Oceania'],
    ['Fiji', 'Suva', 'Oceania'],
    ['Papua New Guinea', 'Port Moresby', 'Oceania'],
    ['Samoa', 'Apia', 'Oceania'],
    ['Tonga', 'Nukuʻalofa', 'Oceania'],
  ];
  const CONTINENTS = ['North America', 'South America', 'Europe', 'Asia', 'Africa', 'Oceania'];
  const PRES = [
    'George Washington',
    'John Adams',
    'Thomas Jefferson',
    'James Madison',
    'James Monroe',
    'John Quincy Adams',
    'Andrew Jackson',
    'Martin Van Buren',
    'William Henry Harrison',
    'John Tyler',
    'James K. Polk',
    'Zachary Taylor',
    'Millard Fillmore',
    'Franklin Pierce',
    'James Buchanan',
    'Abraham Lincoln',
    'Andrew Johnson',
    'Ulysses S. Grant',
    'Rutherford B. Hayes',
    'James A. Garfield',
    'Chester A. Arthur',
    'Grover Cleveland',
    'Benjamin Harrison',
    'Grover Cleveland',
    'William McKinley',
    'Theodore Roosevelt',
    'William Howard Taft',
    'Woodrow Wilson',
    'Warren G. Harding',
    'Calvin Coolidge',
    'Herbert Hoover',
    'Franklin D. Roosevelt',
    'Harry S. Truman',
    'Dwight D. Eisenhower',
    'John F. Kennedy',
    'Lyndon B. Johnson',
    'Richard Nixon',
    'Gerald Ford',
    'Jimmy Carter',
    'Ronald Reagan',
    'George H. W. Bush',
    'Bill Clinton',
    'George W. Bush',
    'Barack Obama',
    'Donald Trump',
    'Joe Biden',
    'Donald Trump',
  ];
  const EVENTS = [
    ['The Western Roman Empire falls', 476],
    ['The Battle of Hastings', 1066],
    ['The Magna Carta is signed', 1215],
    ['Columbus reaches the Americas', 1492],
    ['Jamestown is founded', 1607],
    ['The Mayflower lands at Plymouth', 1620],
    ['The Declaration of Independence is signed', 1776],
    ['The U.S. Constitution is written', 1787],
    ['The French Revolution begins', 1789],
    ['The Louisiana Purchase', 1803],
    ['Lewis and Clark begin their expedition', 1804],
    ['The War of 1812 begins', 1812],
    ['The U.S. Civil War begins', 1861],
    ['The Emancipation Proclamation', 1863],
    ['The U.S. Civil War ends', 1865],
    ['The Transcontinental Railroad is completed', 1869],
    ['The Wright brothers make the first powered flight', 1903],
    ['The Titanic sinks', 1912],
    ['World War I begins', 1914],
    ['The Treaty of Versailles is signed', 1919],
    ['The 19th Amendment gives women the right to vote', 1920],
    ['The stock market crashes, starting the Great Depression', 1929],
    ['Pearl Harbor is attacked', 1941],
    ['World War II ends', 1945],
    ['Brown v. Board of Education', 1954],
    ['The Montgomery Bus Boycott begins', 1955],
    ['Sputnik is launched', 1957],
    ['The March on Washington', 1963],
    ['The Civil Rights Act is signed', 1964],
    ['Apollo 11 lands on the Moon', 1969],
    ['The Berlin Wall falls', 1989],
    ['The Soviet Union breaks apart', 1991],
    ['The September 11 attacks', 2001],
    ['The first iPhone is released', 2007],
  ];
  const CIVICS = [
    ['How many branches does the U.S. government have?', '3', ['2', '3', '4', '5']],
    ['Which branch makes the laws?', 'Legislative', ['Executive', 'Judicial', 'Legislative', 'Military']],
    [
      'Which branch carries out and enforces laws?',
      'Executive',
      ['Executive', 'Judicial', 'Legislative', 'Military'],
    ],
    [
      'Which branch decides what laws mean?',
      'Judicial',
      ['Executive', 'Judicial', 'Legislative', 'Military'],
    ],
    [
      'Who leads the executive branch?',
      'The President',
      ['The Chief Justice', 'The Speaker of the House', 'The President', 'A governor'],
    ],
    ['How many U.S. senators are there?', '100', ['50', '100', '435', '535']],
    ['How many voting members are in the House of Representatives?', '435', ['100', '270', '435', '535']],
    ['How long is a U.S. president’s term?', '4 years', ['2 years', '4 years', '6 years', '8 years']],
    ['How long is a U.S. senator’s term?', '6 years', ['2 years', '4 years', '6 years', '8 years']],
    ['How long is a U.S. representative’s term?', '2 years', ['2 years', '4 years', '6 years', '8 years']],
    ['How many justices sit on the Supreme Court?', '9', ['7', '9', '11', '12']],
    [
      'What are the first ten amendments called?',
      'The Bill of Rights',
      ['The Bill of Rights', 'The Preamble', 'The Articles', 'The Federalist Papers'],
    ],
    ['Which amendment protects freedom of speech?', 'First', ['First', 'Second', 'Fifth', 'Tenth']],
    ['Which amendment ended slavery?', 'Thirteenth', ['Tenth', 'Thirteenth', 'Fifteenth', 'Nineteenth']],
    [
      'Which amendment gave women the right to vote?',
      'Nineteenth',
      ['Fifteenth', 'Seventeenth', 'Nineteenth', 'Twenty-sixth'],
    ],
    [
      'Which amendment lowered the voting age to 18?',
      'Twenty-sixth',
      ['Nineteenth', 'Twenty-first', 'Twenty-second', 'Twenty-sixth'],
    ],
    [
      'What is the supreme law of the land?',
      'The Constitution',
      [
        'The Declaration of Independence',
        'The Constitution',
        'The Bill of Rights',
        'The Articles of Confederation',
      ],
    ],
    [
      'Who wrote most of the Declaration of Independence?',
      'Thomas Jefferson',
      ['George Washington', 'Benjamin Franklin', 'Thomas Jefferson', 'John Adams'],
    ],
    [
      'Who is called the “Father of the Constitution”?',
      'James Madison',
      ['James Madison', 'Thomas Jefferson', 'Alexander Hamilton', 'John Jay'],
    ],
    [
      'Who was the first U.S. President?',
      'George Washington',
      ['John Adams', 'George Washington', 'Thomas Jefferson', 'Benjamin Franklin'],
    ],
    [
      'What stops one branch from becoming too powerful?',
      'Checks and balances',
      ['Checks and balances', 'Taxes', 'Elections only', 'The military'],
    ],
    ['How many states are in the United States?', '50', ['48', '50', '52', '13']],
    [
      'What is the capital of the United States?',
      'Washington, D.C.',
      ['New York City', 'Philadelphia', 'Washington, D.C.', 'Boston'],
    ],
    ['What is the minimum age to be President?', '35', ['18', '25', '30', '35']],
    [
      'Who is Commander in Chief of the military?',
      'The President',
      ['The President', 'The Secretary of Defense', 'A general', 'The Vice President'],
    ],
    [
      'What was the first U.S. plan of government, before the Constitution?',
      'The Articles of Confederation',
      ['The Articles of Confederation', 'The Mayflower Compact', 'The Magna Carta', 'The Bill of Rights'],
    ],
  ];
  const HELPERS = [
    ['Who puts out fires?', 'firefighter'],
    ['Who delivers the mail?', 'mail carrier'],
    ['Who helps sick people get better?', 'doctor'],
    ['Who teaches students at school?', 'teacher'],
    ['Who keeps people safe and enforces laws?', 'police officer'],
    ['Who cleans and fixes teeth?', 'dentist'],
    ['Who takes care of sick animals?', 'veterinarian'],
    ['Who grows food on a farm?', 'farmer'],
    ['Who bakes bread and cakes?', 'baker'],
    ['Who flies airplanes?', 'pilot'],
    ['Who fixes leaky pipes?', 'plumber'],
    ['Who helps you find books?', 'librarian'],
  ];
  const NEEDS = {
    need: ['food', 'water', 'a place to live', 'warm clothes', 'medicine when sick'],
    want: [
      'a video game',
      'candy',
      'a toy car',
      'a new phone',
      'a trip to an amusement park',
      'jewelry',
      'movie tickets',
      'soda',
    ],
  };
  const ECON = [
    ['supply', 'the amount of a product that is available'],
    ['demand', 'how much of a product people want to buy'],
    ['inflation', 'a general rise in prices over time'],
    ['interest', 'the cost of borrowing money'],
    ['budget', 'a plan for spending and saving money'],
    ['profit', 'money left over after paying costs'],
    ['stock', 'a share of ownership in a company'],
    ['dividend', 'part of a company’s profit paid to shareholders'],
    ['bond', 'a loan you make to a company or government'],
    ['diversification', 'spreading money across many investments'],
    ['tax', 'money collected by the government'],
    ['entrepreneur', 'a person who starts a business'],
    ['scarcity', 'limited resources but unlimited wants'],
    ['opportunity cost', 'the value of the next best choice you give up'],
    ['GDP', 'the total value of goods and services a country produces'],
    ['bull market', 'a market where prices are rising'],
    ['bear market', 'a market where prices are falling'],
    ['credit score', 'a number showing how reliably you repay debt'],
    ['recession', 'a period when the economy shrinks'],
  ];
  const CANDLE = [
    ['A green (bullish) candle means the price…', 'closed higher than it opened'],
    ['A red (bearish) candle means the price…', 'closed lower than it opened'],
    ['The top of the upper wick shows…', 'the highest price'],
    ['The bottom of the lower wick shows…', 'the lowest price'],
    ['A doji candle has…', 'an open and close that are almost equal'],
    ['A hammer candle has…', 'a small body and a long lower wick'],
    ['A shooting star candle has…', 'a small body and a long upper wick'],
    ['A bullish engulfing pattern is…', 'a big green body that covers the previous red body'],
    ['“Three white soldiers” are…', 'three strong green candles in a row'],
    ['“Three black crows” are…', 'three strong red candles in a row'],
    ['Support is…', 'a price level where buyers tend to step in'],
    ['Resistance is…', 'a price level where sellers tend to step in'],
    ['Volume measures…', 'how many shares were traded'],
    ['A stop-loss is…', 'an order that sells if the price falls to a set level'],
    ['The candle body shows…', 'the distance between the open and the close'],
  ];
  const SHOP = [
    'a sandwich',
    'a toy',
    'a book',
    'a hat',
    'a snack',
    'a notebook',
    'a ball',
    'a puzzle',
    'a comic',
    'a plant',
    'a lunchbox',
    'a T-shirt',
    'a scarf',
    'a mug',
    'a game',
    'a kite',
    'a backpack',
    'a water bottle',
    'a flashlight',
    'a poster',
  ];

  /* ------------------------------ FAMILIES ------------------------------ */
  const FAMS = [];
  const fam = o => FAMS.push(o);
  const pick3 = (arr, n) => SH(arr).slice(0, n);

  /* ---------- MATH ---------- */
  fam({
    id: 'count',
    s: 'Math',
    n: 'Counting',
    g: [0, 1],
    foc: () => EMO.map(e => ({ l: e, e })),
    tip: 'Touch each object one at a time and say the next number. The last number you say tells how many there are.',
    gen: (f, lv) => {
      const n = R(1, 3 + lv * 2);
      return Q(`How many ${f.e} do you see?<div class="ed-emo">${f.e.repeat(n)}</div>`, n, { min: 0 });
    },
  });

  fam({
    id: 'next',
    s: 'Math',
    n: 'Number Order',
    g: [0, 2],
    foc: g => {
      const w = g === 0 ? 10 : 100,
        o = [];
      for (const k of ['after', 'before', 'between'])
        for (let s = 0; s < w * 10; s += w) o.push({ l: `${k} (${s}–${s + w})`, k, s, w });
      return o;
    },
    tip: 'Numbers go in order. “After” means one more, “before” means one less.',
    gen: (f, lv) => {
      const d = lv <= 4 ? 1 : lv <= 7 ? 2 : lv <= 9 ? 5 : 10;
      const n = R(f.s + d, f.s + f.w - 1);
      if (f.k === 'after')
        return Q(
          d === 1
            ? `What number comes right after <b>${n}</b>?`
            : `What number is <b>${d} more</b> than ${n}?`,
          n + d,
          { min: 0 }
        );
      if (f.k === 'before')
        return Q(
          d === 1
            ? `What number comes right before <b>${n}</b>?`
            : `What number is <b>${d} less</b> than ${n}?`,
          n - d,
          { min: 0 }
        );
      return Q(`What number is exactly halfway between <b>${n - d}</b> and <b>${n + d}</b>?`, n, { min: 0 });
    },
  });

  fam({
    id: 'cmp',
    s: 'Math',
    n: 'Comparing Numbers',
    g: [0, 4],
    foc: g => {
      const M = [20, 100, 1000, 1000, 100000][g],
        W = M / 10,
        o = [];
      for (const k of ['greatest', 'least'])
        for (let i = 0; i < 10; i++)
          o.push({
            l: `${k} (${FN(i * W)}–${FN(i * W + Math.max(W, 10))})`,
            k,
            lo: i * W,
            hi: i * W + Math.max(W, 10),
          });
      return o;
    },
    tip: 'Compare the biggest place first. The number with more hundreds (or tens) is bigger.',
    gen: (f, lv) => {
      const span = f.hi - f.lo,
        sp = Math.max(4, Math.round((span * (11 - lv)) / 10));
      const b = R(f.lo, f.hi - sp);
      const s = new Set();
      while (s.size < 4) s.add(R(b, b + sp));
      const a = [...s];
      const ans = f.k === 'greatest' ? Math.max(...a) : Math.min(...a);
      return { q: `Which number is the <b>${f.k}</b>?`, a: FN(ans), ch: SH(a.map(FN)) };
    },
  });

  fam({
    id: 'add',
    s: 'Math',
    n: 'Addition Facts',
    g: [0, 4],
    foc: () => range(0, 20).map(k => ({ l: `Adding ${k}`, k })),
    tip: 'Start with the bigger number and count on. 8 + 3 → 9, 10, 11.',
    gen: (f, lv, g) => {
      const m = [3, 5, 7, 10, 10, 12, 15, 20, 25, 30][lv - 1] * (g >= 3 ? 10 : g >= 2 ? 4 : g >= 1 ? 2 : 1);
      const b = R(0, m);
      return Q(Math.random() < 0.5 ? `${f.k} + ${b} = ?` : `${b} + ${f.k} = ?`, f.k + b, { min: 0 });
    },
  });
  fam({
    id: 'sub',
    s: 'Math',
    n: 'Subtraction Facts',
    g: [0, 4],
    foc: () => range(0, 20).map(k => ({ l: `Subtracting ${k}`, k })),
    tip: 'Subtraction takes away. Count back, or think: what plus this number makes the total?',
    gen: (f, lv, g) => {
      const m = [3, 5, 7, 10, 10, 12, 15, 20, 25, 30][lv - 1] * (g >= 3 ? 10 : g >= 2 ? 4 : g >= 1 ? 2 : 1);
      const a = f.k + R(0, m);
      return Q(`${a} − ${f.k} = ?`, a - f.k, { min: 0 });
    },
  });
  fam({
    id: 'mul',
    s: 'Math',
    n: 'Multiplication Facts',
    g: [2, 6],
    foc: () => range(0, 20).map(k => ({ l: `Multiplying by ${k}`, k })),
    tip: 'Multiplying is repeated adding: 4 × 3 means 3 + 3 + 3 + 3.',
    gen: (f, lv) => {
      const b = R(0, [5, 5, 10, 10, 12, 12, 15, 20, 25, 50][lv - 1]);
      return Q(Math.random() < 0.5 ? `${f.k} × ${b} = ?` : `${b} × ${f.k} = ?`, f.k * b, {
        min: 0,
        extra: [f.k + b],
      });
    },
  });
  fam({
    id: 'div',
    s: 'Math',
    n: 'Division Facts',
    g: [3, 6],
    foc: () => range(1, 20).map(k => ({ l: `Dividing by ${k}`, k })),
    tip: 'Division undoes multiplication. 24 ÷ 6 asks: 6 times what equals 24?',
    gen: (f, lv) => {
      const q = R(0, [5, 5, 10, 10, 12, 12, 15, 20, 25, 50][lv - 1]);
      return Q(`${f.k * q} ÷ ${f.k} = ?`, q, { min: 0 });
    },
  });

  const digits = d => R(10 ** (d - 1), 10 ** d - 1);
  function noCarry(da, db, sub) {
    // numbers with no regrouping in any column
    let a = '',
      b = '';
    for (let i = 0; i < da; i++) {
      const first = i === 0;
      if (i < da - db) {
        a += R(first ? 1 : 0, 9);
        continue;
      }
      const j = i - (da - db),
        fb = j === 0;
      if (sub) {
        const x = R(first ? 1 : 0, 9);
        a += x;
        b += R(fb ? Math.min(1, x) : 0, x);
      } else {
        const y = R(fb ? 1 : 0, first ? 8 : 9);
        b += y;
        a += R(first ? 1 : 0, Math.max(first ? 1 : 0, 9 - y));
      }
    }
    return [+a, +b];
  }
  const ADDPAT = [
    [2, 1],
    [2, 2],
    [3, 1],
    [3, 2],
    [3, 3],
    [4, 2],
    [4, 3],
    [4, 4],
    [5, 4],
    [5, 5],
    [6, 5],
    [6, 6],
  ];
  fam({
    id: 'addm',
    s: 'Math',
    n: 'Multi-Digit Addition',
    g: [1, 5],
    foc: g =>
      ADDPAT.filter(p => p[0] <= [0, 2, 3, 4, 6, 6][g]).map(p => ({ l: `${p[0]}-digit + ${p[1]}-digit`, p })),
    tip: 'Line up the places. Add the ones first; if you get 10 or more, carry 1 to the tens.',
    gen: (f, lv) => {
      let [a, b] = lv <= 3 ? noCarry(f.p[0], f.p[1], false) : [digits(f.p[0]), digits(f.p[1])];
      return Q(`${FN(a)} + ${FN(b)} = ?`, a + b, {
        min: 0,
        step: 1,
        extra: [a + b + 10, a + b - 10, a + b + 100],
      });
    },
  });
  fam({
    id: 'subm',
    s: 'Math',
    n: 'Multi-Digit Subtraction',
    g: [1, 5],
    foc: g =>
      ADDPAT.filter(p => p[0] <= [0, 2, 3, 4, 6, 6][g]).map(p => ({ l: `${p[0]}-digit − ${p[1]}-digit`, p })),
    tip: 'Line up the places. If the top digit is smaller, borrow 10 from the next place.',
    gen: (f, lv) => {
      let [a, b] = lv <= 3 ? noCarry(f.p[0], f.p[1], true) : [digits(f.p[0]), digits(f.p[1])];
      if (b > a) [a, b] = [b, a];
      return Q(`${FN(a)} − ${FN(b)} = ?`, a - b, { min: 0, extra: [a - b + 10, a - b - 10, a - b + 100] });
    },
  });
  const MULPAT = [
    [2, 1],
    [3, 1],
    [4, 1],
    [2, 2],
    [3, 2],
    [4, 2],
    [3, 3],
  ];
  fam({
    id: 'mulm',
    s: 'Math',
    n: 'Multi-Digit Multiplication',
    g: [4, 7],
    foc: g =>
      MULPAT.slice(0, g === 4 ? 4 : g === 5 ? 6 : 7).map(p => ({ l: `${p[0]}-digit × ${p[1]}-digit`, p })),
    tip: 'Multiply by each digit of the bottom number, shift one place left for the tens, then add the rows.',
    gen: (f, lv) => {
      const cap = d => Math.min(10 ** d - 1, 10 ** (d - 1) * (1 + lv));
      const a = R(10 ** (f.p[0] - 1), cap(f.p[0])),
        b = R(Math.max(2, 10 ** (f.p[1] - 1)), cap(f.p[1]));
      return Q(`${FN(a)} × ${FN(b)} = ?`, a * b, { min: 0, extra: [a * b + 10 * a, a * b - a] });
    },
  });
  fam({
    id: 'ldiv',
    s: 'Math',
    n: 'Long Division',
    g: [4, 7],
    foc: () => range(2, 25).map(d => ({ l: `Dividing by ${d}`, d })),
    tip: 'Divide, multiply, subtract, bring down — repeat for every digit.',
    gen: (f, lv) => {
      const qd = 1 + Math.ceil(lv / 3),
        q = R(10 ** (qd - 1), 10 ** qd - 1);
      return Q(`${FN(f.d * q)} ÷ ${f.d} = ?`, q, { min: 0, extra: [q + 10, q - 10, q * 10] });
    },
  });

  const PLACES = ['ones', 'tens', 'hundreds', 'thousands', 'ten thousands', 'hundred thousands', 'millions'];
  fam({
    id: 'pv',
    s: 'Math',
    n: 'Place Value',
    g: [1, 5],
    foc: g => {
      const o = [];
      PLACES.slice(0, [0, 2, 3, 4, 6, 7][g]).forEach((p, i) =>
        ['digit', 'value'].forEach(k => o.push({ l: `${k} in the ${p} place`, p: i, k }))
      );
      return o;
    },
    tip: 'Each place is worth 10 times the place to its right: ones, tens, hundreds, thousands…',
    gen: (f, lv) => {
      const len = f.p + 1 + R(0, Math.min(3, Math.floor(lv / 3)));
      const ds = range(1, len).map((_, i) => R(i === 0 ? 1 : 0, 9));
      const pos = len - 1 - f.p;
      if (!ds[pos]) ds[pos] = R(1, 9);
      const n = +ds.join(''),
        d = ds[pos];
      if (f.k === 'digit')
        return BC(`What digit is in the <b>${PLACES[f.p]}</b> place in <b>${FN(n)}</b>?`, String(d), [
          ...ds.map(String),
          ...range(0, 9).map(String),
        ]);
      const v = d * 10 ** f.p;
      return BC(
        `What is the value of the digit in the <b>${PLACES[f.p]}</b> place in <b>${FN(n)}</b>?`,
        FN(v),
        [
          FN(d * 10 ** (f.p + 1)),
          FN(d),
          FN(d * 10 ** Math.max(0, f.p - 1)),
          FN(d * 10 ** (f.p + 2)),
          FN(((d % 9) + 1) * 10 ** f.p),
        ]
      );
    },
  });

  fam({
    id: 'round',
    s: 'Math',
    n: 'Rounding',
    g: [3, 6],
    foc: g => {
      const T = {
        3: [10, 100],
        4: [10, 100, 1000, 10000],
        5: [10, 100, 1000, 10000, 100000],
        6: [10, 100, 1000, 10000, 100000],
      }[g].map(t => ({ l: `to the nearest ${FN(t)}`, t }));
      if (g >= 5)
        T.push(
          { l: 'to the nearest whole number', dp: 0 },
          { l: 'to the nearest tenth', dp: 1 },
          { l: 'to the nearest hundredth', dp: 2 }
        );
      return T;
    },
    tip: 'Look at the digit to the right of the place you round to. 5 or more → round up. 4 or less → stay.',
    gen: (f, lv) => {
      if (f.t) {
        const n = R(f.t, f.t * (10 + lv * 10));
        return Q(`Round <b>${FN(n)}</b> ${f.l}.`, Math.round(n / f.t) * f.t, { min: 0, step: f.t });
      }
      const xi = R(1000, 1000 * (10 + lv * 10)) + R(1, 999) / 1;
      const x = xi / 1000;
      const s = 10 ** f.dp;
      const ans = Math.round(x * s) / s;
      const fm = v => (+v).toFixed(f.dp);
      return Q(`Round <b>${x.toFixed(3)}</b> ${f.l}.`, ans, { min: 0, step: 1 / s, fmt: fm });
    },
  });

  const COINS = {
    pennies: [1],
    nickels: [5],
    dimes: [10],
    quarters: [25],
    'nickels & pennies': [5, 1],
    'dimes & pennies': [10, 1],
    'dimes & nickels': [10, 5],
    'quarters & dimes': [25, 10],
    'quarters & nickels': [25, 5],
    'all coins': [25, 10, 5, 1],
    'dollars & coins': [100, 25, 10, 5, 1],
  };
  const CNAME = {
    1: ['penny', 'pennies'],
    5: ['nickel', 'nickels'],
    10: ['dime', 'dimes'],
    25: ['quarter', 'quarters'],
    100: ['dollar bill', 'dollar bills'],
  };
  fam({
    id: 'money',
    s: 'Money',
    n: 'Counting Coins',
    g: [1, 4],
    foc: () => Object.keys(COINS).map(k => ({ l: k, c: COINS[k] })),
    tip: 'Penny = 1¢, nickel = 5¢, dime = 10¢, quarter = 25¢, dollar = 100¢. Count the biggest coins first.',
    gen: (f, lv) => {
      let tot = 0;
      const parts = f.c.map(v => {
        const n = R(1, 2 + Math.ceil(lv / 2));
        tot += n * v;
        return `${n} ${CNAME[v][n > 1 ? 1 : 0]}`;
      });
      return Q(`How much money is <b>${parts.join(', ')}</b>?`, tot, {
        min: 1,
        step: f.c.includes(1) ? 1 : 5,
        fmt: CENTS,
      });
    },
  });

  const t12 = m => {
    m = ((m % 720) + 720) % 720;
    const h = Math.floor(m / 60) || 12;
    return `${h}:${String(m % 60).padStart(2, '0')}`;
  };
  fam({
    id: 'time',
    s: 'Math',
    n: 'Telling Time',
    g: [1, 4],
    foc: () => {
      const o = [];
      for (const [k, l] of [
        ['h+', 'hours later'],
        ['h-', 'hours earlier'],
        ['m30', 'half hours later'],
        ['m15', 'quarter hours later'],
        ['m5', 'minutes later'],
      ])
        for (let h = 1; h <= 12; h++) o.push({ l: `${l}, starting at ${h} o’clock`, k, h });
      return o;
    },
    tip: 'An hour has 60 minutes. Half an hour is 30 minutes, a quarter hour is 15 minutes.',
    gen: (f, lv, g) => {
      const m0 = (f.h % 12) * 60 + (g <= 1 ? 30 * R(0, 1) : 5 * R(0, 11));
      let add, say;
      if (f.k === 'h+' || f.k === 'h-') {
        add = 60 * R(1, Math.min(11, lv + 1));
        say = `${add / 60} hour${add > 60 ? 's' : ''} ${f.k === 'h+' ? 'later' : 'earlier'}`;
        if (f.k === 'h-') add = -add;
      } else {
        const u = f.k === 'm30' ? 30 : f.k === 'm15' ? 15 : 5;
        add = u * R(1, f.k === 'm5' ? lv * 2 + 1 : lv + 1);
        say = `${add} minutes later`;
      }
      return Q(`It is <b>${t12(m0)}</b>. What time will it be ${say}?`, m0 + add, {
        step: f.k === 'm5' ? 5 : 15,
        fmt: t12,
        extra: [m0 - add, m0 + add + 60],
      });
    },
  });

  fam({
    id: 'fof',
    s: 'Math',
    n: 'Fraction of a Number',
    g: [3, 7],
    foc: () => range(2, 20).map(d => ({ l: `finding ?/${d} of a number`, d })),
    tip: 'To find 3/4 of 20: divide by the bottom (20 ÷ 4 = 5), then multiply by the top (5 × 3 = 15).',
    gen: (f, lv) => {
      const n = R(1, f.d - 1),
        k = R(1, 2 + lv),
        base = f.d * k;
      return Q(`What is <b>${n}/${f.d}</b> of <b>${base}</b>?`, n * k, { min: 0, extra: [k, base - n * k] });
    },
  });
  fam({
    id: 'fadd',
    s: 'Math',
    n: 'Adding & Subtracting Fractions',
    g: [3, 6],
    foc: () => {
      const o = [];
      for (const k of ['add', 'subtract'])
        for (let d = 2; d <= 12; d++) o.push({ l: `${k} with denominator ${d}`, k, d });
      return o;
    },
    tip: 'When the bottoms (denominators) match, add or subtract the tops and keep the bottom. Then simplify.',
    gen: (f, lv) => {
      const d = f.d;
      let a = R(1, d - 1),
        b = R(1, d - 1);
      if (f.k === 'add') {
        if (lv <= 5) {
          a = R(1, d - 1);
          b = R(1, Math.max(1, d - a));
        }
        const s = a + b;
        return FQ(`${a}/${d} + ${b}/${d} = ?`, s, d, [
          [s, 2 * d],
          [s + 1, d],
          [s - 1, d],
          [a * b, d],
          [s, d + 1],
        ]);
      }
      if (a < b) [a, b] = [b, a];
      if (a === b) a = Math.min(d, a + 1);
      const s = a - b;
      return FQ(`${a}/${d} − ${b}/${d} = ?`, s, d, [
        [s + 1, d],
        [s + 2, d],
        [a + b, d],
        [s, 2 * d],
        [1, d + s],
      ]);
    },
  });
  fam({
    id: 'fsimp',
    s: 'Math',
    n: 'Simplifying Fractions',
    g: [4, 7],
    foc: () => range(2, 12).map(k => ({ l: `common factor ${k}`, k })),
    tip: 'Divide the top and bottom by the same number (a common factor) until you can’t anymore.',
    gen: (f, lv) => {
      let d, n;
      do {
        d = R(2, Math.min(12, 3 + lv));
        n = R(1, d - 1);
      } while (GCD(n, d) !== 1);
      return FQ(`Simplify <b>${f.k * n}/${f.k * d}</b>.`, n, d, [
        [n + 1, d],
        [n, d + 1],
        [f.k * n, d],
        [n, f.k * d],
        [d - n, d],
      ]);
    },
  });
  fam({
    id: 'fcmp',
    s: 'Math',
    n: 'Comparing Fractions',
    g: [3, 6],
    foc: () => {
      const o = [];
      for (const k of ['same denominator', 'same numerator', 'unlike fractions'])
        for (const [l, m] of [
          ['small', 6],
          ['medium', 10],
          ['large', 16],
        ])
          o.push({ l: `${k} (${l})`, k, m });
      return o;
    },
    tip: 'Same bottom: bigger top wins. Same top: SMALLER bottom wins. Otherwise cross-multiply.',
    gen: (f, lv) => {
      let a, b, c, d;
      const m = f.m;
      if (f.k === 'same denominator') {
        b = d = R(3, m);
        a = R(1, b - 1);
        c = R(1, b - 1);
      } else if (f.k === 'same numerator') {
        a = c = R(1, 4);
        b = R(a + 1, m);
        d = R(a + 1, m);
      } else {
        b = R(2, m);
        d = R(2, m);
        a = R(1, b - 1);
        c = R(1, d - 1);
        if (lv >= 5 && Math.random() < 0.15) {
          const k = R(2, 3);
          c = a * k;
          d = b * k;
        }
      }
      const x = a * d,
        y = c * b;
      return {
        q: `Which symbol makes this true?<div class="ed-big">${a}/${b} &nbsp;?&nbsp; ${c}/${d}</div>`,
        a: x > y ? '>' : x < y ? '<' : '=',
        ch: ['<', '>', '='],
      };
    },
  });
  fam({
    id: 'dec',
    s: 'Math',
    n: 'Decimal Add & Subtract',
    g: [4, 7],
    foc: () => {
      const o = [];
      for (const k of ['add', 'subtract'])
        for (const p of [1, 2, 3])
          o.push({ l: `${k}, ${['tenths', 'hundredths', 'thousandths'][p - 1]}`, k, p });
      return o;
    },
    tip: 'Line up the decimal points, fill empty spots with zeros, then add or subtract like whole numbers.',
    gen: (f, lv) => {
      const s = 10 ** f.p;
      let a = R(1, 10 * (lv + 1) * s),
        b = R(1, 10 * (lv + 1) * s);
      if (f.k === 'subtract' && b > a) [a, b] = [b, a];
      const ans = (f.k === 'add' ? a + b : a - b) / s,
        fm = v => (+v).toFixed(f.p);
      return Q(`${(a / s).toFixed(f.p)} ${f.k === 'add' ? '+' : '−'} ${(b / s).toFixed(f.p)} = ?`, ans, {
        min: 0,
        step: 1 / s,
        fmt: fm,
        extra: [ans + 1, ans * 10],
      });
    },
  });
  fam({
    id: 'decm',
    s: 'Math',
    n: 'Decimal Multiply & Divide',
    g: [5, 8],
    foc: () =>
      [
        '× 10',
        '× 100',
        '× 1,000',
        '÷ 10',
        '÷ 100',
        '÷ 1,000',
        'decimal × whole number',
        'decimal × decimal',
      ].map((l, i) => ({ l, i })),
    tip: '× 10 moves the decimal point one place right; ÷ 10 moves it one place left.',
    gen: (f, lv) => {
      if (f.i < 6) {
        const k = 10 ** ((f.i % 3) + 1),
          xi = R(1, 99 * lv + 50),
          x = xi / 100,
          ans = f.i < 3 ? x * k : x / k;
        return Q(`${FN(x)} ${f.l.split(' ')[0]} ${FN(k)} = ?`, ans, {
          min: 0,
          extra: [ans * 10, ans / 10, f.i < 3 ? x / k : x * k],
        });
      }
      if (f.i === 6) {
        const a = R(1, 99),
          w = R(2, 2 + lv);
        return Q(`${FN(a / 10)} × ${w} = ?`, (a * w) / 10, {
          min: 0,
          step: 0.1,
          extra: [a * w, (a * w) / 100],
        });
      }
      const a = R(1, 30 + lv * 5),
        b = R(1, 30 + lv * 5);
      return Q(`${FN(a / 10)} × ${FN(b / 10)} = ?`, (a * b) / 100, {
        min: 0,
        step: 0.01,
        extra: [(a * b) / 10, (a * b) / 1000],
      });
    },
  });
  fam({
    id: 'pct',
    s: 'Math',
    n: 'Percents',
    g: [6, 9],
    foc: () =>
      [1, 2, 5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 80, 90, 100, 110, 125, 150, 200].map(p => ({
        l: `${p}% of a number`,
        p,
      })),
    tip: 'Percent means “out of 100.” 25% of 80 = 25/100 × 80 = 20. Tip: 10% is the number ÷ 10.',
    gen: (f, lv) => {
      const u = 100 / GCD(f.p, 100),
        base = u * R(1, 2 + lv * 2),
        ans = (f.p * base) / 100;
      return Q(`What is <b>${f.p}%</b> of <b>${FN(base)}</b>?`, ans, {
        min: 0,
        extra: [ans * 10, ans / 10, base - ans],
      });
    },
  });
  fam({
    id: 'int',
    s: 'Math',
    n: 'Integers (Negative Numbers)',
    g: [6, 9],
    foc: () => {
      const o = [];
      for (const op of ['+', '−', '×', '÷'])
        for (const [l, sa, sb] of [
          ['negative & positive', -1, 1],
          ['positive & negative', 1, -1],
          ['two negatives', -1, -1],
        ])
          o.push({ l: `${op} with ${l}`, op, sa, sb });
      return o;
    },
    tip: 'Subtracting a negative is adding. Negative × negative = positive; negative × positive = negative.',
    gen: (f, lv) => {
      const M = 5 + lv * 5;
      let a = f.sa * R(1, M),
        b = f.sb * R(1, M),
        ans;
      if (f.op === '+') ans = a + b;
      else if (f.op === '−') ans = a - b;
      else if (f.op === '×') {
        a = f.sa * R(1, 12);
        b = f.sb * R(1, 12);
        ans = a * b;
      } else {
        const q = f.sa * f.sb * R(1, 12);
        b = f.sb * R(1, 12);
        a = q * b;
        ans = q;
      }
      return Q(`${SN(a)} ${f.op} ${SN(b)} = ?`, ans, { extra: [-ans, ans + 2, ans - 2] });
    },
  });
  fam({
    id: 'exp',
    s: 'Math',
    n: 'Exponents',
    g: [5, 10],
    foc: () => range(2, 15).map(b => ({ l: `powers of ${b}`, b })),
    tip: 'An exponent tells how many times to multiply the base by itself: 2³ = 2 × 2 × 2 = 8. Anything to the 0 power is 1.',
    gen: (f, lv) => {
      const em = Math.max(1, Math.floor(Math.log(1e6) / Math.log(f.b))),
        e = Math.max(0, Math.min(em, Math.round((lv * em) / 10)));
      return Q(`${f.b}<sup>${e}</sup> = ?`, f.b ** e, {
        min: 0,
        extra: [f.b * e, f.b ** Math.max(0, e - 1), f.b + e],
      });
    },
  });
  fam({
    id: 'root',
    s: 'Math',
    n: 'Square & Cube Roots',
    g: [7, 10],
    foc: () =>
      [
        ['square roots up to 100', 2, 1, 10],
        ['square roots 100–400', 2, 10, 20],
        ['square roots 400–900', 2, 20, 30],
        ['square roots 900–2,500', 2, 30, 50],
        ['cube roots up to 1,000', 3, 1, 10],
        ['cube roots 1,000–8,000', 3, 10, 20],
      ].map(([l, p, a, b]) => ({ l, p, a, b })),
    tip: 'The square root of 49 is the number that times itself makes 49 → 7. Cube root of 27 → 3 (3 × 3 × 3).',
    gen: f => {
      const r = R(f.a, f.b);
      return Q(f.p === 2 ? `√${FN(r * r)} = ?` : `∛${FN(r ** 3)} = ?`, r, { min: 0 });
    },
  });
  const OOP = [
    ['a + b × c', (a, b, c) => a + b * c, (a, b, c) => (a + b) * c],
    ['a × b − c', (a, b, c) => a * b - c, (a, b, c) => a * (b - c)],
    ['(a + b) × c', (a, b, c) => (a + b) * c, (a, b, c) => a + b * c],
    ['a + b²', (a, b) => a + b * b, (a, b) => (a + b) ** 2],
    ['(a − b)² + c', (a, b, c) => (a - b) ** 2 + c, (a, b, c) => a - b * b + c],
    ['a × (b + c) − b', (a, b, c) => a * (b + c) - b, (a, b, c) => a * b + c - b],
    ['a − b × c + a', (a, b, c) => a - b * c + a, (a, b, c) => (a - b) * c + a],
  ];
  fam({
    id: 'oop',
    s: 'Math',
    n: 'Order of Operations',
    g: [5, 8],
    foc: () => OOP.map((o, i) => ({ l: o[0], i })),
    tip: 'PEMDAS: Parentheses, Exponents, Multiply/Divide (left to right), Add/Subtract (left to right).',
    gen: (f, lv) => {
      const [t, fn, wr] = OOP[f.i];
      const a = R(1, 4 + lv),
        b = R(1, 4 + lv),
        c = R(1, 4 + lv);
      const txt = t.replace(/a/g, a).replace(/b/g, b).replace(/c/g, c);
      return Q(`${txt} = ?`, fn(a, b, c), { extra: [wr(a, b, c)] });
    },
  });
  fam({
    id: 'eq1',
    s: 'Math',
    n: 'One-Step Equations',
    g: [6, 8],
    foc: () => {
      const o = [];
      for (const k of ['x + a = b', 'x − a = b', 'a · x = b', 'x ÷ a = b'])
        for (let a = 2; a <= 12; a++) o.push({ l: `${k} with a = ${a}`, k, a });
      return o;
    },
    tip: 'Do the opposite operation to both sides to get x alone. x + 5 = 12 → subtract 5 → x = 7.',
    gen: (f, lv) => {
      const x = R(lv > 5 ? -5 * lv : 0, 5 + lv * 3),
        a = f.a;
      let eq;
      if (f.k === 'x + a = b') eq = `<i>x</i> + ${a} = ${MS(x + a)}`;
      else if (f.k === 'x − a = b') eq = `<i>x</i> − ${a} = ${MS(x - a)}`;
      else if (f.k === 'a · x = b') eq = `${a}<i>x</i> = ${MS(a * x)}`;
      else eq = `<i>x</i> ÷ ${a} = ${MS(x)}`;
      const ans = f.k === 'x ÷ a = b' ? x * a : x;
      return Q(`Solve for <i>x</i>: <b>${eq}</b>`, ans, {
        extra: [f.k === 'x ÷ a = b' ? x : x + 2 * a, -ans],
      });
    },
  });
  fam({
    id: 'eq2',
    s: 'Math',
    n: 'Two-Step Equations',
    g: [7, 10],
    foc: () => {
      const o = [];
      for (const sg of ['+', '−']) for (let a = 2; a <= 15; a++) o.push({ l: `${a}x ${sg} b = c`, a, sg });
      return o;
    },
    tip: 'Undo adding/subtracting first, then undo multiplying. 3x + 4 = 19 → 3x = 15 → x = 5.',
    gen: (f, lv) => {
      const x = R(lv <= 3 ? 0 : -2 * lv, 3 * lv + 2),
        b = R(1, 5 + lv * 3),
        c = f.sg === '+' ? f.a * x + b : f.a * x - b;
      return Q(`Solve: <b>${f.a}<i>x</i> ${f.sg} ${b} = ${MS(c)}</b>`, x, {
        extra: [-x, x + 1, (c + b) / f.a],
      });
    },
  });
  fam({
    id: 'prop',
    s: 'Math',
    n: 'Ratios & Proportions',
    g: [6, 8],
    foc: () => range(1, 12).map(a => ({ l: `${a} : b = c : x`, a })),
    tip: 'Cross-multiply: a/b = c/x means a·x = b·c, so x = b·c ÷ a.',
    gen: (f, lv) => {
      const b = R(2, 12),
        k = R(2, 2 + lv);
      return Q(`Solve the proportion: <b>${f.a}/${b} = ${f.a * k}/<i>x</i></b>`, b * k, {
        min: 1,
        extra: [(f.a * k * f.a) / b > 0 ? Math.round((f.a * k * f.a) / b) : 1, b + k],
      });
    },
  });
  fam({
    id: 'stat',
    s: 'Math',
    n: 'Mean, Median, Mode & Range',
    g: [6, 9],
    foc: () => {
      const o = [];
      for (const k of ['mean', 'median', 'mode', 'range'])
        for (const n of [3, 5, 7, 9]) o.push({ l: `${k} of ${n} numbers`, k, n });
      return o;
    },
    tip: 'Mean = add them up ÷ how many. Median = the middle when sorted. Mode = most common. Range = biggest − smallest.',
    gen: (f, lv) => {
      const M = 10 + lv * 5;
      let a = range(1, f.n).map(() => R(1, M));
      if (f.k === 'mean') {
        const s = a.reduce((x, y) => x + y, 0),
          fix = (f.n - (s % f.n)) % f.n;
        a[a.length - 1] += fix;
      }
      if (f.k === 'mode') {
        const m = R(1, M),
          others = new Set();
        while (others.size < f.n - 2) {
          const v = R(1, M + f.n);
          if (v !== m) others.add(v);
        }
        a = SH([m, m, ...others]);
      }
      const s = [...a].sort((x, y) => x - y),
        sum = a.reduce((x, y) => x + y, 0);
      const ans =
        f.k === 'mean'
          ? sum / f.n
          : f.k === 'median'
            ? s[(f.n - 1) / 2]
            : f.k === 'mode'
              ? a.find((v, i) => a.indexOf(v) !== i)
              : s[s.length - 1] - s[0];
      return Q(`Find the <b>${f.k}</b>: ${a.join(', ')}`, ans, {
        min: 0,
        extra: [s[(f.n - 1) / 2], Math.round(sum / f.n), s[s.length - 1] - s[0]],
      });
    },
  });
  const SHAPES = [
    ['rectangle area', 3],
    ['rectangle perimeter', 3],
    ['square area', 3],
    ['square perimeter', 3],
    ['triangle area', 5],
    ['rectangular prism volume', 5],
    ['cube volume', 5],
    ['parallelogram area', 6],
    ['trapezoid area', 6],
    ['circle circumference', 7],
    ['circle area', 7],
  ];
  fam({
    id: 'geo',
    s: 'Math',
    n: 'Area, Perimeter & Volume',
    g: [3, 8],
    foc: g => SHAPES.filter(s => s[1] <= g).map(s => ({ l: s[0], k: s[0] })),
    tip: 'Area = space inside (square units). Perimeter = distance around. Volume = space a 3-D shape holds (cubic units).',
    gen: (f, lv) => {
      const M = 3 + lv * 2,
        a = R(2, M),
        b = R(2, M),
        h = R(2, M),
        u = f.k.includes('volume') ? ' cubic units' : f.k.includes('area') ? ' sq units' : ' units',
        fm = v => FN(v) + u;
      switch (f.k) {
        case 'rectangle area':
          return Q(`A rectangle is ${a} by ${b}. What is its area?`, a * b, {
            min: 1,
            fmt: fm,
            extra: [2 * (a + b)],
          });
        case 'rectangle perimeter':
          return Q(`A rectangle is ${a} by ${b}. What is its perimeter?`, 2 * (a + b), {
            min: 1,
            fmt: fm,
            extra: [a * b, a + b],
          });
        case 'square area':
          return Q(`A square has sides of ${a}. What is its area?`, a * a, {
            min: 1,
            fmt: fm,
            extra: [4 * a],
          });
        case 'square perimeter':
          return Q(`A square has sides of ${a}. What is its perimeter?`, 4 * a, {
            min: 1,
            fmt: fm,
            extra: [a * a],
          });
        case 'triangle area': {
          const bb = 2 * R(1, M);
          return Q(`A triangle has base ${bb} and height ${h}. What is its area?`, (bb * h) / 2, {
            min: 1,
            fmt: fm,
            extra: [bb * h],
          });
        }
        case 'rectangular prism volume':
          return Q(`A box is ${a} × ${b} × ${h}. What is its volume?`, a * b * h, {
            min: 1,
            fmt: fm,
            extra: [a * b + h, 2 * (a * b + b * h + a * h)],
          });
        case 'cube volume':
          return Q(`A cube has edges of ${a}. What is its volume?`, a ** 3, {
            min: 1,
            fmt: fm,
            extra: [a * a, 3 * a],
          });
        case 'parallelogram area':
          return Q(`A parallelogram has base ${a} and height ${h}. What is its area?`, a * h, {
            min: 1,
            fmt: fm,
            extra: [(a * h) / 2, 2 * (a + h)],
          });
        case 'trapezoid area': {
          const b2 = a + 2 * R(1, 4) * (h % 2 ? 1 : 1);
          const hh = (a + b2) % 2 ? 2 * R(1, M) : h;
          return Q(
            `A trapezoid has bases ${a} and ${b2} and height ${hh}. What is its area?`,
            ((a + b2) * hh) / 2,
            { min: 1, fmt: fm, extra: [(a + b2) * hh] }
          );
        }
        case 'circle circumference':
          return Q(`A circle has radius ${a}. What is its circumference? (use π ≈ 3.14)`, 2 * 3.14 * a, {
            min: 0,
            fmt: fm,
            extra: [3.14 * a * a, 3.14 * a],
          });
        default:
          return Q(`A circle has radius ${a}. What is its area? (use π ≈ 3.14)`, 3.14 * a * a, {
            min: 0,
            fmt: fm,
            extra: [2 * 3.14 * a, 3.14 * a],
          });
      }
    },
  });
  const SLOPES = [
    ...range(-6, 6).map(n => [n, 1]),
    [1, 2],
    [-1, 2],
    [2, 3],
    [-2, 3],
    [3, 4],
    [-3, 4],
    [1, 3],
    [-1, 3],
  ];
  fam({
    id: 'slope',
    s: 'Math',
    n: 'Slope',
    g: [8, 11],
    foc: () => SLOPES.map(([n, d]) => ({ l: `slope ${FR(n, d)}`, n, d })),
    tip: 'Slope = rise ÷ run = (y₂ − y₁) ÷ (x₂ − x₁).',
    gen: (f, lv) => {
      const x1 = R(-5, 5),
        y1 = R(-5, 5),
        run = f.d * R(1, 1 + Math.floor(lv / 3)),
        x2 = x1 + run,
        y2 = y1 + (run * f.n) / f.d;
      const q = `What is the slope of the line through (${MS(x1)}, ${MS(y1)}) and (${MS(x2)}, ${MS(y2)})?`;
      const pool = [
        FR(-f.n, f.d),
        f.n ? FR(f.d, f.n) : '1',
        FR(f.n + f.d, f.d),
        f.n ? FR(-f.d, f.n) : '−1',
        'undefined',
        FR(f.n * 2, f.d),
      ];
      return BC(q, FR(f.n, f.d), pool);
    },
  });
  const lin = (m, b) =>
    (m === 0 ? '' : m === 1 ? '<i>x</i>' : m === -1 ? '−<i>x</i>' : `${MS(m)}<i>x</i>`) +
    (b === 0 ? (m === 0 ? '0' : '') : m === 0 ? MS(b) : b > 0 ? ` + ${b}` : ` − ${-b}`);
  fam({
    id: 'line',
    s: 'Math',
    n: 'Evaluating Linear Functions',
    g: [7, 10],
    foc: () => range(-5, 5).map(m => ({ l: `y = ${MS(m)}x + b`, m })),
    tip: 'Plug the x-value in for x, multiply, then add b.',
    gen: (f, lv) => {
      const b = R(-10, 10),
        x = R(-5 - lv, 5 + lv);
      return Q(`If y = ${lin(f.m, b)}, what is y when x = ${MS(x)}?`, f.m * x + b, {
        extra: [f.m + x + b, -(f.m * x) + b],
      });
    },
  });
  fam({
    id: 'sys',
    s: 'Math',
    n: 'Systems of Equations',
    g: [9, 11],
    foc: () => range(-6, 6).map(x => ({ l: `solution x = ${MS(x)}`, x })),
    tip: 'Add or subtract the equations to cancel one variable (elimination), or solve one for a variable and substitute.',
    gen: (f, lv) => {
      const x = f.x,
        y = R(-6 - lv, 6 + lv);
      let a1 = 1,
        b1 = 1,
        a2 = 1,
        b2 = -1;
      if (lv > 3) {
        do {
          a1 = R(1, lv);
          b1 = R(1, lv);
          a2 = R(1, lv);
          b2 = -R(1, lv);
        } while (a1 * b2 - a2 * b1 === 0);
      }
      const e = (a, b) =>
        `${a === 1 ? '' : a}<i>x</i> ${b < 0 ? '−' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}<i>y</i> = ${MS(a * x + b * y)}`;
      return Q(
        `Solve the system. What is <i>x</i>?<div class="ed-big" style="font-size:18px">${e(a1, b1)}<br>${e(a2, b2)}</div>`,
        x,
        { extra: [y, -x] }
      );
    },
  });
  const poly = cs => {
    const deg = cs.length - 1;
    let s = '';
    cs.forEach((c, i) => {
      const p = deg - i;
      if (!c) return;
      const abs = Math.abs(c),
        co = abs === 1 && p > 0 ? '' : abs;
      const term = p === 0 ? `${abs}` : p === 1 ? `${co}<i>x</i>` : `${co}<i>x</i><sup>${p}</sup>`;
      s += s ? (c < 0 ? ' − ' : ' + ') + term : (c < 0 ? '−' : '') + term;
    });
    return s || '0';
  };
  fam({
    id: 'quad',
    s: 'Math',
    n: 'Solving Quadratics',
    g: [9, 12],
    foc: () => range(-9, 9).map(r => ({ l: `one root is ${MS(r)}`, r })),
    tip: 'Factor into (x − r)(x − s) = 0. The solutions are x = r and x = s.',
    gen: (f, lv) => {
      const r = f.r,
        s = R(-9, 9),
        a = lv >= 7 ? R(2, 3) : 1;
      const pr = (p, q) => {
        const [u, v] = [p, q].sort((m, n) => m - n);
        return u === v ? `x = ${MS(u)}` : `x = ${MS(u)}, ${MS(v)}`;
      };
      const ans = pr(r, s);
      const pool = [pr(-r, -s), pr(r, -s), pr(-r, s), pr(r + 1, s), pr(r, s - 1), pr(r * 2, s)];
      return BC(`Solve: <b>${poly([a, -a * (r + s), a * r * s])} = 0</b>`, ans, pool);
    },
  });
  fam({
    id: 'peval',
    s: 'Math',
    n: 'Evaluating Polynomials',
    g: [8, 12],
    foc: () => range(-5, 5).map(x => ({ l: `f(${MS(x)})`, x })),
    tip: 'Substitute the number for x everywhere. Do exponents first, then multiply, then add.',
    gen: (f, lv) => {
      const cs =
        lv >= 6
          ? [R(1, 3) * P([1, -1]), R(-5, 5), R(-5, 5), R(-9, 9)]
          : [R(1, 5) * P([1, -1]), R(-9, 9), R(-9, 9)];
      const val = cs.reduce((acc, c) => acc * f.x + c, 0);
      return Q(`If f(<i>x</i>) = ${poly(cs)}, what is f(${MS(f.x)})?`, val, {
        extra: [-val, val + cs[cs.length - 1]],
      });
    },
  });
  fam({
    id: 'erule',
    s: 'Math',
    n: 'Laws of Exponents',
    g: [8, 11],
    foc: () =>
      ['product rule', 'quotient rule', 'power of a power', 'zero exponent', 'negative exponent'].map(l => ({
        l,
      })),
    tip: 'xᵃ·xᵇ = xᵃ⁺ᵇ · xᵃ÷xᵇ = xᵃ⁻ᵇ · (xᵃ)ᵇ = xᵃᵇ · x⁰ = 1 · x⁻ⁿ = 1/xⁿ',
    gen: (f, lv) => {
      const v = P(['x', 'y', 'a', 'n']),
        a = R(2, 5 + lv),
        b = R(2, 3 + lv);
      if (f.l === 'product rule')
        return Q(`<i>${v}</i><sup>${a}</sup> · <i>${v}</i><sup>${b}</sup> = <i>${v}</i><sup>?</sup>`, a + b, {
          extra: [a * b],
        });
      if (f.l === 'quotient rule') {
        const hi = a + b;
        return Q(`<i>${v}</i><sup>${hi}</sup> ÷ <i>${v}</i><sup>${b}</sup> = <i>${v}</i><sup>?</sup>`, a, {
          extra: [hi + b, hi / b],
        });
      }
      if (f.l === 'power of a power')
        return Q(`(<i>${v}</i><sup>${a}</sup>)<sup>${b}</sup> = <i>${v}</i><sup>?</sup>`, a * b, {
          extra: [a + b],
        });
      if (f.l === 'zero exponent') {
        const B = R(2, 999);
        return BC(`${B}<sup>0</sup> = ?`, '1', ['0', String(B), '−1', '10']);
      }
      const B = R(2, 5),
        e = R(1, 3 + Math.floor(lv / 4));
      const V = B ** e;
      return BC(`${B}<sup>−${e}</sup> = ?`, `1/${V}`, [
        `−${V}`,
        `−${B * e}`,
        `1/${B * e}`,
        String(V),
        `1/${V * B}`,
      ]);
    },
  });
  fam({
    id: 'log',
    s: 'Math',
    n: 'Logarithms',
    g: [10, 12],
    foc: () => {
      const o = [];
      for (let b = 2; b <= 10; b++)
        for (const k of ['evaluate', 'solve']) o.push({ l: `base ${b}, ${k}`, b, k });
      return o;
    },
    tip: 'log_b(x) = k means bᵏ = x. So log₂(8) = 3 because 2³ = 8.',
    gen: (f, lv) => {
      const km = Math.max(2, Math.floor(Math.log(1e6) / Math.log(f.b)));
      if (f.k === 'evaluate') {
        let k = R(lv >= 6 ? -2 : 0, Math.min(km, 2 + Math.ceil(lv / 3)));
        const n = k < 0 ? `1/${f.b ** -k}` : FN(f.b ** k);
        return Q(`log<sub>${f.b}</sub>(${n}) = ?`, k, { extra: [f.b * k, -k] });
      }
      const k = R(1, Math.min(km, 1 + Math.ceil(lv / 3)));
      return Q(`If log<sub>${f.b}</sub>(<i>x</i>) = ${k}, what is <i>x</i>?`, f.b ** k, {
        min: 1,
        extra: [f.b * k, k ** f.b > 1e7 ? f.b + k : k ** f.b],
      });
    },
  });
  fam({
    id: 'deriv',
    s: 'Math',
    n: 'Derivatives (Power Rule)',
    g: [11, 12],
    foc: () => range(1, 12).map(n => ({ l: `f(x) = ax^${n}`, n })),
    tip: 'Power rule: the derivative of a·xⁿ is a·n·xⁿ⁻¹.',
    gen: (f, lv) => {
      const a = R(1, 2 + lv),
        k = f.n > 6 ? R(-2, 2) : R(-3, 3);
      return Q(
        `If f(<i>x</i>) = ${a === 1 ? '' : a}<i>x</i><sup>${f.n}</sup>, what is f′(${MS(k)})?`,
        a * f.n * k ** (f.n - 1),
        { extra: [a * k ** f.n, a * f.n * k ** f.n, a * (f.n - 1) * k ** (f.n - 1)] }
      );
    },
  });
  fam({
    id: 'integ',
    s: 'Math',
    n: 'Definite Integrals',
    g: [12, 12],
    foc: () => range(0, 6).map(n => ({ l: `∫ ax^${n} dx`, n })),
    tip: 'The integral of a·xⁿ is a·xⁿ⁺¹/(n+1). Evaluate at the top limit minus the bottom limit.',
    gen: (f, lv) => {
      const c = R(1, lv),
        a = (f.n + 1) * c,
        k = R(1, 3);
      return Q(
        `Evaluate ∫<sub>0</sub><sup>${k}</sup> ${a}<i>x</i>${f.n ? `<sup>${f.n}</sup>` : ''} d<i>x</i>`,
        c * k ** (f.n + 1),
        { min: 0, extra: [a * k ** f.n * f.n, a * k ** (f.n + 1)] }
      );
    },
  });
  fam({
    id: 'seq',
    s: 'Math',
    n: 'Number Patterns',
    g: [0, 10],
    foc: g =>
      (g <= 3 ? range(1, 12) : [...range(-10, -1), ...range(1, 20)]).map(d => ({
        l: g <= 3 ? `skip counting by ${d}` : `adding ${MS(d)} each time`,
        d,
      })),
    tip: 'Find the rule: how much does the number change each step? Then keep going.',
    gen: (f, lv, g) => {
      const s = f.d < 0 ? R(20, 60 + 10 * lv) : R(0, 10 * lv);
      const t = range(0, 3).map(i => s + i * f.d);
      if (g >= 6 && lv >= 4) {
        const n = R(10, 10 + lv * 5);
        return Q(`The pattern is ${t.map(MS).join(', ')}, … What is the ${ord(n)} term?`, s + (n - 1) * f.d, {
          extra: [s + n * f.d],
        });
      }
      return Q(`What comes next? <div class="ed-big">${t.map(MS).join(', ')}, ___</div>`, s + 4 * f.d, {
        extra: [s + 3 * f.d + 1],
      });
    },
  });
  fam({
    id: 'gseq',
    s: 'Math',
    n: 'Geometric Sequences',
    g: [6, 12],
    foc: () => [2, 3, 4, 5, 10, -2, -3].map(r => ({ l: `ratio ${MS(r)}`, r })),
    tip: 'In a geometric sequence you MULTIPLY by the same number (the ratio) each time.',
    gen: (f, lv) => {
      const a = R(1, 3 + lv),
        t = range(0, 2).map(i => a * f.r ** i),
        n = lv > 5 ? Math.min(Math.abs(f.r) >= 5 ? 5 : 7, 4 + Math.floor(lv / 3)) : 4;
      return Q(
        n === 4
          ? `What comes next? <div class="ed-big">${t.map(MS).join(', ')}, ___</div>`
          : `Sequence: ${t.map(MS).join(', ')}, … What is term ${n}?`,
        a * f.r ** (n - 1),
        { extra: [t[2] + (t[2] - t[1]), a * f.r ** n] }
      );
    },
  });
  fam({
    id: 'prob',
    s: 'Math',
    n: 'Probability',
    g: [6, 10],
    foc: () =>
      ['one die', 'two dice', 'coin flips', 'bag of marbles', 'spinner', 'deck of cards'].map(l => ({ l })),
    tip: 'Probability = (ways it can happen) ÷ (total possible outcomes). Always simplify.',
    gen: (f, lv) => {
      let q, n, d;
      if (f.l === 'one die') {
        const t = R(0, 3),
          k = R(1, 5);
        if (t === 0) {
          q = `You roll one die. What is the probability of rolling a ${R(1, 6)}?`;
          n = 1;
          d = 6;
        } else if (t === 1) {
          q = `You roll one die. What is the probability of rolling a number greater than ${k}?`;
          n = 6 - k;
          d = 6;
        } else if (t === 2) {
          q = `You roll one die. What is the probability of rolling an even number?`;
          n = 3;
          d = 6;
        } else {
          q = `You roll one die. What is the probability of rolling ${k} or less?`;
          n = k;
          d = 6;
        }
      } else if (f.l === 'two dice') {
        const s = R(2, 12);
        q = `You roll two dice. What is the probability the sum is ${s}?`;
        n = 6 - Math.abs(s - 7);
        d = 36;
      } else if (f.l === 'coin flips') {
        const c = R(1, 1 + Math.ceil(lv / 3)),
          t = R(0, 2);
        d = 2 ** c;
        if (t === 0 || c === 1) {
          q = `You flip ${c} coin${c > 1 ? 's' : ''}. Probability of ${c > 1 ? 'all heads' : 'heads'}?`;
          n = 1;
        } else if (t === 1) {
          q = `You flip ${c} coins. Probability of exactly one head?`;
          n = c;
        } else {
          q = `You flip ${c} coins. Probability of at least one head?`;
          n = d - 1;
        }
      } else if (f.l === 'bag of marbles') {
        const r = R(1, 3 + lv),
          b = R(1, 3 + lv),
          gr = R(1, 3 + lv),
          col = P([
            ['red', r],
            ['blue', b],
            ['green', gr],
          ]);
        q = `A bag has ${r} red, ${b} blue and ${gr} green marbles. Probability of picking ${col[0]}?`;
        n = col[1];
        d = r + b + gr;
      } else if (f.l === 'spinner') {
        d = R(3, Math.min(12, 4 + lv));
        n = R(1, d - 1);
        q = `A spinner has ${d} equal parts. ${n} are yellow. Probability of landing on yellow?`;
      } else {
        const c = P([
          ['a heart', 13],
          ['an ace', 4],
          ['a face card (J, Q, K)', 12],
          ['a red card', 26],
          ['a red king', 2],
          ['a black 7', 2],
          ['the queen of hearts', 1],
          ['a number card from 2 to 10', 36],
        ]);
        q = `You draw one card from a standard 52-card deck. Probability of ${c[0]}?`;
        n = c[1];
        d = 52;
      }
      return FQ(q, n, d, [
        [n + 1, d],
        [n - 1, d],
        [d - n, d],
        [n, d - 1],
        [1, n + 1],
        [n, 2 * d],
      ]);
    },
  });
  const TRIG = {
    sin: ['0', '1/2', '√2/2', '√3/2', '1'],
    cos: ['1', '√3/2', '√2/2', '1/2', '0'],
    tan: ['0', '√3/3', '1', '√3', 'undefined'],
  };
  const ANG = [0, 30, 45, 60, 90],
    RAD = ['0', 'π/6', 'π/4', 'π/3', 'π/2'];
  fam({
    id: 'trig',
    s: 'Math',
    n: 'Trig Special Angles',
    g: [10, 12],
    foc: () => {
      const o = [];
      for (const fn of ['sin', 'cos', 'tan'])
        ANG.forEach((a, i) => {
          if (!(fn === 'tan' && a === 90)) o.push({ l: `${fn} ${a}°`, fn, i });
        });
      return o;
    },
    tip: 'Memorize the unit circle: sin 30° = 1/2, sin 45° = √2/2, sin 60° = √3/2. Cosine runs the same list backward. tan = sin ÷ cos.',
    gen: (f, lv) =>
      BC(`${f.fn}(${lv >= 6 ? RAD[f.i] : ANG[f.i] + '°'}) = ?`, TRIG[f.fn][f.i], [
        '0',
        '1/2',
        '√2/2',
        '√3/2',
        '1',
        '√3/3',
        '√3',
        '2',
      ]),
  });
  const TRIPLES = [
    [3, 4, 5],
    [5, 12, 13],
    [8, 15, 17],
    [7, 24, 25],
    [20, 21, 29],
    [9, 40, 41],
  ];
  fam({
    id: 'pyth',
    s: 'Math',
    n: 'Pythagorean Theorem',
    g: [8, 10],
    foc: () => {
      const o = [];
      TRIPLES.forEach(t =>
        ['hypotenuse', 'missing leg'].forEach(k => o.push({ l: `${t.join('-')} triangles, find ${k}`, t, k }))
      );
      return o;
    },
    tip: 'a² + b² = c², where c is the longest side (the hypotenuse).',
    gen: (f, lv) => {
      const k = R(1, lv),
        [a, b, c] = f.t.map(v => v * k);
      return f.k === 'hypotenuse'
        ? Q(`A right triangle has legs ${a} and ${b}. How long is the hypotenuse?`, c, {
            min: 1,
            extra: [a + b],
          })
        : Q(`A right triangle has a leg of ${a} and a hypotenuse of ${c}. How long is the other leg?`, b, {
            min: 1,
            extra: [c - a],
          });
    },
  });
  fam({
    id: 'sci',
    s: 'Math',
    n: 'Scientific Notation',
    g: [8, 11],
    foc: () => range(-6, 9).map(e => ({ l: `× 10^${MS(e)}`, e })),
    tip: 'Move the decimal so there is ONE non-zero digit in front of it. Count the moves: that’s the exponent.',
    gen: f => {
      const m = R(11, 99) / 10,
        e = f.e,
        num = e >= 0 ? FN((Math.round(m * 10) * 10 ** e) / 10) : (m * 10 ** e).toFixed(-e + 1);
      const s = (mm, ee) => `${mm} × 10<sup>${MS(ee)}</sup>`;
      return BC(`Write <b>${num}</b> in scientific notation.`, s(m, e), [
        s(m, e + 1),
        s(m, e - 1),
        s(m, -e === e ? e + 2 : -e),
        s(m, e + 2),
      ]);
    },
  });
  const OPS = { add: 'adding', sub: 'subtracting', mul: 'multiplying', div: 'dividing' };
  fam({
    id: 'story',
    s: 'Math',
    n: 'Word Problems',
    g: [0, 8],
    foc: g => {
      const ops = g <= 1 ? ['add', 'sub'] : g === 2 ? ['add', 'sub', 'mul'] : ['add', 'sub', 'mul', 'div'];
      const o = [];
      ITEMS.forEach(it => ops.forEach(op => o.push({ l: `${cap(it)} (${OPS[op]})`, it, op })));
      return o;
    },
    tip: 'Read carefully. “More” or “in all” usually means add. “Left” means subtract. “Each” or “groups of” means multiply. “Share equally” means divide.',
    gen: (f, lv, g) => {
      const nm = P(NAMES),
        M = Math.max(5, Math.round(([10, 20, 100, 1000, 5000, 10000, 10000, 10000, 10000][g] * lv) / 10)),
        it = f.it;
      if (f.op === 'add') {
        const a = R(1, M),
          b = R(1, M);
        return Q(`${nm} has ${a} ${it} and gets ${b} more. How many ${it} does ${nm} have now?`, a + b, {
          min: 0,
          extra: [Math.abs(a - b)],
        });
      }
      if (f.op === 'sub') {
        let a = R(2, M),
          b = R(1, a);
        return Q(`${nm} has ${a} ${it} and gives away ${b}. How many ${it} are left?`, a - b, {
          min: 0,
          extra: [a + b],
        });
      }
      const F = [0, 0, 5, 10, 12, 12, 15, 20, 25][g],
        x = R(2, Math.max(3, Math.round((F * lv) / 10) + 2)),
        y = R(2, Math.max(3, Math.round((F * lv) / 10) + 2));
      if (f.op === 'mul')
        return Q(
          `There are ${x} groups of ${it} with ${y} in each group. How many ${it} are there in all?`,
          x * y,
          { min: 0, extra: [x + y] }
        );
      return Q(
        `${nm} shares ${x * y} ${it} equally among ${x} friends. How many ${it} does each friend get?`,
        y,
        { min: 0, extra: [x * y - x] }
      );
    },
  });
  const UNITS = [
    ['centimeters', 'meters', 100],
    ['millimeters', 'centimeters', 10],
    ['meters', 'kilometers', 1000],
    ['inches', 'feet', 12],
    ['feet', 'yards', 3],
    ['grams', 'kilograms', 1000],
    ['milliliters', 'liters', 1000],
    ['minutes', 'hours', 60],
    ['seconds', 'minutes', 60],
    ['hours', 'days', 24],
    ['days', 'weeks', 7],
    ['ounces', 'pounds', 16],
    ['cups', 'pints', 2],
    ['pints', 'quarts', 2],
    ['quarts', 'gallons', 4],
    ['months', 'years', 12],
  ];
  fam({
    id: 'units',
    s: 'Math',
    n: 'Unit Conversion',
    g: [3, 8],
    foc: () => {
      const o = [];
      UNITS.forEach(([s, b, k]) => {
        o.push({ l: `${b} → ${s}`, from: b, to: s, k, up: true });
        o.push({ l: `${s} → ${b}`, from: s, to: b, k, up: false });
      });
      return o;
    },
    tip: 'Big unit → small unit: multiply. Small unit → big unit: divide. (1 foot = 12 inches.)',
    gen: (f, lv) => {
      const n = R(1, 2 + lv * 2);
      return f.up
        ? Q(`How many ${f.to} are in ${n} ${f.from}?`, n * f.k, { min: 1, extra: [n + f.k] })
        : Q(`How many ${f.to} are in ${FN(n * f.k)} ${f.from}?`, n, {
            min: 1,
            extra: [n * f.k * f.k > 1e7 ? n + 1 : n * f.k * f.k],
          });
    },
  });
  fam({
    id: 'eo',
    s: 'Math',
    n: 'Even & Odd',
    g: [1, 3],
    foc: () => {
      const o = [];
      for (const k of ['even', 'odd'])
        for (let d = 1; d <= 5; d++) o.push({ l: `${k} numbers, ${d}-digit`, k, d });
      return o;
    },
    tip: 'Even numbers end in 0, 2, 4, 6 or 8. Odd numbers end in 1, 3, 5, 7 or 9.',
    gen: f => {
      const lo = f.d === 1 ? 0 : 10 ** (f.d - 1),
        hi = 10 ** f.d - 1,
        want = f.k === 'even' ? 0 : 1,
        s = new Set();
      const mk = p => {
        let v;
        do v = R(lo, hi);
        while (v % 2 !== p || s.has(v));
        s.add(v);
        return v;
      };
      const ans = mk(want);
      const others = [mk(1 - want), mk(1 - want), mk(1 - want)];
      return { q: `Which number is <b>${f.k}</b>?`, a: FN(ans), ch: SH([ans, ...others].map(FN)) };
    },
  });
  fam({
    id: 'gcf',
    s: 'Math',
    n: 'GCF & LCM',
    g: [5, 8],
    foc: () => {
      const o = [];
      for (const k of ['GCF', 'LCM']) for (let n = 2; n <= 20; n++) o.push({ l: `${k} with ${n}`, k, n });
      return o;
    },
    tip: 'GCF = the biggest number that divides both. LCM = the smallest number both divide into.',
    gen: (f, lv) => {
      if (f.k === 'GCF') {
        const a = f.n * R(1, 1 + Math.ceil(lv / 3)),
          b = R(2, 10 + lv * 6);
        return Q(`What is the greatest common factor of ${a} and ${b}?`, GCD(a, b), {
          min: 1,
          extra: [LCM(a, b) > 1e6 ? 1 : LCM(a, b)],
        });
      }
      const b = R(2, 5 + lv * 2);
      return Q(`What is the least common multiple of ${f.n} and ${b}?`, LCM(f.n, b), {
        min: 1,
        extra: [f.n * b, GCD(f.n, b)],
      });
    },
  });
  const isPrime = n => {
    if (n < 2) return false;
    for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
    return true;
  };
  fam({
    id: 'prime',
    s: 'Math',
    n: 'Prime & Composite',
    g: [4, 8],
    foc: () => {
      const o = [];
      for (const k of ['prime', 'composite'])
        for (const [a, b] of [
          [2, 20],
          [20, 50],
          [50, 100],
          [100, 200],
        ])
          o.push({ l: `find the ${k} (${a}–${b})`, k, a, b });
      return o;
    },
    tip: 'A prime number has exactly two factors: 1 and itself (2, 3, 5, 7, 11…). A composite number has more.',
    gen: (f, lv) => {
      const want = f.k === 'prime',
        s = new Set();
      const mk = p => {
        let v,
          t = 0;
        do {
          v = R(f.a, f.b);
          t++;
        } while ((isPrime(v) !== p || s.has(v) || (lv > 4 && !p && v % 2 === 0 && t < 50)) && t < 500);
        s.add(v);
        return v;
      };
      const ans = mk(want),
        others = [mk(!want), mk(!want), mk(!want)];
      return { q: `Which number is <b>${f.k}</b>?`, a: String(ans), ch: SH([ans, ...others].map(String)) };
    },
  });

  /* ---------- MONEY & INVESTING ---------- */
  fam({
    id: 'change',
    s: 'Money',
    n: 'Making Change',
    g: [2, 6],
    foc: () => {
      const o = [];
      [1, 5, 10, 20, 50, 100].forEach(b =>
        SHOP.forEach(it => o.push({ l: `$${b} bill, buying ${it}`, b, it }))
      );
      return o;
    },
    tip: 'Change = money you pay − the price. Count up from the price to the amount you paid.',
    gen: (f, lv) => {
      const tot = f.b * 100;
      let p = R(1, tot - 1);
      if (lv <= 3) p = Math.max(5, Math.round(p / 25) * 25) % tot || 25;
      if (lv > 3 && lv <= 6) p = Math.max(5, Math.round(p / 5) * 5) % tot || 5;
      return Q(
        `You buy ${f.it} for <b>${USD(p)}</b> and pay with a <b>$${f.b}</b> bill. How much change do you get?`,
        tot - p,
        { min: 1, step: lv <= 3 ? 25 : lv <= 6 ? 5 : 1, fmt: USD, extra: [tot - p + 100, tot - p - 100] }
      );
    },
  });
  fam({
    id: 'save',
    s: 'Money',
    n: 'Saving Goals',
    g: [3, 8],
    foc: () => {
      const o = [];
      for (let w = 5; w <= 50; w += 5)
        SHOP.slice(0, 10).forEach(it => o.push({ l: `saving $${w}/week for ${it}`, w, it }));
      return o;
    },
    tip: 'Divide the price by how much you save each week. If there’s a remainder, you need one more week.',
    gen: (f, lv) => {
      const wk = R(2, 4 + lv * 2),
        price = lv <= 4 ? f.w * wk : f.w * wk - R(1, f.w - 1);
      return Q(
        `You save <b>$${f.w}</b> each week. How many weeks until you can buy ${f.it} that costs <b>$${price}</b>?`,
        Math.ceil(price / f.w),
        { min: 1, extra: [Math.floor(price / f.w)] }
      );
    },
  });
  const DOL = v => (v < 0 ? '−$' : '$') + FN(Math.abs(v));
  fam({
    id: 'profit',
    s: 'Money',
    n: 'Stock Profit & Loss',
    g: [4, 10],
    foc: () => range(1, 20).map(n => ({ l: `${n} share${n > 1 ? 's' : ''}`, n })),
    tip: 'Profit = (sell price − buy price) × number of shares. A negative answer is a loss.',
    gen: (f, lv) => {
      const a = R(5, 20 + lv * 20),
        b = Math.max(1, a + R(-Math.min(a - 1, 5 + lv * 3), 5 + lv * 4)),
        p = f.n * (b - a);
      return Q(
        `You buy <b>${f.n}</b> share${f.n > 1 ? 's' : ''} at <b>$${a}</b> and sell at <b>$${b}</b>. What is your profit? (negative = loss)`,
        p,
        { step: f.n, fmt: DOL, extra: [b - a, -p, f.n * b] }
      );
    },
  });
  fam({
    id: 'pchg',
    s: 'Money',
    n: 'Percent Change in Stocks',
    g: [6, 12],
    foc: () => {
      const o = [];
      for (const k of ['gain', 'loss']) for (let p = 5; p <= 50; p += 5) o.push({ l: `${p}% ${k}`, k, p });
      return o;
    },
    tip: 'New price = old × (1 ± percent/100). Percent change = (new − old) ÷ old × 100.',
    gen: (f, lv) => {
      const P0 = 20 * R(1, 5 + lv * 5),
        d = (f.p * P0) / 100,
        P1 = f.k === 'gain' ? P0 + d : P0 - d;
      if (lv >= 6)
        return Q(`A stock went from <b>$${P0}</b> to <b>$${P1}</b>. What was the percent ${f.k}?`, f.p, {
          min: 1,
          step: 5,
          fmt: v => v + '%',
          extra: [Math.round((d / P1) * 100)],
        });
      return Q(
        `A stock costs <b>$${P0}</b> and ${f.k === 'gain' ? 'rises' : 'falls'} <b>${f.p}%</b>. What is the new price?`,
        P1,
        { min: 0, fmt: v => '$' + FN(v), step: 5, extra: [d, f.k === 'gain' ? P0 - d : P0 + d] }
      );
    },
  });
  fam({
    id: 'sint',
    s: 'Money',
    n: 'Simple Interest',
    g: [7, 11],
    foc: () => range(1, 10).map(r => ({ l: `${r}% per year`, r })),
    tip: 'Simple interest: I = P × r × t (principal × rate as a decimal × years).',
    gen: (f, lv) => {
      const Pp = 100 * R(1, 10 + lv * 10),
        t = R(1, 2 + lv);
      return Q(
        `You deposit <b>$${FN(Pp)}</b> at <b>${f.r}%</b> simple interest for <b>${t} year${t > 1 ? 's' : ''}</b>. How much interest do you earn?`,
        (Pp * f.r * t) / 100,
        {
          min: 0,
          fmt: v => '$' + FN(v),
          step: Pp / 100,
          extra: [(Pp * f.r) / 100, Pp + (Pp * f.r * t) / 100],
        }
      );
    },
  });
  fam({
    id: 'cint',
    s: 'Money',
    n: 'Compound Interest',
    g: [9, 12],
    foc: () => {
      const o = [];
      for (const r of [2, 4, 5, 8, 10])
        for (let n = 1; n <= 5; n++) o.push({ l: `${r}% for ${n} year${n > 1 ? 's' : ''}`, r, n });
      return o;
    },
    tip: 'Compound: A = P(1 + r)ⁿ. Each year you earn interest on your interest too.',
    gen: (f, lv) => {
      const Pp = 1000 * R(1, 2 + lv),
        A = Math.round(Pp * (1 + f.r / 100) ** f.n * 100);
      return Q(
        `You invest <b>$${FN(Pp)}</b> at <b>${f.r}%</b> compounded yearly. How much after <b>${f.n} year${f.n > 1 ? 's' : ''}</b>?`,
        A,
        {
          min: 0,
          fmt: USD,
          step: 100,
          extra: [Math.round(Pp * (1 + (f.r * f.n) / 100) * 100) + (f.n === 1 ? 1000 : 0)],
        }
      );
    },
  });
  const candleSVG = (o, h, l, c) => {
    const lo = l - 2,
      hi = h + 2,
      y = v => 8 + ((hi - v) / (hi - lo)) * 104,
      col = c >= o ? 'var(--up)' : 'var(--dn)';
    return `<svg class="ed-candle" viewBox="0 0 60 120" width="60" height="120"><line x1="30" x2="30" y1="${y(h)}" y2="${y(l)}" stroke="${col}" stroke-width="2"/><rect x="18" width="24" y="${y(Math.max(o, c))}" height="${Math.max(2, Math.abs(y(o) - y(c)))}" fill="${col}" rx="2"/></svg>`;
  };
  fam({
    id: 'candle',
    s: 'Money',
    n: 'Reading Candlesticks',
    g: [5, 12],
    foc: () =>
      ['body size', 'upper wick', 'lower wick', 'full range', 'bullish or bearish'].map(l => ({ l })),
    tip: 'Body = |close − open|. Upper wick = high − top of body. Lower wick = bottom of body − low. Green = close above open.',
    gen: (f, lv) => {
      const o = R(20, 100);
      let c = o + R(-10 - lv, 10 + lv);
      if (c === o) c++;
      const h = Math.max(o, c) + R(0, 5 + lv),
        l = Math.min(o, c) - R(0, 5 + lv);
      const q = `<div class="ed-cwrap">${candleSVG(o, h, l, c)}<div>Open <b>$${o}</b><br>High <b>$${h}</b><br>Low <b>$${l}</b><br>Close <b>$${c}</b></div></div>`;
      if (f.l === 'bullish or bearish')
        return BC(q + 'Is this candle bullish or bearish?', c > o ? 'Bullish (green)' : 'Bearish (red)', [
          'Bullish (green)',
          'Bearish (red)',
        ]);
      const ans = {
        'body size': Math.abs(c - o),
        'upper wick': h - Math.max(o, c),
        'lower wick': Math.min(o, c) - l,
        'full range': h - l,
      }[f.l];
      return Q(q + `How big is the <b>${f.l}</b> (in dollars)?`, ans, {
        min: 0,
        fmt: v => '$' + v,
        extra: [h - l, Math.abs(c - o)],
      });
    },
  });
  fam({
    id: 'cfacts',
    s: 'Money',
    n: 'Candlestick Patterns',
    g: [5, 12],
    foc: () => chunk(CANDLE, 5).map((c, i) => ({ l: `set ${i + 1}`, c })),
    tip: 'Each candle shows four prices: open, high, low, close. Patterns of candles hint at what buyers and sellers are doing.',
    gen: f => {
      const [q, a] = P(f.c);
      return BC(
        q,
        a,
        CANDLE.map(x => x[1])
      );
    },
  });
  fam({
    id: 'econ',
    s: 'Money',
    n: 'Economics Vocabulary',
    g: [5, 12],
    foc: () => {
      const o = [];
      chunk(ECON, 5).forEach((c, i) =>
        ['term → meaning', 'meaning → term'].forEach(k => o.push({ l: `set ${i + 1}, ${k}`, c, k }))
      );
      return o;
    },
    tip: 'Learn what each money word means and try using it in a sentence.',
    gen: f => {
      const [t, d] = P(f.c);
      return f.k === 'term → meaning'
        ? BC(
            `What does <b>${t}</b> mean?`,
            d,
            ECON.map(x => x[1])
          )
        : BC(
            `Which word means: <i>${d}</i>?`,
            t,
            ECON.map(x => x[0])
          );
    },
  });
  fam({
    id: 'needs',
    s: 'Money',
    n: 'Needs & Wants',
    g: [0, 3],
    foc: () => [
      { l: 'needs', k: 'need' },
      { l: 'wants', k: 'want' },
    ],
    tip: 'A need is something you must have to live (food, water, shelter). A want is nice to have but not required.',
    gen: f => BC(`Is <b>${P(NEEDS[f.k])}</b> a need or a want?`, cap(f.k), ['Need', 'Want'], 2),
  });

  /* ---------- READING & WRITING ---------- */
  fam({
    id: 'abc',
    s: 'Reading',
    n: 'Alphabet Order',
    g: [0, 1],
    foc: () => {
      const o = [];
      LETTERS.forEach((L, i) => {
        if (i < 25) o.push({ l: `after ${L.toUpperCase()}`, i, k: 1 });
        if (i > 0) o.push({ l: `before ${L.toUpperCase()}`, i, k: -1 });
      });
      return o;
    },
    tip: 'Sing the ABC song and stop at the letter. The next letter is “after,” the one you just sang is “before.”',
    gen: (f, lv) => {
      const up = lv % 2 === 1,
        L = x => (up ? x.toUpperCase() : x),
        ans = LETTERS[f.i + f.k];
      return BC(
        `What letter comes <b>${f.k > 0 ? 'after' : 'before'}</b> ${L(LETTERS[f.i])}?`,
        L(ans),
        LETTERS.filter((_, j) => Math.abs(j - f.i) <= 4).map(L)
      );
    },
  });
  fam({
    id: 'case',
    s: 'Reading',
    n: 'Uppercase & Lowercase',
    g: [0, 1],
    foc: () => {
      const o = [];
      LETTERS.forEach(L => {
        o.push({ l: `lowercase of ${L.toUpperCase()}`, L, k: 'lo' });
        o.push({ l: `uppercase of ${L}`, L, k: 'up' });
      });
      return o;
    },
    tip: 'Every letter has a big (uppercase) and small (lowercase) form: A a, B b, C c…',
    gen: f =>
      f.k === 'lo'
        ? BC(
            `Which is the <b>lowercase</b> of <span class="ed-big">${f.L.toUpperCase()}</span>?`,
            f.L,
            LETTERS
          )
        : BC(
            `Which is the <b>uppercase</b> of <span class="ed-big">${f.L}</span>?`,
            f.L.toUpperCase(),
            LETTERS.map(x => x.toUpperCase())
          ),
  });
  fam({
    id: 'begin',
    s: 'Reading',
    n: 'Beginning Sounds',
    g: [0, 1],
    foc: () =>
      LETTERS.filter(L => L !== 'x').map(L => ({ l: `words that start with ${L.toUpperCase()}`, L })),
    tip: 'Say the word slowly. The first sound you hear is the beginning sound.',
    gen: (f, lv) => {
      const short = w => w.length <= 4 + Math.ceil(lv / 2);
      const pool = BYL[f.L].filter(short),
        ans = P(pool.length ? pool : BYL[f.L]);
      return BC(
        `Which word starts with the letter <b>${f.L.toUpperCase()}</b>?`,
        ans,
        WORDS.filter(w => w[0] !== f.L && short(w))
      );
    },
  });
  fam({
    id: 'rhyme',
    s: 'Reading',
    n: 'Rhyming Words',
    g: [0, 2],
    foc: () => Object.keys(RHYME).map(k => ({ l: `-${k} words`, k })),
    tip: 'Rhyming words end with the same sound: cat, hat, bat.',
    gen: f => {
      const [w, a] = SH(RHYME[f.k]);
      return BC(
        `Which word rhymes with <b>${w}</b>?`,
        a,
        Object.keys(RHYME)
          .filter(k => k !== f.k)
          .flatMap(k => RHYME[k])
      );
    },
  });
  fam({
    id: 'aorder',
    s: 'Reading',
    n: 'ABC Order (Words)',
    g: [1, 5],
    foc: () => LETTERS.map(L => ({ l: `words with ${L.toUpperCase()}`, L })),
    tip: 'Compare the first letters. If they match, compare the second letters, then the third…',
    gen: (f, lv) => {
      const same = lv >= 4 && (BYL[f.L] || []).length >= 4;
      const ws = same
        ? SH(BYL[f.L]).slice(0, 4)
        : [P(BYL[f.L] || BYL.a), ...SH(WORDS.filter(w => w[0] !== f.L)).slice(0, 3)];
      const u = [...new Set(ws)];
      while (u.length < 4) {
        const w = P(WORDS);
        if (!u.includes(w)) u.push(w);
      }
      const first = [...u].sort()[0];
      return { q: `Which word comes <b>first</b> in ABC order?`, a: first, ch: SH(u) };
    },
  });
  function misspell(w) {
    const out = new Set(),
      V = 'aeiou';
    let t = 0;
    while (out.size < 3 && t++ < 80) {
      const i = R(1, w.length - 1),
        c = w[i],
        k = R(0, 4);
      let m;
      if (k === 0)
        m = w.slice(0, i) + c + w.slice(i); // double a letter
      else if (k === 1 && w[i] === w[i - 1])
        m = w.slice(0, i) + w.slice(i + 1); // drop a double
      else if (k === 2 && i < w.length - 1)
        m = w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2); // swap
      else if (k === 3 && V.includes(c)) m = w.slice(0, i) + P(V.replace(c, '').split('')) + w.slice(i + 1);
      else m = w.slice(0, i) + w.slice(i + 1); // drop a letter
      if (m && m !== w && m.length > 1 && !WSET.has(m)) out.add(m);
    }
    return [...out];
  }
  fam({
    id: 'spell',
    s: 'Reading',
    n: 'Spelling',
    g: [1, 8],
    foc: () => LETTERS.filter(L => L !== 'x').map(L => ({ l: `words starting with ${L.toUpperCase()}`, L })),
    tip: 'Sound out each part of the word. Look for tricky spots like double letters and silent letters.',
    gen: (f, lv, g) => {
      const list = [...BYL[f.L]].sort((a, b) => a.length - b.length),
        n = list.length,
        lo = Math.floor(((n - 1) * Math.min(lv + g, 14)) / 20),
        w = list[R(lo, Math.min(n - 1, lo + 4))];
      const bad = misspell(w);
      return { q: `Which word is spelled <b>correctly</b>?`, a: w, ch: SH([w, ...bad]) };
    },
  });
  fam({
    id: 'syn',
    s: 'Reading',
    n: 'Synonyms & Antonyms',
    g: [2, 8],
    foc: () => {
      const o = [];
      chunk(SYN, 8).forEach((c, i) => o.push({ l: `synonyms, set ${i + 1}`, c, k: 's' }));
      chunk(ANT, 8).forEach((c, i) => o.push({ l: `antonyms, set ${i + 1}`, c, k: 'a' }));
      return o;
    },
    tip: 'Synonyms mean the SAME (big / large). Antonyms mean the OPPOSITE (big / small).',
    gen: f => {
      const [w, a] = SH(P(f.c));
      const all = f.k === 's' ? SYN : ANT,
        pair = all.find(p => p.includes(w));
      const bad = new Set(all.filter(p => p.includes(w)).flat());
      const pool = all.flat().filter(x => !bad.has(x));
      return BC(
        f.k === 's'
          ? `Which word means the <b>same</b> as <b>${w}</b>?`
          : `Which word means the <b>opposite</b> of <b>${w}</b>?`,
        a,
        pool
      );
    },
  });
  fam({
    id: 'pos',
    s: 'Reading',
    n: 'Parts of Speech',
    g: [2, 6],
    foc: () => {
      const o = [];
      Object.keys(POS).forEach(k => {
        o.push({ l: `find the ${k}`, k, t: 'find' });
        o.push({ l: `name the part of speech (${k}s)`, k, t: 'name' });
      });
      return o;
    },
    tip: 'Noun = person, place or thing. Verb = action. Adjective = describes a noun. Adverb = describes a verb (often ends in -ly).',
    gen: f => {
      if (f.t === 'find')
        return BC(
          `Which word is ${/^[aeiou]/.test(f.k) ? 'an' : 'a'} <b>${f.k}</b>?`,
          P(POS[f.k]),
          Object.keys(POS)
            .filter(k => k !== f.k)
            .map(k => P(POS[k]))
            .concat([])
        );
      return BC(`What part of speech is <b>${P(POS[f.k])}</b>?`, cap(f.k), Object.keys(POS).map(cap));
    },
  });
  fam({
    id: 'plural',
    s: 'Reading',
    n: 'Plurals',
    g: [1, 4],
    foc: () => Object.keys(PLURAL).map(k => ({ l: k, k })),
    tip: 'Most words add -s. Words ending in s, x, ch, sh add -es. Consonant + y → -ies. Some words are irregular (child → children).',
    gen: f => {
      const [w, p] = P(PLURAL[f.k]);
      const cands = [
        w + 's',
        w + 'es',
        w,
        w + 'en',
        w.replace(/y$/, 'ys'),
        w.replace(/fe?$/, 'fs'),
        w.replace(/y$/, 'ies'),
      ];
      return BC(`What is the plural of <b>${w}</b>?`, p, cands);
    },
  });
  fam({
    id: 'contr',
    s: 'Reading',
    n: 'Contractions',
    g: [1, 4],
    foc: () => Object.keys(CONTR).map(k => ({ l: k, k })),
    tip: 'A contraction squeezes two words together. The apostrophe (’) takes the place of missing letters: do not → don’t.',
    gen: f => {
      const [l, c] = P(CONTR[f.k]);
      return BC(
        `What is the contraction for <b>${l}</b>?`,
        c,
        Object.values(CONTR)
          .flat()
          .map(x => x[1])
      );
    },
  });
  fam({
    id: 'homo',
    s: 'Reading',
    n: 'Homophones',
    g: [2, 6],
    foc: () => chunk(HOMO, 4).map((c, i) => ({ l: `set ${i + 1}`, c })),
    tip: 'Homophones sound the same but are spelled differently and mean different things: there / their / they’re.',
    gen: f => {
      const [s, a, set] = P(f.c);
      return {
        q: `Choose the right word:<div class="ed-big" style="font-size:19px">${s.replace('___', '<u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u>')}</div>`,
        a,
        ch: SH(set),
      };
    },
  });
  fam({
    id: 'affix',
    s: 'Reading',
    n: 'Prefixes & Suffixes',
    g: [3, 7],
    foc: () => [
      ...chunk(PREFIX, 6).map((c, i) => ({ l: `prefixes, set ${i + 1}`, c, all: PREFIX })),
      ...chunk(SUFFIX, 6).map((c, i) => ({ l: `suffixes, set ${i + 1}`, c, all: SUFFIX })),
    ],
    tip: 'A prefix goes at the START of a word (re-play). A suffix goes at the END (hope-ful). Each one changes the meaning.',
    gen: f => {
      const [a, m, ex] = P(f.c);
      return BC(
        `In the word <b>${ex}</b>, what does <b>${a}</b> mean?`,
        m,
        f.all.map(x => x[1])
      );
    },
  });
  fam({
    id: 'vocab',
    s: 'Reading',
    n: 'Vocabulary',
    g: [3, 12],
    foc: g => {
      const t = g <= 5 ? 'A' : g <= 8 ? 'B' : 'C',
        o = [];
      chunk(VOCAB[t], 5).forEach((c, i) =>
        ['word → meaning', 'meaning → word'].forEach(k => o.push({ l: `set ${i + 1}, ${k}`, c, t, k }))
      );
      return o;
    },
    tip: 'Use context clues and word parts to figure out meanings. Then use the new word in your own sentence.',
    gen: f => {
      const [w, d] = P(f.c);
      return f.k === 'word → meaning'
        ? BC(
            `What does <b>${w}</b> mean?`,
            d,
            VOCAB[f.t].map(x => x[1])
          )
        : BC(
            `Which word means: <i>${d}</i>?`,
            w,
            VOCAB[f.t].map(x => x[0])
          );
    },
  });
  fam({
    id: 'sva',
    s: 'Reading',
    n: 'Subject–Verb Agreement',
    g: [1, 5],
    foc: () => SVA_V.map(v => ({ l: `${v[0]} / ${v[1]}`, v })),
    tip: 'One person or thing (he, she, the dog) → verb gets -s: “The dog runs.” More than one (they, the dogs) → no -s: “The dogs run.”',
    gen: f => {
      const [s, n] = P(SVA_S);
      return {
        q: `Choose the correct verb:<div class="ed-big" style="font-size:19px">${s} <u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u> ${f.v[2]}.</div>`,
        a: n === 's' ? f.v[1] : f.v[0],
        ch: SH([f.v[0], f.v[1]]),
      };
    },
  });
  fam({
    id: 'punct',
    s: 'Reading',
    n: 'End Punctuation',
    g: [0, 3],
    foc: () =>
      [
        ['statements', '.'],
        ['questions', '?'],
        ['exclamations', '!'],
      ].map(([l, k]) => ({ l, k })),
    tip: 'Telling sentence → period (.). Asking sentence → question mark (?). Strong feeling → exclamation point (!).',
    gen: f => {
      const s = P(PUNCT.filter(p => p[1] === f.k));
      return {
        q: `Which mark goes at the end?<div class="ed-big" style="font-size:19px">${s[0]} ___</div>`,
        a: f.k,
        ch: ['.', '?', '!'],
      };
    },
  });
  fam({
    id: 'device',
    s: 'Reading',
    n: 'Figurative Language',
    g: [4, 12],
    foc: () => Object.keys(DEVICES).map(k => ({ l: k, k })),
    tip: 'Simile: compares with “like” or “as.” Metaphor: says one thing IS another. Personification: gives human traits to things. Hyperbole: huge exaggeration.',
    gen: f =>
      BC(
        `What kind of figurative language is this?<div class="ed-big" style="font-size:18px">“${P(DEVICES[f.k])}”</div>`,
        cap(f.k),
        Object.keys(DEVICES).map(cap)
      ),
  });
  fam({
    id: 'roots',
    s: 'Reading',
    n: 'Greek & Latin Roots',
    g: [6, 12],
    foc: () => chunk(ROOTS, 5).map((c, i) => ({ l: `set ${i + 1}`, c })),
    tip: 'Many English words are built from Greek and Latin roots. Know the root → guess the word.',
    gen: f => {
      const [r, m, ex] = P(f.c);
      return BC(
        `The root <b>${r}</b> (as in <i>${ex}</i>) means…`,
        m,
        ROOTS.map(x => x[1])
      );
    },
  });

  /* ---------- SCIENCE ---------- */
  fam({
    id: 'animal',
    s: 'Science',
    n: 'Animal Groups',
    g: [0, 5],
    foc: () => {
      const o = [];
      Object.keys(ANIMALS).forEach(k =>
        ['find', 'name'].forEach(t =>
          o.push({ l: t === 'find' ? `find the ${k}` : `what kind of animal (${k}s)`, k, t })
        )
      );
      return o;
    },
    tip: 'Mammals have hair and feed milk to babies. Birds have feathers. Reptiles have dry scales. Amphibians live in water then land. Fish have gills. Insects have 6 legs.',
    gen: f =>
      f.t === 'find'
        ? BC(
            `Which animal is ${/^[aeiou]/.test(f.k) ? 'an' : 'a'} <b>${f.k}</b>?`,
            P(ANIMALS[f.k]),
            Object.keys(ANIMALS)
              .filter(k => k !== f.k)
              .flatMap(k => ANIMALS[k])
          )
        : BC(`What kind of animal is a <b>${P(ANIMALS[f.k])}</b>?`, cap(f.k), Object.keys(ANIMALS).map(cap)),
  });
  fam({
    id: 'matter',
    s: 'Science',
    n: 'States of Matter',
    g: [0, 5],
    foc: () => {
      const o = [];
      Object.keys(MATTER).forEach(k =>
        ['find', 'name'].forEach(t =>
          o.push({ l: t === 'find' ? `find the ${k}` : `solid, liquid or gas? (${k}s)`, k, t })
        )
      );
      return o;
    },
    tip: 'Solids keep their shape. Liquids take the shape of their container. Gases spread out to fill any space.',
    gen: f =>
      f.t === 'find'
        ? BC(
            `Which one is a <b>${f.k}</b>?`,
            P(MATTER[f.k]),
            Object.keys(MATTER)
              .filter(k => k !== f.k)
              .flatMap(k => MATTER[k])
          )
        : BC(`Is <b>${P(MATTER[f.k])}</b> a solid, liquid, or gas?`, cap(f.k), ['Solid', 'Liquid', 'Gas'], 3),
  });
  fam({
    id: 'living',
    s: 'Science',
    n: 'Living & Nonliving',
    g: [0, 2],
    foc: () => [
      { l: 'find the living thing', k: 'living' },
      { l: 'find the nonliving thing', k: 'nonliving' },
    ],
    tip: 'Living things grow, need food and water, and make more of their kind. Nonliving things don’t.',
    gen: f => {
      const other = f.k === 'living' ? 'nonliving' : 'living';
      const ans = P(LIVING[f.k]);
      return { q: `Which one is <b>${f.k}</b>?`, a: ans, ch: SH([ans, ...SH(LIVING[other]).slice(0, 3)]) };
    },
  });
  fam({
    id: 'planet',
    s: 'Science',
    n: 'The Solar System',
    g: [1, 6],
    foc: () => [
      ...PLANETS.map((p, i) => ({ l: `${p} (order)`, i })),
      { l: 'planet facts', facts: 1 },
      { l: 'planet order from the Sun', order: 1 },
    ],
    tip: 'From the Sun: My Very Educated Mother Just Served Us Noodles → Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune.',
    gen: f => {
      if (f.facts) {
        const [q, a] = P(PFACTS);
        return BC(`Which planet ${q}?`, a, PLANETS);
      }
      if (f.order) {
        const i = R(0, 7);
        return BC(`Which planet is <b>${ord(i + 1)}</b> from the Sun?`, PLANETS[i], PLANETS);
      }
      return Math.random() < 0.5
        ? BC(`Which planet is <b>${ord(f.i + 1)}</b> from the Sun?`, PLANETS[f.i], PLANETS)
        : Q(`What number planet from the Sun is <b>${PLANETS[f.i]}</b>?`, f.i + 1, { min: 1 });
    },
  });
  fam({
    id: 'elem',
    s: 'Science',
    n: 'Chemical Elements',
    g: [6, 12],
    foc: () => {
      const o = [];
      chunk(ELEM, 6).forEach((c, i) =>
        ['symbol', 'name', 'atomic number'].forEach(k => o.push({ l: `elements set ${i + 1}: ${k}`, c, k }))
      );
      return o;
    },
    tip: 'Every element has a 1–2 letter symbol (first letter capital). The atomic number = number of protons.',
    gen: f => {
      const [z, s, n] = P(f.c);
      if (f.k === 'symbol')
        return BC(
          `What is the chemical symbol for <b>${n}</b>?`,
          s,
          ELEM.map(e => e[1])
        );
      if (f.k === 'name')
        return BC(
          `Which element has the symbol <b>${s}</b>?`,
          n,
          ELEM.map(e => e[2])
        );
      return Q(`What is the atomic number of <b>${n}</b>?`, z, { min: 1 });
    },
  });
  fam({
    id: 'atom',
    s: 'Science',
    n: 'Protons, Neutrons & Electrons',
    g: [8, 12],
    foc: () => {
      const o = [];
      chunk(ISO, 7).forEach((c, i) =>
        ['protons', 'neutrons', 'electrons'].forEach(k => o.push({ l: `${k}, set ${i + 1}`, c, k }))
      );
      return o;
    },
    tip: 'Protons = atomic number. Neutrons = mass number − atomic number. In a neutral atom, electrons = protons.',
    gen: f => {
      const [n, z, A] = P(f.c);
      return Q(
        `A neutral atom of <b>${n}</b> has atomic number ${z} and mass number ${A}. How many <b>${f.k}</b> does it have?`,
        f.k === 'neutrons' ? A - z : z,
        { min: 0, extra: [A, f.k === 'neutrons' ? z : A - z] }
      );
    },
  });
  fam({
    id: 'body',
    s: 'Science',
    n: 'The Human Body',
    g: [2, 10],
    foc: () => {
      const o = [];
      chunk(BODY, 5).forEach((c, i) =>
        ['job', 'which organ', 'body system'].forEach(k => o.push({ l: `set ${i + 1}: ${k}`, c, k }))
      );
      return o;
    },
    tip: 'Organs work together in systems. The heart and blood vessels = circulatory system. Lungs = respiratory system.',
    gen: f => {
      const [o, j, s] = P(f.c);
      if (f.k === 'job')
        return BC(
          `What does the <b>${o}</b> do?`,
          j,
          BODY.map(b => b[1])
        );
      if (f.k === 'which organ')
        return BC(
          `Which part of the body ${j}?`,
          o,
          BODY.map(b => b[0])
        );
      return BC(`Which body system includes the <b>${o}</b>?`, cap(s), [
        ...new Set(BODY.map(b => cap(b[2]))),
      ]);
    },
  });
  fam({
    id: 'cell',
    s: 'Science',
    n: 'Cells & Organelles',
    g: [6, 10],
    foc: () => {
      const o = [];
      chunk(CELL, 4).forEach((c, i) =>
        ['job', 'name'].forEach(k => o.push({ l: `set ${i + 1}: ${k}`, c, k }))
      );
      return o;
    },
    tip: 'Cells are the building blocks of life. Each organelle has a job, like tiny organs.',
    gen: f => {
      const [n, j] = P(f.c);
      return f.k === 'job'
        ? BC(
            `What does the <b>${n}</b> do?`,
            j,
            CELL.map(c => c[1])
          )
        : BC(
            `Which part of the cell ${j}?`,
            n,
            CELL.map(c => c[0])
          );
    },
  });
  fam({
    id: 'mach',
    s: 'Science',
    n: 'Simple Machines',
    g: [2, 5],
    foc: () => Object.keys(MACHINES).map(k => ({ l: k, k })),
    tip: 'The six simple machines: lever, pulley, wheel and axle, inclined plane, wedge, and screw.',
    gen: f =>
      BC(
        `<b>${cap(P(MACHINES[f.k]))}</b> is an example of which simple machine?`,
        cap(f.k),
        Object.keys(MACHINES).map(cap)
      ),
  });
  fam({
    id: 'food',
    s: 'Science',
    n: 'Food Chains',
    g: [2, 7],
    foc: () => Object.keys(FOODCHAIN).map(k => ({ l: k + 's', k })),
    tip: 'Producers make food from sunlight. Herbivores eat plants. Carnivores eat animals. Omnivores eat both. Decomposers break down dead things.',
    gen: f =>
      BC(`In a food chain, <b>${P(FOODCHAIN[f.k])}</b> is a…`, cap(f.k), Object.keys(FOODCHAIN).map(cap)),
  });
  fam({
    id: 'rock',
    s: 'Science',
    n: 'Rocks',
    g: [3, 7],
    foc: () => [...Object.keys(ROCKS).map(k => ({ l: `${k} rocks`, k })), { l: 'how rocks form', how: 1 }],
    tip: 'Igneous rock comes from cooled magma. Sedimentary rock forms in layers. Metamorphic rock is changed by heat and pressure.',
    gen: f => {
      if (f.how) {
        const k = P(Object.keys(ROCKS));
        return BC(`Which type of rock ${ROCKHOW[k]}?`, cap(k), Object.keys(ROCKS).map(cap), 3);
      }
      return BC(`What type of rock is <b>${P(ROCKS[f.k])}</b>?`, cap(f.k), Object.keys(ROCKS).map(cap), 3);
    },
  });
  fam({
    id: 'earth',
    s: 'Science',
    n: 'Earth & Weather',
    g: [2, 7],
    foc: () =>
      chunk(EARTHSCI, 5).map((c, i) => ({
        l: ['the water cycle', 'weather tools', 'layers of the Earth'][i],
        c,
      })),
    tip: 'Water moves in a cycle: evaporation → condensation → precipitation → collection.',
    gen: f => {
      const [q, a] = P(f.c);
      return BC(
        `${q}:`,
        cap(a),
        f.c.map(x => cap(x[1]))
      );
    },
  });
  const PHYS = [
    ['speed', 's = d ÷ t', 'm/s'],
    ['distance', 'd = s × t', 'm'],
    ['time', 't = d ÷ s', 's'],
    ['force', 'F = m × a', 'N'],
    ['mass', 'm = F ÷ a', 'kg'],
    ['acceleration', 'a = F ÷ m', 'm/s²'],
    ['density', 'ρ = m ÷ V', 'g/cm³'],
    ['work', 'W = F × d', 'J'],
    ['voltage', 'V = I × R', 'V'],
    ['current', 'I = V ÷ R', 'A'],
    ['kinetic energy', 'KE = ½ m v²', 'J'],
    ['momentum', 'p = m × v', 'kg·m/s'],
    ['power', 'P = W ÷ t', 'W'],
    ['weight', 'W = m × g (g = 10 m/s²)', 'N'],
  ];
  fam({
    id: 'phys',
    s: 'Science',
    n: 'Physics Formulas',
    g: [6, 12],
    foc: g => PHYS.filter((_, i) => g >= 8 || i < 8).map(p => ({ l: `${p[0]} (${p[1]})`, p })),
    tip: 'Write the formula, plug in the numbers with units, then solve. Keep track of units!',
    gen: (f, lv) => {
      const [k, fm, u] = f.p,
        a = R(2, 5 + lv * 2),
        b = R(2, 5 + lv * 2),
        U = v => FN(v) + ' ' + u;
      let q, ans;
      switch (k) {
        case 'speed':
          q = `A car travels ${a * b} m in ${b} s. What is its speed?`;
          ans = a;
          break;
        case 'distance':
          q = `A bike moves at ${a} m/s for ${b} s. How far does it go?`;
          ans = a * b;
          break;
        case 'time':
          q = `A runner goes ${a * b} m at ${a} m/s. How many seconds does it take?`;
          ans = b;
          break;
        case 'force':
          q = `A ${a} kg cart accelerates at ${b} m/s². What force pushes it?`;
          ans = a * b;
          break;
        case 'mass':
          q = `A force of ${a * b} N gives an object an acceleration of ${b} m/s². What is its mass?`;
          ans = a;
          break;
        case 'acceleration':
          q = `A ${a} kg box is pushed with ${a * b} N. What is its acceleration?`;
          ans = b;
          break;
        case 'density':
          q = `A block has a mass of ${a * b} g and a volume of ${b} cm³. What is its density?`;
          ans = a;
          break;
        case 'work':
          q = `You push with ${a} N for ${b} m. How much work do you do?`;
          ans = a * b;
          break;
        case 'voltage':
          q = `A current of ${a} A flows through a ${b} Ω resistor. What is the voltage?`;
          ans = a * b;
          break;
        case 'current':
          q = `A ${a * b} V battery is connected to a ${b} Ω resistor. What is the current?`;
          ans = a;
          break;
        case 'kinetic energy': {
          const m = 2 * R(1, 3 + lv);
          q = `A ${m} kg ball moves at ${b} m/s. What is its kinetic energy?`;
          ans = (m * b * b) / 2;
          break;
        }
        case 'momentum':
          q = `A ${a} kg object moves at ${b} m/s. What is its momentum?`;
          ans = a * b;
          break;
        case 'power':
          q = `A machine does ${a * b} J of work in ${b} s. What is its power?`;
          ans = a;
          break;
        default:
          q = `What is the weight of a ${a} kg object? (g = 10 m/s²)`;
          ans = a * 10;
      }
      return Q(q, ans, { min: 0, fmt: U, extra: [k.includes('energy') ? ans * 2 : a + b] });
    },
  });
  const CROSS = [
    ['AA', 'aa'],
    ['Aa', 'aa'],
    ['Aa', 'Aa'],
    ['AA', 'Aa'],
    ['AA', 'AA'],
    ['aa', 'aa'],
  ];
  fam({
    id: 'gene',
    s: 'Science',
    n: 'Genetics (Punnett Squares)',
    g: [7, 12],
    foc: () => {
      const o = [];
      CROSS.forEach(c =>
        ['AA', 'Aa', 'aa', 'dominant trait', 'recessive trait'].forEach(k =>
          o.push({ l: `${c[0]} × ${c[1]}: ${k}`, c, k })
        )
      );
      return o;
    },
    tip: 'Put one parent’s letters on top and the other’s on the side, fill in the 4 boxes. Capital A is dominant: AA and Aa show the dominant trait, only aa shows recessive.',
    gen: f => {
      const kids = [];
      for (const x of f.c[0]) for (const y of f.c[1]) kids.push([x, y].sort().join(''));
      const cnt = k =>
        kids.filter(g =>
          k === 'dominant trait' ? g.includes('A') : k === 'recessive trait' ? g === 'aa' : g === k
        ).length;
      const ans = cnt(f.k) * 25;
      return BC(
        `Cross <b>${f.c[0]} × ${f.c[1]}</b> (A = dominant). What percent of offspring ${f.k.includes('trait') ? `show the <b>${f.k}</b>` : `are <b>${f.k}</b>`}?`,
        ans + '%',
        ['0%', '25%', '50%', '75%', '100%']
      );
    },
  });

  /* ---------- SOCIAL STUDIES ---------- */
  fam({
    id: 'caps',
    s: 'Social Studies',
    n: 'U.S. State Capitals',
    g: [3, 8],
    foc: () => {
      const o = [];
      chunk(STATES, 5).forEach((c, i) =>
        ['capital of', 'state for capital'].forEach(k =>
          o.push({ l: `${c[0][0]}–${c[c.length - 1][0]}: ${k}`, c, k })
        )
      );
      return o;
    },
    tip: 'The capital is the city where the state government meets. It’s often NOT the biggest city!',
    gen: f => {
      const [s, c] = P(f.c);
      return f.k === 'capital of'
        ? BC(
            `What is the capital of <b>${s}</b>?`,
            c,
            STATES.map(x => x[1])
          )
        : BC(
            `<b>${c}</b> is the capital of which state?`,
            s,
            STATES.map(x => x[0])
          );
    },
  });
  fam({
    id: 'world',
    s: 'Social Studies',
    n: 'World Capitals',
    g: [5, 12],
    foc: () => {
      const o = [];
      CONTINENTS.forEach(ct =>
        chunk(
          COUNTRIES.filter(c => c[2] === ct),
          6
        ).forEach((c, i) =>
          ['capital of', 'country for capital'].forEach(k => o.push({ l: `${ct} ${i + 1}: ${k}`, c, k }))
        )
      );
      return o;
    },
    tip: 'Learn capitals by region. Picture the map and where each country sits.',
    gen: f => {
      const [n, c] = P(f.c);
      return f.k === 'capital of'
        ? BC(
            `What is the capital of <b>${n}</b>?`,
            c,
            COUNTRIES.map(x => x[1])
          )
        : BC(
            `<b>${c}</b> is the capital of which country?`,
            n,
            COUNTRIES.map(x => x[0])
          );
    },
  });
  fam({
    id: 'cont',
    s: 'Social Studies',
    n: 'Continents',
    g: [2, 8],
    foc: () => [
      ...CONTINENTS.map(ct => ({ l: `countries in ${ct}`, ct })),
      ...chunk(COUNTRIES, 12).map((c, i) => ({ l: `which continent? set ${i + 1}`, c })),
    ],
    tip: 'The 7 continents: North America, South America, Europe, Asia, Africa, Australia/Oceania and Antarctica.',
    gen: f => {
      if (f.ct)
        return BC(
          `Which country is in <b>${f.ct}</b>?`,
          P(COUNTRIES.filter(c => c[2] === f.ct))[0],
          COUNTRIES.filter(c => c[2] !== f.ct).map(c => c[0])
        );
      const [n, , ct] = P(f.c);
      return BC(`Which continent is <b>${n}</b> in?`, ct, CONTINENTS);
    },
  });
  fam({
    id: 'pres',
    s: 'Social Studies',
    n: 'U.S. Presidents',
    g: [4, 12],
    foc: () => {
      const o = [];
      chunk(
        PRES.map((p, i) => [i + 1, p]),
        5
      ).forEach(c =>
        ['who', 'number'].forEach(k =>
          o.push({
            l: `#${c[0][0]}–${c[c.length - 1][0]}: ${k === 'who' ? 'who was it?' : 'which number?'}`,
            c,
            k,
          })
        )
      );
      return o;
    },
    tip: 'Learn the presidents in groups of five, in order. Grover Cleveland and Donald Trump each served two non-consecutive terms.',
    gen: f => {
      const c = f.k === 'number' ? f.c.filter(([, p]) => PRES.indexOf(p) === PRES.lastIndexOf(p)) : f.c;
      const [n, p] = P(c.length ? c : f.c);
      if (f.k === 'number' && c.length) return Q(`<b>${p}</b> was which number president?`, n, { min: 1 });
      return BC(
        `Who was the <b>${ord(n)}</b> president of the United States?`,
        p,
        PRES.filter((x, i) => Math.abs(i + 1 - n) <= 8)
      );
    },
  });
  fam({
    id: 'hist',
    s: 'Social Studies',
    n: 'History Timeline',
    g: [4, 12],
    foc: () => chunk(EVENTS, 4).map((c, i) => ({ l: `${c[0][1]}–${c[c.length - 1][1]}`, c })),
    tip: 'Anchor big events to years you know (1492, 1776, 1865, 1945) and build the timeline around them.',
    gen: (f, lv) => {
      const [e, y] = P(f.c);
      return Q(`In what year: <b>${e}</b>?`, y, { step: lv > 5 ? 1 : 10, extra: [y + 1, y - 1, y + 10] });
    },
  });
  fam({
    id: 'civ',
    s: 'Social Studies',
    n: 'U.S. Government & Civics',
    g: [3, 12],
    foc: () => chunk(CIVICS, 4).map((c, i) => ({ l: `set ${i + 1}`, c })),
    tip: 'Three branches: Legislative (Congress makes laws), Executive (President enforces laws), Judicial (courts interpret laws).',
    gen: f => {
      const [q, a, ch] = P(f.c);
      return { q, a, ch: SH(ch) };
    },
  });
  const DIR4 = ['North', 'East', 'South', 'West'];
  fam({
    id: 'dir',
    s: 'Social Studies',
    n: 'Map Directions',
    g: [1, 4],
    foc: () => {
      const o = [];
      DIR4.forEach((d, i) =>
        ['right', 'left', 'around'].forEach(t => o.push({ l: `facing ${d}, turning ${t}`, i, t }))
      );
      return o;
    },
    tip: 'Clockwise: North → East → South → West. A right turn moves one step clockwise, left moves one step back.',
    gen: (f, lv) => {
      const n = Math.min(4, 1 + Math.floor(lv / 3)),
        step = { right: 1, left: -1, around: 2 }[f.t];
      const turns = f.t === 'around' ? 'turn around' : n === 1 ? `turn ${f.t}` : `turn ${f.t} ${n} times`;
      const tot = f.t === 'around' ? 2 : step * n;
      return BC(
        `You are facing <b>${DIR4[f.i]}</b>. You ${turns}. Which way are you facing now?`,
        DIR4[(((f.i + tot) % 4) + 4) % 4],
        DIR4
      );
    },
  });
  fam({
    id: 'help',
    s: 'Social Studies',
    n: 'Community Helpers',
    g: [0, 2],
    foc: () => chunk(HELPERS, 4).map((c, i) => ({ l: `helpers set ${i + 1}`, c })),
    tip: 'Community helpers are people whose jobs keep our town safe, healthy and running.',
    gen: f => {
      const [q, a] = P(f.c);
      return BC(
        q,
        cap(a),
        HELPERS.map(h => cap(h[1]))
      );
    },
  });

  /* ---------- EXTRA: early grades ---------- */
  const SHP = [
    ['circle', 0],
    ['triangle', 3],
    ['square', 4],
    ['rectangle', 4],
    ['pentagon', 5],
    ['hexagon', 6],
    ['octagon', 8],
  ];
  fam({
    id: 'shape',
    s: 'Math',
    n: 'Shapes',
    g: [0, 2],
    foc: () => {
      const o = [];
      SHP.forEach(([n, s]) => {
        o.push({ l: `sides of a ${n}`, n, s, k: 'sides' });
        o.push({ l: `corners of a ${n}`, n, s, k: 'corners' });
        if (s !== 4) o.push({ l: `which shape has ${s} sides`, n, s, k: 'which' });
      });
      return o;
    },
    tip: 'Count the straight sides. A triangle has 3, a square has 4, a hexagon has 6. Corners = where two sides meet.',
    gen: f =>
      f.k === 'which'
        ? BC(
            `Which shape has <b>${f.s}</b> ${f.s === 0 ? 'sides (it is perfectly round)' : 'sides'}?`,
            cap(f.n),
            SHP.filter(x => x[1] !== f.s).map(x => cap(x[0]))
          )
        : Q(`How many <b>${f.k}</b> does a <b>${f.n}</b> have?`, f.s, { min: 0 }),
  });
  fam({
    id: 'more',
    s: 'Math',
    n: 'More or Fewer',
    g: [0, 1],
    foc: () => {
      const o = [];
      EMO.forEach(e => ['more', 'fewer'].forEach(k => o.push({ l: `${k} ${e}`, e, k })));
      return o;
    },
    tip: 'Line the two groups up one-to-one. The group with some left over has MORE. The other has FEWER.',
    gen: (f, lv) => {
      const e2 = P(EMO.filter(x => x !== f.e));
      let a = R(1, 3 + lv),
        b;
      do b = R(1, 3 + lv);
      while (b === a);
      const win = f.k === 'more' ? (a > b ? f.e : e2) : a < b ? f.e : e2;
      return {
        q: `Which group has <b>${f.k}</b>?<div class="ed-emo">${f.e.repeat(a)}</div><div class="ed-emo">${e2.repeat(b)}</div>`,
        a: win,
        ch: [f.e, e2],
      };
    },
  });
  fam({
    id: 'picmath',
    s: 'Math',
    n: 'Picture Math',
    g: [0, 1],
    foc: () => {
      const o = [];
      EMO.forEach(e => ['add', 'take away'].forEach(k => o.push({ l: `${k} ${e}`, e, k })));
      return o;
    },
    tip: 'Count the first group, then count on for adding — or cross some out for taking away.',
    gen: (f, lv) => {
      const m = 2 + Math.ceil(lv / 2);
      if (f.k === 'add') {
        const a = R(1, m),
          b = R(1, m);
        return Q(`<div class="ed-emo">${f.e.repeat(a)} ➕ ${f.e.repeat(b)}</div>How many in all?`, a + b, {
          min: 0,
        });
      }
      const a = R(2, m + 3),
        b = R(1, a - 1);
      return Q(`<div class="ed-emo">${f.e.repeat(a)}</div>Take away <b>${b}</b>. How many are left?`, a - b, {
        min: 0,
      });
    },
  });

  /* ---------- EXTRA: high school ---------- */
  const pair = (p, q) => {
    const [u, v] = [p, q].sort((m, n) => m - n);
    return u === v ? `x = ${MS(u)}` : `x = ${MS(u)}, ${MS(v)}`;
  };
  fam({
    id: 'yint',
    s: 'Math',
    n: 'Slope-Intercept Form',
    g: [8, 12],
    foc: () => SLOPES.map(([n, d]) => ({ l: `slope ${FR(n, d)}, find b`, n, d })),
    tip: 'y = mx + b. Plug in the slope and a point, then solve for b (the y-intercept).',
    gen: (f, lv) => {
      const x = f.d * R(-3, 3),
        y = R(-8 - lv, 8 + lv),
        b = y - (f.n * x) / f.d;
      return Q(
        `A line has slope <b>${FR(f.n, f.d)}</b> and passes through (${MS(x)}, ${MS(y)}). What is its y-intercept <i>b</i>?`,
        b,
        { extra: [y + (f.n * x) / f.d, -b] }
      );
    },
  });
  fam({
    id: 'absq',
    s: 'Math',
    n: 'Absolute Value Equations',
    g: [8, 12],
    foc: () => range(-10, 10).map(a => ({ l: `|x ${a < 0 ? '+' : '−'} ${Math.abs(a)}| = b`, a })),
    tip: '|x − a| = b means x − a = b OR x − a = −b. So x = a + b or x = a − b.',
    gen: (f, lv) => {
      const b = R(1, 3 + lv);
      return BC(
        `Solve: <b>|<i>x</i> ${f.a < 0 ? '+' : '−'} ${Math.abs(f.a)}| = ${b}</b>`,
        pair(f.a + b, f.a - b),
        [
          pair(-f.a + b, -f.a - b),
          `x = ${MS(f.a + b)}`,
          pair(b - f.a, -b - f.a),
          pair(f.a + b + 1, f.a - b - 1),
          'no solution',
        ]
      );
    },
  });
  const IOP = ['<', '>', '≤', '≥'],
    FLIP = { '<': '>', '>': '<', '≤': '≥', '≥': '≤' };
  fam({
    id: 'ineq',
    s: 'Math',
    n: 'Linear Inequalities',
    g: [7, 12],
    foc: () => {
      const o = [];
      for (const a of [...range(-6, -2), ...range(2, 8)])
        IOP.forEach(op => o.push({ l: `${a}x + b ${op} c`, a, op }));
      return o;
    },
    tip: 'Solve like an equation — but if you multiply or divide by a NEGATIVE, flip the inequality sign.',
    gen: (f, lv) => {
      const k = R(-5 - lv, 5 + lv),
        b = R(-10, 10),
        c = f.a * k + b,
        sol = f.a < 0 ? FLIP[f.op] : f.op;
      return BC(
        `Solve: <b>${MS(f.a)}<i>x</i> ${b < 0 ? '−' : '+'} ${Math.abs(b)} ${f.op} ${MS(c)}</b>`,
        `x ${sol} ${MS(k)}`,
        [
          `x ${FLIP[sol]} ${MS(k)}`,
          `x ${sol} ${MS(-k)}`,
          `x ${FLIP[sol]} ${MS(-k)}`,
          `x ${sol} ${MS(k + 1)}`,
          `x ${FLIP[sol]} ${MS(k - 1)}`,
        ]
      );
    },
  });
  fam({
    id: 'comp',
    s: 'Math',
    n: 'Function Composition',
    g: [9, 12],
    foc: () => {
      const o = [];
      for (const k of range(-5, 5))
        ['f(g(x))', 'g(f(x))'].forEach(t => o.push({ l: `${t} at x = ${MS(k)}`, k, t }));
      return o;
    },
    tip: 'f(g(x)): find g(x) first, then plug that answer into f.',
    gen: (f, lv) => {
      const a = R(-3 - lv, 3 + lv) || 2,
        b = R(-9, 9),
        c = R(-3 - lv, 3 + lv) || 3,
        d = R(-9, 9),
        F = x => a * x + b,
        G = x => c * x + d;
      const ans = f.t === 'f(g(x))' ? F(G(f.k)) : G(F(f.k)),
        wrong = f.t === 'f(g(x))' ? G(F(f.k)) : F(G(f.k));
      return Q(
        `f(<i>x</i>) = ${lin(a, b)} and g(<i>x</i>) = ${lin(c, d)}. What is ${f.t.replace('x', MS(f.k))}?`,
        ans,
        { extra: [wrong, F(f.k) * G(f.k)] }
      );
    },
  });
  fam({
    id: 'det',
    s: 'Math',
    n: 'Matrix Determinants',
    g: [10, 12],
    foc: () => range(2, 12).map(n => ({ l: `2×2, entries up to ${n}`, n })),
    tip: 'For [[a, b], [c, d]], the determinant is ad − bc.',
    gen: f => {
      const [a, b, c, d] = range(1, 4).map(() => R(-f.n, f.n));
      return Q(
        `Find the determinant:<div class="ed-mat"><span>${MS(a)}</span><span>${MS(b)}</span><span>${MS(c)}</span><span>${MS(d)}</span></div>`,
        a * d - b * c,
        { extra: [a * d + b * c, a * c - b * d] }
      );
    },
  });
  const IPOW = ['1', 'i', '−1', '−i'];
  const cx = (re, im) => {
    const I = im === 1 ? 'i' : im === -1 ? '−i' : `${MS(im)}i`;
    if (!im) return MS(re);
    if (!re) return I;
    return `${MS(re)} ${im < 0 ? '−' : '+'} ${Math.abs(im) === 1 ? '' : Math.abs(im)}i`;
  };
  fam({
    id: 'ipow',
    s: 'Math',
    n: 'Powers of i',
    g: [10, 12],
    foc: () => range(2, 40).map(n => ({ l: `i^${n}`, n })),
    tip: 'i¹ = i, i² = −1, i³ = −i, i⁴ = 1 — then it repeats every 4. Divide the exponent by 4 and use the remainder.',
    gen: f => ({ q: `Simplify <b><i>i</i><sup>${f.n}</sup></b>`, a: IPOW[f.n % 4], ch: SH(IPOW) }),
  });
  fam({
    id: 'cmul',
    s: 'Math',
    n: 'Complex Numbers',
    g: [10, 12],
    foc: () => {
      const o = [];
      for (let a = 1; a <= 9; a++)
        ['add', 'multiply'].forEach(k => o.push({ l: `${k}, real part ${a}`, a, k }));
      return o;
    },
    tip: 'Treat i like a variable, but replace i² with −1. (a + bi)(c + di) = (ac − bd) + (ad + bc)i.',
    gen: (f, lv) => {
      const nz = () => R(1, 2 + lv) * P([1, -1]);
      const a = f.a,
        b = nz(),
        c = nz(),
        d = nz();
      const p = `(${cx(a, b)})`,
        q = `(${cx(c, d)})`;
      if (f.k === 'add')
        return BC(`${p} + ${q} = ?`, cx(a + c, b + d), [
          cx(a + c, b - d),
          cx(a - c, b + d),
          cx(a + b, c + d),
          cx(a * c, b * d),
        ]);
      return BC(`${p}${q} = ?`, cx(a * c - b * d, a * d + b * c), [
        cx(a * c + b * d, a * d + b * c),
        cx(a * c - b * d, a * d - b * c),
        cx(a * c, b * d),
        cx(a * c + b * d, a * d - b * c),
      ]);
    },
  });
  fam({
    id: 'z',
    s: 'Math',
    n: 'Z-Scores',
    g: [9, 12],
    foc: () => range(2, 12).map(s => ({ l: `standard deviation ${s}`, s })),
    tip: 'z = (x − mean) ÷ standard deviation. It tells how many standard deviations x is from the mean.',
    gen: f => {
      const mu = R(50, 100),
        z = R(-3, 3),
        x = mu + z * f.s;
      return Q(
        `Scores have a mean of ${mu} and a standard deviation of ${f.s}. What is the z-score of ${x}?`,
        z,
        { extra: [-z, x - mu] }
      );
    },
  });
  fam({
    id: 'series',
    s: 'Math',
    n: 'Series (Sums)',
    g: [10, 12],
    foc: () => [
      ...range(1, 10).map(d => ({ l: `arithmetic, difference ${d}`, d })),
      { l: 'geometric, ratio 2', r: 2 },
      { l: 'geometric, ratio 3', r: 3 },
    ],
    tip: 'Arithmetic sum = n × (first + last) ÷ 2. Geometric sum = a(rⁿ − 1) ÷ (r − 1).',
    gen: (f, lv) => {
      if (f.r) {
        const a = R(1, 5),
          n = R(3, 3 + Math.ceil(lv / 2));
        return Q(
          `Find the sum of the first ${n} terms: ${a}, ${a * f.r}, ${a * f.r * f.r}, …`,
          (a * (f.r ** n - 1)) / (f.r - 1),
          { min: 1, extra: [a * f.r ** n, a * f.r ** (n - 1)] }
        );
      }
      const a = R(1, 10),
        n = R(5, 5 + lv * 2),
        last = a + (n - 1) * f.d;
      return Q(
        `Find the sum of the first ${n} terms: ${a}, ${a + f.d}, ${a + 2 * f.d}, …`,
        (n * (a + last)) / 2,
        { min: 1, extra: [last, n * last] }
      );
    },
  });
  fam({
    id: 'lim',
    s: 'Math',
    n: 'Limits at Infinity',
    g: [11, 12],
    foc: () => {
      const o = [];
      for (let n = 1; n <= 3; n++)
        for (let m = 1; m <= 3; m++) o.push({ l: `degree ${n} over degree ${m}`, n, m });
      return o;
    },
    tip: 'Compare the highest powers. Top smaller → 0. Same → ratio of leading coefficients. Top bigger → ±∞.',
    gen: f => {
      const a = R(1, 9) * P([1, -1]),
        b = R(1, 9);
      const top = poly([a, ...range(1, f.n).map(() => R(-5, 5))]),
        bot = poly([b, ...range(1, f.m).map(() => R(-5, 5))]);
      const ans = f.n < f.m ? '0' : f.n === f.m ? FR(a, b) : a > 0 ? '∞' : '−∞';
      return BC(`lim<sub>x→∞</sub> (${top}) / (${bot}) = ?`, ans, ['0', FR(a, b), '∞', '−∞', FR(b, a), '1']);
    },
  });
  fam({
    id: 'dpoly',
    s: 'Math',
    n: 'Derivatives of Polynomials',
    g: [11, 12],
    foc: () => range(-3, 3).map(k => ({ l: `f′(${MS(k)})`, k })),
    tip: 'Take the derivative of each term with the power rule, then plug in the x-value.',
    gen: (f, lv) => {
      const a = R(1, 2 + Math.ceil(lv / 3)) * P([1, -1]),
        b = R(-5, 5),
        c = R(-9, 9),
        d = R(-9, 9),
        k = f.k;
      return Q(
        `If f(<i>x</i>) = ${poly([a, b, c, d])}, what is f′(${MS(k)})?`,
        3 * a * k * k + 2 * b * k + c,
        { extra: [a * k ** 3 + b * k * k + c * k + d, 3 * a * k + 2 * b + c] }
      );
    },
  });
  const radS = deg => {
    const g = GCD(deg, 180),
      n = deg / g,
      d = 180 / g;
    return `${n === 1 ? '' : n}π${d === 1 ? '' : '/' + d}`;
  };
  fam({
    id: 'rad',
    s: 'Math',
    n: 'Degrees & Radians',
    g: [10, 12],
    foc: () => {
      const o = [];
      for (let d = 15; d <= 360; d += 15)
        ['to radians', 'to degrees'].forEach(k => o.push({ l: `${d}° ${k}`, d, k }));
      return o;
    },
    tip: 'Degrees → radians: multiply by π/180. Radians → degrees: multiply by 180/π. 180° = π.',
    gen: f =>
      f.k === 'to radians'
        ? BC(
            `Convert <b>${f.d}°</b> to radians.`,
            radS(f.d),
            [15, 30, 45, 60, 90, 120, 135, 150, 180, 210, 240, 270, 300, 330, 360]
              .filter(x => x !== f.d && Math.abs(x - f.d) <= 120)
              .map(radS)
          )
        : Q(`Convert <b>${radS(f.d)}</b> radians to degrees.`, f.d, { min: 0, step: 15, fmt: v => v + '°' }),
  });
  fam({
    id: 'lrule',
    s: 'Math',
    n: 'Logarithm Rules',
    g: [10, 12],
    foc: () => {
      const o = [];
      for (let b = 2; b <= 10; b++)
        ['product', 'quotient', 'power'].forEach(k => o.push({ l: `base ${b}, ${k} rule`, b, k }));
      return o;
    },
    tip: 'log(x) + log(y) = log(xy) · log(x) − log(y) = log(x/y) · k·log(x) = log(xᵏ)',
    gen: (f, lv) => {
      const B = `log<sub>${f.b}</sub>`,
        x = R(2, 5 + lv),
        y = R(2, 5 + lv);
      if (f.k === 'product') return Q(`${B}(${x}) + ${B}(${y}) = ${B}(?)`, x * y, { min: 1, extra: [x + y] });
      if (f.k === 'quotient')
        return Q(`${B}(${x * y}) − ${B}(${y}) = ${B}(?)`, x, { min: 1, extra: [x * y - y] });
      const k = R(2, 3);
      return Q(`${k} · ${B}(${x}) = ${B}(?)`, x ** k, { min: 1, extra: [k * x] });
    },
  });
  fam({
    id: 'disc',
    s: 'Money',
    n: 'Discounts & Sales Tax',
    g: [7, 12],
    foc: () => {
      const o = [];
      for (let p = 10; p <= 50; p += 5) [5, 8, 10].forEach(t => o.push({ l: `${p}% off, ${t}% tax`, p, t }));
      return o;
    },
    tip: 'Take the discount off first, then add tax on the new price. You can’t just add or subtract the percents!',
    gen: (f, lv) => {
      const Pp = 20 * R(1, 5 + lv * 5),
        fin = Math.round((Pp * (100 - f.p) * (100 + f.t)) / 100);
      return Q(
        `A jacket costs <b>$${Pp}</b>. It’s <b>${f.p}% off</b>, then <b>${f.t}% sales tax</b> is added. What do you pay?`,
        fin,
        { min: 0, fmt: USD, step: 25, extra: [Pp * (100 - f.p + f.t), Pp * (100 - f.p)] }
      );
    },
  });

  /* ===================== CANDLE ARCADE (6 modes × 10 levels = 60 games) ===================== */
  const r1 = v => Math.round(v * 100) / 100;
  const mk = (o, c, up, dn) => ({
    o: r1(o),
    c: r1(c),
    h: r1(Math.max(o, c) + up),
    l: r1(Math.min(o, c) - dn),
  });
  function trend(n, dir, p, u, lv) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const o = p + (Math.random() - 0.5) * u * 0.2,
        body = u * (0.4 + Math.random() * 0.7),
        counter = lv >= 5 && Math.random() < 0.2;
      const c = o + (counter ? -dir * body * 0.5 : dir * body);
      out.push(mk(o, c, u * Math.random() * 0.35, u * Math.random() * 0.35));
      p = c;
    }
    return out;
  }
  const PATS = [
    {
      id: 'hammer',
      n: 'Hammer',
      sig: 'Bullish',
      ctx: -1,
      b: (p, u) => {
        const o = p - u * 0.15,
          c = o + u * 0.25;
        return [mk(o, c, u * 0.04, u * 1.1)];
      },
    },
    {
      id: 'star',
      n: 'Shooting Star',
      sig: 'Bearish',
      ctx: 1,
      b: (p, u) => {
        const o = p + u * 0.15,
          c = o - u * 0.25;
        return [mk(o, c, u * 1.1, u * 0.04)];
      },
    },
    {
      id: 'doji',
      n: 'Doji',
      sig: 'Indecision',
      ctx: 0,
      b: (p, u) => {
        const o = p;
        return [mk(o, o + u * 0.02, u * 0.7, u * 0.7)];
      },
    },
    {
      id: 'bulleng',
      n: 'Bullish Engulfing',
      sig: 'Bullish',
      ctx: -1,
      b: (p, u) => {
        const a = mk(p, p - u * 0.6, u * 0.08, u * 0.08);
        return [a, mk(a.c - u * 0.1, p + u * 0.25, u * 0.08, u * 0.05)];
      },
    },
    {
      id: 'beareng',
      n: 'Bearish Engulfing',
      sig: 'Bearish',
      ctx: 1,
      b: (p, u) => {
        const a = mk(p, p + u * 0.6, u * 0.08, u * 0.08);
        return [a, mk(a.c + u * 0.1, p - u * 0.25, u * 0.05, u * 0.08)];
      },
    },
    {
      id: 'bullmaru',
      n: 'Bullish Marubozu',
      sig: 'Bullish',
      ctx: 0,
      b: (p, u) => [mk(p, p + u * 1.4, 0, 0)],
    },
    {
      id: 'bearmaru',
      n: 'Bearish Marubozu',
      sig: 'Bearish',
      ctx: 0,
      b: (p, u) => [mk(p, p - u * 1.4, 0, 0)],
    },
    {
      id: 'mstar',
      n: 'Morning Star',
      sig: 'Bullish',
      ctx: -1,
      b: (p, u) => {
        const a = mk(p, p - u * 1.2, u * 0.08, u * 0.08),
          m = a.c - u * 0.35;
        return [a, mk(m, m - u * 0.12, u * 0.1, u * 0.1), mk(m + u * 0.05, p - u * 0.3, u * 0.06, u * 0.06)];
      },
    },
    {
      id: 'estar',
      n: 'Evening Star',
      sig: 'Bearish',
      ctx: 1,
      b: (p, u) => {
        const a = mk(p, p + u * 1.2, u * 0.08, u * 0.08),
          m = a.c + u * 0.35;
        return [a, mk(m, m + u * 0.12, u * 0.1, u * 0.1), mk(m - u * 0.05, p + u * 0.3, u * 0.06, u * 0.06)];
      },
    },
    {
      id: 'soldiers',
      n: 'Three White Soldiers',
      sig: 'Bullish',
      ctx: -1,
      b: (p, u) => {
        const o = [];
        let s = p;
        for (let i = 0; i < 3; i++) {
          const c = mk(s, s + u * 0.9, u * 0.08, u * 0.06);
          o.push(c);
          s = c.c - u * 0.3;
        }
        return o;
      },
    },
    {
      id: 'crows',
      n: 'Three Black Crows',
      sig: 'Bearish',
      ctx: 1,
      b: (p, u) => {
        const o = [];
        let s = p;
        for (let i = 0; i < 3; i++) {
          const c = mk(s, s - u * 0.9, u * 0.06, u * 0.08);
          o.push(c);
          s = c.c + u * 0.3;
        }
        return o;
      },
    },
    {
      id: 'pierce',
      n: 'Piercing Line',
      sig: 'Bullish',
      ctx: -1,
      b: (p, u) => {
        const a = mk(p, p - u, u * 0.06, u * 0.06);
        return [a, mk(a.l - u * 0.2, p - u * 0.3, u * 0.05, u * 0.05)];
      },
    },
    {
      id: 'cloud',
      n: 'Dark Cloud Cover',
      sig: 'Bearish',
      ctx: 1,
      b: (p, u) => {
        const a = mk(p, p + u, u * 0.06, u * 0.06);
        return [a, mk(a.h + u * 0.2, p + u * 0.3, u * 0.05, u * 0.05)];
      },
    },
    {
      id: 'bullharami',
      n: 'Bullish Harami',
      sig: 'Bullish',
      ctx: -1,
      b: (p, u) => [
        mk(p, p - u * 1.2, u * 0.08, u * 0.08),
        mk(p - u * 0.85, p - u * 0.45, u * 0.06, u * 0.06),
      ],
    },
    {
      id: 'bearharami',
      n: 'Bearish Harami',
      sig: 'Bearish',
      ctx: 1,
      b: (p, u) => [
        mk(p, p + u * 1.2, u * 0.08, u * 0.08),
        mk(p + u * 0.85, p + u * 0.45, u * 0.06, u * 0.06),
      ],
    },
    {
      id: 'spin',
      n: 'Spinning Top',
      sig: 'Indecision',
      ctx: 0,
      b: (p, u) => {
        const o = p - u * 0.12;
        return [mk(o, o + u * 0.28, u * 0.55, u * 0.55)];
      },
    },
  ];
  const patPool = lv => PATS.slice(0, lv <= 3 ? 6 : lv <= 6 ? 11 : 16);
  function patternChart(lv) {
    const pt = P(patPool(lv)),
      u = R(3, 6),
      p0 = R(60, 180),
      dir = pt.ctx || P([1, -1]);
    const ctx = trend(3 + Math.min(4, Math.floor(lv / 2)), dir, p0, u, lv);
    const pat = pt.b(ctx[ctx.length - 1].c, u);
    return { pt, cands: [...ctx, ...pat], hl: lv <= 7 ? pat.length : 0 };
  }
  function chartSVG(cands, o = {}) {
    const W = 340,
      H = 190,
      padL = o.axis ? 44 : 10,
      padR = 10,
      padT = 10,
      padB = 10;
    const lo0 = Math.min(...cands.map(c => c.l)),
      hi0 = Math.max(...cands.map(c => c.h)),
      m = (hi0 - lo0) * 0.08 || 1,
      lo = o.lo ?? lo0 - m,
      hi = o.hi ?? hi0 + m;
    const y = v => padT + ((hi - v) / (hi - lo)) * (H - padT - padB),
      n = cands.length,
      step = (W - padL - padR) / n,
      cw = Math.min(18, step * 0.62);
    let s = `<svg class="ed-chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">`;
    if (o.grid)
      o.grid.forEach(g => {
        s += `<line x1="${padL}" x2="${W - padR}" y1="${y(g)}" y2="${y(g)}" stroke="var(--line2)" stroke-dasharray="3 4"/><text x="${padL - 6}" y="${y(g) + 4}" text-anchor="end" font-size="11" fill="var(--mut)" font-family="var(--mono)">${'$' + FN(g)}</text>`;
      });
    if (o.hl)
      s += `<rect x="${padL + step * (n - o.hl) + 1}" y="3" width="${step * o.hl - 2}" height="${H - 6}" rx="8" fill="var(--amber)" opacity=".13" stroke="var(--amber)" stroke-opacity=".5"/>`;
    cands.forEach((c, i) => {
      const x = padL + step * i + step / 2,
        col = c.c >= c.o ? 'var(--up)' : 'var(--dn)';
      s += `<line x1="${x}" x2="${x}" y1="${y(c.h)}" y2="${y(c.l)}" stroke="${col}" stroke-width="1.6"/><rect x="${x - cw / 2}" width="${cw}" y="${y(Math.max(c.o, c.c))}" height="${Math.max(1.5, Math.abs(y(c.o) - y(c.c)))}" fill="${col}" rx="1.5"/>`;
    });
    return s + '</svg>';
  }
  function oneCandle(o, h, l, c, lo, hi) {
    const y = v => 6 + ((hi - v) / (hi - lo)) * 108,
      col = c >= o ? 'var(--up)' : 'var(--dn)';
    return `<svg class="ed-cc" viewBox="0 0 50 120" width="50" height="120"><line x1="25" x2="25" y1="${y(h)}" y2="${y(l)}" stroke="${col}" stroke-width="2"/><rect x="14" width="22" y="${y(Math.max(o, c))}" height="${Math.max(2, Math.abs(y(o) - y(c)))}" fill="${col}" rx="2"/></svg>`;
  }
  const SIGS = ['Bullish — price may rise', 'Bearish — price may fall', 'Indecision — no clear direction'];
  const sigTxt = s => SIGS.find(x => x.startsWith(s));
  const ARC = [
    {
      id: 'spot',
      n: 'Pattern Spotter',
      tip: 'Look at the highlighted candles. Match their shape to a pattern name: long lower wick = hammer, big body swallowing the last one = engulfing, and so on.',
      gen: lv => {
        const { pt, cands, hl } = patternChart(lv);
        return BC(
          `Which pattern ${hl ? 'is highlighted' : 'appears in the LAST candles'}?${chartSVG(cands, { hl })}`,
          pt.n,
          patPool(Math.max(lv, 4)).map(x => x.n)
        );
      },
    },
    {
      id: 'signal',
      n: 'Signal Reader',
      tip: 'Reversal patterns after a downtrend are bullish; after an uptrend they are bearish. Dojis and spinning tops mean buyers and sellers are tied. Patterns are hints, not guarantees!',
      gen: lv => {
        const { pt, cands, hl } = patternChart(lv);
        return {
          q: `This is a <b>${pt.n}</b>. What does it usually signal?${chartSVG(cands, { hl })}`,
          a: sigTxt(pt.sig),
          ch: SIGS.slice(),
        };
      },
    },
    {
      id: 'build',
      n: 'Candle Builder',
      tip: 'Green = close above open, red = close below. The body runs from open to close. Wicks reach up to the high and down to the low.',
      gen: lv => {
        const s = lv <= 4 ? 5 : 1;
        let o, c, h, l;
        do {
          o = s * R(8, 30);
          c = s * R(8, 30);
          h = Math.max(o, c) + s * R(1, 4);
          l = Math.min(o, c) - s * R(1, 4);
        } while (o === c || h - Math.max(o, c) === Math.min(o, c) - l);
        const lo = l - s,
          hi = h + s;
        const good = oneCandle(o, h, l, c, lo, hi),
          cands = [
            good,
            oneCandle(c, h, l, o, lo, hi),
            oneCandle(
              o,
              Math.max(o, c) + (Math.min(o, c) - l),
              Math.min(o, c) - (h - Math.max(o, c)),
              c,
              lo,
              hi
            ),
            oneCandle(
              c,
              Math.max(o, c) + (Math.min(o, c) - l),
              Math.min(o, c) - (h - Math.max(o, c)),
              o,
              lo,
              hi
            ),
          ];
        return {
          q: `Which candle shows: <b>Open $${o}</b>, <b>High $${h}</b>, <b>Low $${l}</b>, <b>Close $${c}</b>?`,
          a: good,
          ch: SH(cands),
        };
      },
    },
    {
      id: 'read',
      n: 'Price Reader',
      tip: 'Find which end of the body is the open and which is the close using the color. Green: open at the bottom, close at the top. Red: the reverse.',
      gen: lv => {
        const gs = lv <= 3 ? 10 : lv <= 6 ? 5 : 2,
          base = gs * R(5, 15);
        const lv4 = () => base + gs * R(0, 8);
        let o, c;
        do {
          o = lv4();
          c = lv4();
        } while (o === c);
        const h = Math.max(o, c) + gs * R(1, 2),
          l = Math.min(o, c) - gs * R(1, 2);
        const grid = [];
        for (let v = l; v <= h; v += gs) grid.push(v);
        const k = P(['open', 'high', 'low', 'close']),
          ans = { open: o, high: h, low: l, close: c }[k];
        return {
          q: `What is the <b>${k.toUpperCase()}</b> price of this candle?${chartSVG([{ o, h, l, c }], { axis: 1, grid, lo: l - gs * 0.6, hi: h + gs * 0.6 })}`,
          a: '$' + ans,
          ch: SH([o, h, l, c].map(v => '$' + v)),
        };
      },
    },
    {
      id: 'trend',
      n: 'Trend Detective',
      tip: 'Uptrend = higher highs and higher lows. Downtrend = lower highs and lower lows. Sideways = price bouncing in a range.',
      gen: lv => {
        const kind = P(['Uptrend', 'Downtrend', 'Sideways']),
          n = 10 + lv,
          u = R(3, 6);
        let cands,
          t = 0;
        do {
          cands = [];
          let p = R(60, 180);
          const base = p,
            drift = kind === 'Sideways' ? 0 : (kind === 'Uptrend' ? 1 : -1) * u * (0.7 - lv * 0.035);
          for (let i = 0; i < n; i++) {
            const target = kind === 'Sideways' ? base + (base - p) * 0.5 : p + drift;
            const c = target + (Math.random() - 0.5) * u * (0.8 + lv * 0.06);
            cands.push(mk(p, c, u * Math.random() * 0.4, u * Math.random() * 0.4));
            p = c;
          }
          const net = cands[n - 1].c - cands[0].o,
            rng = Math.max(...cands.map(x => x.h)) - Math.min(...cands.map(x => x.l));
          var ok =
            kind === 'Sideways'
              ? Math.abs(net) < rng * 0.25
              : Math.sign(net) === (kind === 'Uptrend' ? 1 : -1) && Math.abs(net) > rng * 0.55;
        } while (!ok && ++t < 200);
        if (!ok && typeof globalThis.__trendFail === 'number') globalThis.__trendFail++;
        return {
          q: `What kind of trend is this?${chartSVG(cands)}`,
          a: kind,
          ch: ['Uptrend', 'Downtrend', 'Sideways'],
        };
      },
    },
    {
      id: 'sr',
      n: 'Support & Resistance',
      tip: 'Support is the floor where price keeps bouncing up. Resistance is the ceiling where price keeps getting rejected.',
      gen: lv => {
        const gs = lv <= 5 ? 5 : 2,
          S = gs * R(10, 30),
          B = gs * R(3, 5),
          n = 12 + lv,
          cands = [];
        let p = S + B / 2,
          dir = 1;
        for (let i = 0; i < n; i++) {
          const tgt = dir > 0 ? S + B : S,
            stepv = B * (0.35 + Math.random() * 0.3);
          let c = p + dir * stepv;
          let hi = Math.max(p, c) + B * 0.05,
            lo = Math.min(p, c) - B * 0.05;
          if (dir > 0 && c >= tgt - B * 0.1) {
            c = tgt - B * (0.05 + Math.random() * 0.15);
            hi = tgt;
            dir = -1;
          } else if (dir < 0 && c <= tgt + B * 0.1) {
            c = tgt + B * (0.05 + Math.random() * 0.15);
            lo = tgt;
            dir = 1;
          }
          hi = Math.min(hi, S + B);
          lo = Math.max(lo, S);
          cands.push({ o: r1(p), c: r1(c), h: r1(Math.max(hi, p, c)), l: r1(Math.min(lo, p, c)) });
          p = c;
        }
        const grid = [];
        for (let v = S - gs * 2; v <= S + B + gs * 2; v += gs) grid.push(v);
        const k = P(['support', 'resistance']),
          ans = k === 'support' ? S : S + B;
        return {
          q: `Where is <b>${k}</b>?${chartSVG(cands, { axis: 1, grid, lo: S - gs * 2.4, hi: S + B + gs * 2.4 })}`,
          a: '$' + ans,
          ch: SH([S, S + B, S + B / 2, S - gs * 2].map(v => '$' + FN(v))).map(x => x),
        };
      },
    },
  ];
  const ARC_TOPICS = [];
  ARC.forEach(m => {
    const F = { id: 'arc-' + m.id, n: m.n, s: 'Candle Arcade', tip: m.tip, gen: (f, lv) => m.gen(lv) };
    for (let lv = 1; lv <= 10; lv++)
      ARC_TOPICS.push({
        id: `arc|${m.id}|${lv}`,
        F,
        f: { l: `Level ${lv}` },
        lv,
        g: 8,
        s: 'Candle Arcade',
        title: m.n,
      });
  });

  /* ------------------------------ TOPICS ------------------------------ */
  const LEVELS = 10;
  const GRADES = [
    'Kindergarten',
    '1st Grade',
    '2nd Grade',
    '3rd Grade',
    '4th Grade',
    '5th Grade',
    '6th Grade',
    '7th Grade',
    '8th Grade',
    '9th Grade',
    '10th Grade',
    '11th Grade',
    '12th Grade',
  ];
  const SUBJECTS = ['Math', 'Reading', 'Science', 'Social Studies', 'Money'];
  const cache = {};
  function topics(g) {
    if (cache[g]) return cache[g];
    const out = [];
    SUBJECTS.forEach(s =>
      FAMS.filter(F => F.s === s && g >= F.g[0] && g <= F.g[1]).forEach(F => {
        F.foc(g).forEach((f, fi) => {
          for (let lv = 1; lv <= LEVELS; lv++)
            out.push({ id: `${g}|${F.id}|${fi}|${lv}`, F, f, lv, g, s, title: `${F.n}: ${f.l}`, lvl: lv });
        });
      })
    );
    return (cache[g] = out);
  }
  function byId(id) {
    const [g] = id.split('|');
    if (g === 'arc') return ARC_TOPICS.find(t => t.id === id);
    return topics(+g).find(t => t.id === id);
  }
  function question(t) {
    for (let i = 0; i < 20; i++) {
      try {
        const q = t.F.gen(t.f, t.lv, t.g);
        if (q && q.ch && q.ch.includes(q.a) && new Set(q.ch).size === q.ch.length && q.ch.length >= 2)
          return q;
      } catch (e) {
        if (i === 19) throw e;
      }
    }
    return t.F.gen(t.f, t.lv, t.g);
  }
  return {
    FAMS,
    ARC,
    ARC_TOPICS,
    PATS,
    GRADES,
    SUBJECTS,
    LEVELS,
    topics,
    byId,
    question,
    candleSVG,
    R,
    P,
    SH,
  };
})();
if (typeof module !== 'undefined') module.exports = EDU;
