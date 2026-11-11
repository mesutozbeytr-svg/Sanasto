import { foldForSearch, normalizeFinnish } from '@/lib/vocabulary';

const TWEMOJI_VERSION = '14.0.2';
const TWEMOJI_BASE_URL = `https://cdn.jsdelivr.net/gh/jdecked/twemoji@${TWEMOJI_VERSION}/assets/svg/`;

export const TWEMOJI_CREDIT =
  'Twemoji © Twitter, Inc. ve katkıda bulunanlar, CC-BY 4.0 (github.com/jdecked/twemoji)';

interface TwemojiEntry {
  codepoint: string;
  label: string;
  fi: string[];
  tr: string[];
}

export interface TwemojiMatch {
  codepoint: string;
  label: string;
  url: string;
}

const TWEMOJI_CATALOG: TwemojiEntry[] = [
  { codepoint: '1f34e', label: 'elma', fi: ['omena'], tr: ['elma'] },
  { codepoint: '1f34c', label: 'muz', fi: ['banaani'], tr: ['muz'] },
  { codepoint: '1f34a', label: 'mandalina', fi: ['mandariini'], tr: ['mandalina'] },
  { codepoint: '1f34b', label: 'limon', fi: ['sitruuna'], tr: ['limon'] },
  { codepoint: '1f353', label: 'çilek', fi: ['mansikka'], tr: ['çilek'] },
  { codepoint: '1f347', label: 'üzüm', fi: ['viinirypäle'], tr: ['üzüm'] },
  { codepoint: '1f351', label: 'şeftali', fi: ['persikka'], tr: ['şeftali'] },
  { codepoint: '1f349', label: 'karpuz', fi: ['vesimeloni'], tr: ['karpuz'] },
  { codepoint: '1f352', label: 'kiraz', fi: ['kirsikka'], tr: ['kiraz'] },
  { codepoint: '1f34d', label: 'ananas', fi: ['ananas'], tr: ['ananas'] },
  { codepoint: '1f955', label: 'havuç', fi: ['porkkana'], tr: ['havuç'] },
  { codepoint: '1f954', label: 'patates', fi: ['peruna'], tr: ['patates'] },
  { codepoint: '1f966', label: 'brokoli', fi: ['parsakaali'], tr: ['brokoli'] },
  { codepoint: '1f35e', label: 'ekmek', fi: ['leipä'], tr: ['ekmek'] },
  { codepoint: '1f95a', label: 'yumurta', fi: ['muna'], tr: ['yumurta'] },
  { codepoint: '1f9c0', label: 'peynir', fi: ['juusto'], tr: ['peynir'] },
  { codepoint: '1f95b', label: 'süt', fi: ['maito'], tr: ['süt'] },
  { codepoint: '2615', label: 'kahve', fi: ['kahvi'], tr: ['kahve'] },
  { codepoint: '1f375', label: 'çay', fi: ['tee'], tr: ['çay'] },
  { codepoint: '1f964', label: 'meyve suyu', fi: ['mehu'], tr: ['meyve suyu'] },
  { codepoint: '1f4a7', label: 'su', fi: ['vesi'], tr: ['su'] },
  { codepoint: '1f356', label: 'et', fi: ['liha'], tr: ['et'] },
  { codepoint: '1f41f', label: 'balık', fi: ['kala'], tr: ['balık'] },
  { codepoint: '1f9c2', label: 'tuz', fi: ['suola'], tr: ['tuz'] },
  { codepoint: '1f36f', label: 'bal', fi: ['hunaja'], tr: ['bal'] },
  { codepoint: '1f370', label: 'pasta', fi: ['kakku'], tr: ['pasta'] },
  { codepoint: '1f36a', label: 'kurabiye', fi: ['keksi'], tr: ['kurabiye'] },
  { codepoint: '1f36b', label: 'çikolata', fi: ['suklaa'], tr: ['çikolata'] },
  { codepoint: '1f36c', label: 'şeker', fi: ['karkki', 'sokeri'], tr: ['şeker'] },
  { codepoint: '1f35d', label: 'makarna', fi: [], tr: ['makarna'] },
  { codepoint: '1f330', label: 'kestane', fi: ['kastanja'], tr: ['kestane'] },
  { codepoint: '1f95c', label: 'fıstık', fi: ['maapähkinä'], tr: ['fıstık'] },
  { codepoint: '1f965', label: 'hindistan cevizi', fi: ['kookos'], tr: ['hindistan cevizi'] },
  { codepoint: '1f37a', label: 'bira', fi: ['olut'], tr: ['bira'] },
  { codepoint: '1f377', label: 'şarap', fi: ['viini'], tr: ['şarap'] },
  { codepoint: '1f431', label: 'kedi', fi: ['kissa'], tr: ['kedi'] },
  { codepoint: '1f436', label: 'köpek', fi: ['koira'], tr: ['köpek'] },
  { codepoint: '1f434', label: 'at', fi: ['hevonen'], tr: ['at'] },
  { codepoint: '1f42e', label: 'inek', fi: ['lehmä'], tr: ['inek'] },
  { codepoint: '1f437', label: 'domuz', fi: ['sika'], tr: ['domuz'] },
  { codepoint: '1f414', label: 'tavuk', fi: ['kana'], tr: ['tavuk'] },
  { codepoint: '1f426', label: 'kuş', fi: ['lintu'], tr: ['kuş'] },
  { codepoint: '1f427', label: 'penguen', fi: ['pingviini'], tr: ['penguen'] },
  { codepoint: '1f41d', label: 'arı', fi: ['mehiläinen'], tr: ['arı'] },
  { codepoint: '1f98b', label: 'kelebek', fi: ['perhonen'], tr: ['kelebek'] },
  { codepoint: '1f41e', label: 'uğur böceği', fi: ['leppäkerttu'], tr: ['uğur böceği'] },
  { codepoint: '1f40c', label: 'salyangoz', fi: ['etana'], tr: ['salyangoz'] },
  { codepoint: '1f418', label: 'fil', fi: ['norsu'], tr: ['fil'] },
  { codepoint: '1f98c', label: 'geyik', fi: ['hirvi'], tr: ['geyik'] },
  { codepoint: '1f43b', label: 'ayı', fi: ['karhu'], tr: ['ayı'] },
  { codepoint: '1f43a', label: 'kurt', fi: ['susi'], tr: ['kurt'] },
  { codepoint: '1f98a', label: 'tilki', fi: ['kettu'], tr: ['tilki'] },
  { codepoint: '1f412', label: 'maymun', fi: ['apina'], tr: ['maymun'] },
  { codepoint: '1f430', label: 'tavşan', fi: ['kaniini'], tr: ['tavşan'] },
  { codepoint: '1f40d', label: 'yılan', fi: ['käärme'], tr: ['yılan'] },
  { codepoint: '1f577', label: 'örümcek', fi: ['hämähäkki'], tr: ['örümcek'] },
  { codepoint: '1f99c', label: 'papağan', fi: ['papukaija'], tr: ['papağan'] },
  { codepoint: '1f441', label: 'göz', fi: ['silmä'], tr: ['göz'] },
  { codepoint: '1f442', label: 'kulak', fi: ['korva'], tr: ['kulak'] },
  { codepoint: '1f443', label: 'burun', fi: ['nenä'], tr: ['burun'] },
  { codepoint: '1f444', label: 'ağız', fi: ['suu'], tr: ['ağız'] },
  { codepoint: '1f9b7', label: 'diş', fi: ['hammas'], tr: ['diş'] },
  { codepoint: '1f9e0', label: 'beyin', fi: ['aivot'], tr: ['beyin'] },
  { codepoint: '1f9b5', label: 'bacak', fi: ['jalka'], tr: ['bacak'] },
  { codepoint: '1f9b6', label: 'ayak', fi: ['jalkaterä'], tr: ['ayak'] },
  { codepoint: '270b', label: 'el', fi: ['käsi'], tr: ['el'] },
  { codepoint: '1f476', label: 'bebek', fi: ['vauva'], tr: ['bebek'] },
  { codepoint: '1f466', label: 'erkek çocuk', fi: ['poika'], tr: ['erkek çocuk', 'oğlan'] },
  { codepoint: '1f467', label: 'kız çocuk', fi: ['tyttö'], tr: ['kız', 'kız çocuk'] },
  { codepoint: '1f469', label: 'kadın', fi: ['nainen'], tr: ['kadın'] },
  { codepoint: '1f469', label: 'anne', fi: ['äiti'], tr: ['anne'] },
  { codepoint: '1f468', label: 'erkek', fi: ['mies'], tr: ['erkek'] },
  { codepoint: '1f468', label: 'baba', fi: ['isä'], tr: ['baba'] },
  { codepoint: '1f475', label: 'büyükanne', fi: ['isoäiti', 'mummo'], tr: ['büyükanne', 'nine'] },
  { codepoint: '1f474', label: 'büyükbaba', fi: ['isoisä', 'ukki'], tr: ['büyükbaba', 'dede'] },
  { codepoint: '1f9d1', label: 'insan', fi: ['ihminen'], tr: ['insan'] },
  { codepoint: '1f6cf', label: 'yatak', fi: ['sänky'], tr: ['yatak'] },
  { codepoint: '1f6cb', label: 'kanepe', fi: ['sohva'], tr: ['kanepe'] },
  { codepoint: '1f6bd', label: 'tuvalet', fi: ['wc'], tr: ['tuvalet'] },
  { codepoint: '1f6c1', label: 'küvet', fi: ['kylpyamme'], tr: ['küvet'] },
  { codepoint: '1f9f9', label: 'süpürge', fi: ['luuta'], tr: ['süpürge'] },
  { codepoint: '1f9fa', label: 'sepet', fi: ['kori'], tr: ['sepet'] },
  { codepoint: '1f6aa', label: 'kapı', fi: ['ovi'], tr: ['kapı'] },
  { codepoint: '1f4a1', label: 'ampul', fi: ['lamppu'], tr: ['ampul'] },
  { codepoint: '1f511', label: 'anahtar', fi: ['avain'], tr: ['anahtar'] },
  { codepoint: '1f512', label: 'kilit', fi: ['lukko'], tr: ['kilit'] },
  { codepoint: '1f3e0', label: 'ev', fi: ['talo'], tr: ['ev'] },
  { codepoint: '1f3e5', label: 'hastane', fi: ['sairaala'], tr: ['hastane'] },
  { codepoint: '1f3eb', label: 'okul', fi: ['koulu'], tr: ['okul'] },
  { codepoint: '1f4da', label: 'kitap', fi: ['kirja'], tr: ['kitap'] },
  { codepoint: '1f4f1', label: 'telefon', fi: ['puhelin'], tr: ['telefon'] },
  { codepoint: '1f4bb', label: 'bilgisayar', fi: ['tietokone'], tr: ['bilgisayar'] },
  { codepoint: '1f4e7', label: 'e-posta', fi: ['sähköposti'], tr: ['e-posta'] },
  { codepoint: '1f4f7', label: 'fotoğraf makinesi', fi: ['kamera'], tr: ['fotoğraf makinesi'] },
  { codepoint: '1f4fa', label: 'televizyon', fi: ['televisio'], tr: ['televizyon'] },
  { codepoint: '1f4b0', label: 'para', fi: ['raha'], tr: ['para'] },
  { codepoint: '1f4b3', label: 'kart', fi: ['kortti'], tr: ['kart'] },
  { codepoint: '1f4c5', label: 'takvim', fi: ['kalenteri'], tr: ['takvim'] },
  { codepoint: '231a', label: 'saat', fi: ['kello'], tr: ['saat'] },
  { codepoint: '2702', label: 'makas', fi: ['sakset'], tr: ['makas'] },
  { codepoint: '270f', label: 'kalem', fi: ['kynä'], tr: ['kalem'] },
  { codepoint: '1f3c6', label: 'kupa', fi: ['pokaali'], tr: ['kupa'] },
  { codepoint: '1f3b5', label: 'müzik', fi: ['musiikki'], tr: ['müzik'] },
  { codepoint: '26bd', label: 'futbol', fi: ['jalkapallo'], tr: ['futbol'] },
  { codepoint: '1f3c0', label: 'basketbol', fi: ['koripallo'], tr: ['basketbol'] },
  { codepoint: '1f3be', label: 'tenis', fi: ['tennis'], tr: ['tenis'] },
  { codepoint: '2600', label: 'güneş', fi: ['aurinko'], tr: ['güneş'] },
  { codepoint: '2b50', label: 'yıldız', fi: ['tähti'], tr: ['yıldız'] },
  { codepoint: '2601', label: 'bulut', fi: ['pilvi'], tr: ['bulut'] },
  { codepoint: '2744', label: 'kar', fi: ['lumi'], tr: ['kar'] },
  { codepoint: '1f327', label: 'yağmur', fi: ['sade'], tr: ['yağmur'] },
  { codepoint: '1f329', label: 'şimşek', fi: ['salama'], tr: ['şimşek'] },
  { codepoint: '1f525', label: 'ateş', fi: ['tuli'], tr: ['ateş'] },
  { codepoint: '1f30a', label: 'dalga', fi: ['aalto'], tr: ['dalga'] },
  { codepoint: '1f30b', label: 'yanardağ', fi: ['tulivuori'], tr: ['yanardağ'] },
  { codepoint: '1f335', label: 'kaktüs', fi: ['kaktus'], tr: ['kaktüs'] },
  { codepoint: '1f333', label: 'ağaç', fi: ['puu'], tr: ['ağaç'] },
  { codepoint: '1f332', label: 'çam', fi: ['kuusi'], tr: ['çam'] },
  { codepoint: '1f339', label: 'gül', fi: ['ruusu'], tr: ['gül'] },
  { codepoint: '1f33b', label: 'ayçiçeği', fi: ['auringonkukka'], tr: ['ayçiçeği'] },
  { codepoint: '1f337', label: 'lale', fi: ['tulppaani'], tr: ['lale'] },
  { codepoint: '1f342', label: 'yaprak', fi: ['lehti'], tr: ['yaprak'] },
  { codepoint: '1f3d4', label: 'dağ', fi: ['vuori'], tr: ['dağ'] },
  { codepoint: '1f697', label: 'araba', fi: ['auto'], tr: ['araba', 'otomobil'] },
  { codepoint: '1f68c', label: 'otobüs', fi: ['bussi'], tr: ['otobüs'] },
  { codepoint: '1f682', label: 'tren', fi: ['juna'], tr: ['tren'] },
  { codepoint: '2708', label: 'uçak', fi: ['lentokone'], tr: ['uçak'] },
  { codepoint: '1f6b2', label: 'bisiklet', fi: ['polkupyörä'], tr: ['bisiklet'] },
  { codepoint: '1f6a2', label: 'gemi', fi: ['laiva'], tr: ['gemi'] },
  { codepoint: '1f691', label: 'ambulans', fi: ['ambulanssi'], tr: ['ambulans'] },
  { codepoint: '1f695', label: 'taksi', fi: ['taksi'], tr: ['taksi'] },
  { codepoint: '1f687', label: 'metro', fi: ['metro'], tr: ['metro'] },
  { codepoint: '1f455', label: 'tişört', fi: ['paita'], tr: ['tişört'] },
  { codepoint: '1f457', label: 'elbise', fi: ['mekko'], tr: ['elbise'] },
  { codepoint: '1f462', label: 'çizme', fi: ['saapas'], tr: ['çizme', 'bot'] },
  { codepoint: '1f9e6', label: 'çorap', fi: ['sukka'], tr: ['çorap'] },
  { codepoint: '1f452', label: 'şapka', fi: ['hattu'], tr: ['şapka'] },
  { codepoint: '1f45c', label: 'çanta', fi: ['laukku'], tr: ['çanta'] },
  { codepoint: '1f453', label: 'gözlük', fi: ['silmälasit'], tr: ['gözlük'] },
  { codepoint: '1f45f', label: 'ayakkabı', fi: ['kenkä'], tr: ['ayakkabı'] },
  { codepoint: '1f534', label: 'kırmızı', fi: ['punainen'], tr: ['kırmızı'] },
  { codepoint: '1f7e2', label: 'yeşil', fi: ['vihreä'], tr: ['yeşil'] },
  { codepoint: '1f535', label: 'mavi', fi: ['sininen'], tr: ['mavi'] },
  { codepoint: '1f7e1', label: 'sarı', fi: ['keltainen'], tr: ['sarı'] },
  { codepoint: '1f7e0', label: 'turuncu', fi: ['oranssi'], tr: ['turuncu'] },
  { codepoint: '2b1b', label: 'siyah', fi: ['musta'], tr: ['siyah'] },
  { codepoint: '2b1c', label: 'beyaz', fi: ['valkoinen'], tr: ['beyaz'] },
  { codepoint: '1f7e3', label: 'mor', fi: ['violetti'], tr: ['mor'] },
];

type TermIndex = Map<string, TwemojiEntry[]>;

function buildIndex(
  termsOf: (entry: TwemojiEntry) => string[],
  normalize: (text: string) => string,
): TermIndex {
  const index: TermIndex = new Map();
  for (const entry of TWEMOJI_CATALOG) {
    for (const term of termsOf(entry)) {
      const key = normalize(term);
      index.set(key, [...(index.get(key) ?? []), entry]);
    }
  }
  return index;
}

const TURKISH_INDEX = buildIndex((entry) => entry.tr, foldForSearch);
const FINNISH_INDEX = buildIndex((entry) => entry.fi, normalizeFinnish);

function lookup(index: TermIndex, text: string, normalize: (text: string) => string): TwemojiEntry[] {
  return text
    .split(/[,;/]/)
    .map((term) => normalize(term))
    .filter((term) => term.length > 0)
    .flatMap((term) => index.get(term) ?? []);
}

export function twemojiUrl(codepoint: string): string {
  return `${TWEMOJI_BASE_URL}${codepoint}.svg`;
}

const OPENMOJI_BASE_URL = 'https://raw.githubusercontent.com/hfg-gmuend/openmoji/15.0.0/color/svg/';

export const OPENMOJI_CREDIT = 'OpenMoji, CC BY-SA 4.0 (openmoji.org)';

export function openmojiUrl(codepoint: string): string {
  return `${OPENMOJI_BASE_URL}${codepoint.toUpperCase()}.svg`;
}

export function findTwemojiCandidates(finnish: string, turkish: string): TwemojiMatch[] {
  const entries = [
    ...lookup(TURKISH_INDEX, turkish, foldForSearch),
    ...lookup(FINNISH_INDEX, finnish, normalizeFinnish),
  ];
  const seen = new Set<string>();
  const matches: TwemojiMatch[] = [];
  for (const entry of entries) {
    if (seen.has(entry.codepoint)) continue;
    seen.add(entry.codepoint);
    matches.push({ codepoint: entry.codepoint, label: entry.label, url: twemojiUrl(entry.codepoint) });
    if (matches.length === 6) break;
  }
  return matches;
}

