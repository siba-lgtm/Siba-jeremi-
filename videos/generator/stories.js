// Three original stories, same format as the reference video:
// second-person narration ("Du ..."), a kid vs. a food, the family doesn't
// believe them, a school lesson proves them right, and a final twist.
// Each scene: background, layered items, narration text, highlighted keywords.

const KID = (o = {}) => Object.assign({ t: 'p', who: 'kid', x: 540, y: 820, s: 1.7, expr: 'happy' }, o);
const P = (who, o = {}) => Object.assign({ t: 'p', who, x: 540, y: 820, s: 1.7, expr: 'happy' }, o);
const PR = (name, o = {}) => Object.assign({ t: 'prop', name, x: 540, y: 900, s: 1 }, o);
const TABLE = { t: 'table' };

const STORIES = {
  // ------------------------------------------------------------------ 1
  koriander: {
    title: 'Koriander schmeckt nach Seife',
    scenes: [
      { bg: 'kitchen', items: [KID({ expr: 'disgust', green: true, y: 760 }), TABLE, PR('koriander', { y: 1270, s: 1.2 })],
        text: 'Du warst das Kind, das Koriander gehasst hat.', key: ['KORIANDER'] },
      { bg: 'bathroom', items: [PR('bubbles', { y: 900 }), KID({ expr: 'disgust', y: 800 }), PR('soap', { x: 540, y: 1300, s: 1.6 })],
        text: 'Für dich schmeckte er einfach wie Seife.', key: ['SEIFE'] },
      { bg: 'kitchen', items: [P('mum', { x: 420, y: 760 }), PR('pot', { x: 640, y: 1330, s: 1.1 })],
        text: 'Aber deine Mutter tat ihn in alles.', key: ['ALLES'] },
      { bg: 'kitchen', items: [TABLE, PR('bowls', { y: 1280 })],
        text: 'In die Suppe, in den Salat, sogar in die Guacamole.', key: ['SUPPE,', 'SALAT,', 'GUACAMOLE'] },
      { bg: 'kitchen', items: [P('mum', { expr: 'angry', y: 760, armUp: true })],
        text: 'Und jedes Mal hieß es: Stell dich nicht so an!', key: ['STELL', 'DICH', 'NICHT', 'SO', 'AN!'] },
      { bg: 'kitchen', items: [P('brother', { x: 330, y: 800, s: 1.3, expr: 'joy', hold: 'koriander' }), KID({ x: 770, y: 840, s: 1.2, expr: 'surprised' }), TABLE],
        text: 'Dein Bruder aß ihn sogar mit einem Lächeln.', key: ['LÄCHELN'] },
      { bg: 'kitchen', bgo: { night: true }, items: [KID({ expr: 'sad', y: 900 }), PR('rain', { y: 430 })],
        text: 'Und du dachtest: Mit mir stimmt etwas nicht.', key: ['NICHT'] },
      { bg: 'classroom', bgo: { poster: 'dna' }, items: [P('pupil1', { x: 230, y: 1100, s: 0.9 }), KID({ x: 540, y: 1120, s: 0.95, expr: 'think' }), P('pupil2', { x: 850, y: 1100, s: 0.9 })],
        text: 'Bis zu dieser einen Biostunde.', key: ['BIOSTUNDE'] },
      { bg: 'classroom', bgo: { poster: 'dna' }, items: [P('teacher', { x: 820, y: 900, s: 1.3, armUp: true })],
        text: 'Manche Menschen haben ein bestimmtes Gen', key: ['GEN'] },
      { bg: 'classroom', bgo: { poster: 'dna' }, items: [PR('koriander', { x: 330, y: 1000, s: 1.1 }), PR('arrowRight', { x: 560, y: 980, s: 1.4 }), PR('soap', { x: 800, y: 990, s: 1.4 }), PR('bubbles', { y: 900, s: 0.8 })],
        text: 'und für sie schmeckt Koriander wirklich nach Seife.', key: ['SEIFE.'] },
      { bg: 'glow', items: [PR('frame', { y: 880 }), KID({ expr: 'proud', y: 760, s: 1.5 }), PR('sparkles', { y: 880 })],
        text: 'Du hast dir nichts eingebildet.', key: ['NICHTS'] },
      { bg: 'dark', bgo: {}, items: [PR('bigword', { text: 'DNA', y: 820, size: 260, color: '#7ee06b' }), PR('sparkles', { y: 820 })],
        text: 'Es lag in deinen Genen.', key: ['GENEN.'] },
      { bg: 'kitchen', items: [P('mum', { x: 330, y: 820, s: 1.3, expr: 'think' }), KID({ x: 770, y: 840, s: 1.2, expr: 'joy', armUp: true }), TABLE],
        text: 'Stolz hast du es deiner Mutter erklärt.', key: ['MUTTER'] },
      { bg: 'kitchen', items: [P('mum', { expr: 'smug', y: 800 }), PR('question', { x: 860, y: 420 })],
        text: 'Und weißt du, was sie gesagt hat?', key: ['WAS'] },
      { bg: 'kitchen', items: [KID({ x: 540, y: 700, s: 1.4, expr: 'surprised', sweat: true }), TABLE, PR('korianderPile', { y: 1330, s: 1.1 })],
        text: 'Dann nehmen wir eben doppelt so viel.', key: ['DOPPELT'] },
    ],
  },

  // ------------------------------------------------------------------ 2
  milch: {
    title: 'Die Milch-Bauchschmerzen',
    scenes: [
      { bg: 'kitchen', items: [KID({ y: 760, expr: 'neutral' }), TABLE, PR('milk', { y: 1240, s: 1.1 })],
        text: 'Du warst das Kind, das jeden Morgen Milch trinken musste.', key: ['MILCH'] },
      { bg: 'kitchen', items: [P('oma', { y: 780, armUp: true, hold: 'milk' })],
        text: 'Denn Oma sagte immer: Milch macht starke Knochen.', key: ['STARKE', 'KNOCHEN.'] },
      { bg: 'kitchen', items: [KID({ y: 760, expr: 'happy', armUp: true, hold: 'milkEmpty' }), TABLE],
        text: 'Also hast du dein Glas brav ausgetrunken.', key: ['AUSGETRUNKEN.'] },
      { bg: 'kitchen', items: [PR('clock', { y: 820, s: 2 })],
        text: 'Und eine Stunde später ging es los.', key: ['LOS.'] },
      { bg: 'classroom', bgo: {}, items: [KID({ y: 840, expr: 'disgust', green: true, s: 1.5 }), PR('tummy', { y: 1200, s: 1.2 })],
        text: 'Bauchschmerzen. Jeden einzelnen Tag.', key: ['BAUCHSCHMERZEN.'] },
      { bg: 'classroom', bgo: { poster: 'molecule' }, items: [P('pupil1', { x: 220, y: 1100, s: 0.9, expr: 'surprised' }), KID({ x: 560, y: 1050, s: 1.0, expr: 'sad', sweat: true }), P('pupil3', { x: 870, y: 1100, s: 0.9, expr: 'surprised' })],
        text: 'Mitten in der Mathestunde musstest du raus.', key: ['RAUS.'] },
      { bg: 'classroom', bgo: {}, items: [P('pupil1', { x: 230, y: 1050, s: 1.0, expr: 'laugh' }), P('pupil2', { x: 540, y: 1000, s: 1.0, expr: 'laugh' }), P('pupil3', { x: 850, y: 1050, s: 1.0, expr: 'laugh' }), PR('haha', { y: 600 })],
        text: 'Und die ganze Klasse hat gelacht.', key: ['GELACHT.'] },
      { bg: 'kitchen', items: [P('oma', { x: 360, y: 820, s: 1.3, expr: 'angry' }), KID({ x: 780, y: 860, s: 1.1, expr: 'sad' })],
        text: 'Zu Hause hieß es nur: Du willst bloß nicht zur Schule.', key: ['SCHULE.'] },
      { bg: 'doctor', items: [P('doctor', { x: 700, y: 800, s: 1.4 }), KID({ x: 290, y: 1000, s: 1.0, expr: 'think' })],
        text: 'Bis zum Termin beim Kinderarzt.', key: ['KINDERARZT.'] },
      { bg: 'doctor', items: [P('doctor', { x: 360, y: 820, s: 1.3, expr: 'think' }), PR('paper', { x: 780, y: 1050, s: 1.2 })],
        text: 'Ein kleiner Atemtest und dann das Ergebnis:', key: ['ERGEBNIS:'] },
      { bg: 'dark', items: [PR('bigword', { text: 'LAKTOSE-', y: 760, size: 150, color: '#ffd23f' }), PR('bigword', { text: 'INTOLERANZ', y: 920, size: 150, color: '#ffd23f' }), PR('sparkles', { y: 840 })],
        text: 'Laktoseintoleranz.', key: ['LAKTOSEINTOLERANZ.'] },
      { bg: 'doctor', items: [PR('lactose', { y: 900, s: 1.3 })],
        text: 'Dein Körper konnte den Milchzucker nicht verdauen.', key: ['MILCHZUCKER'] },
      { bg: 'glow', items: [PR('frame', { y: 880 }), KID({ expr: 'proud', y: 760, s: 1.5 }), PR('sparkles', { y: 880 })],
        text: 'Du hast nie übertrieben.', key: ['NIE'] },
      { bg: 'kitchen', items: [P('oma', { y: 780, expr: 'sad' }), TABLE, PR('question', { x: 860, y: 420 })],
        text: 'Am Sonntag stellte Oma dir wieder ein Glas hin.', key: ['GLAS'] },
      { bg: 'kitchen', items: [KID({ x: 540, y: 640, s: 1.25, expr: 'joy' }), TABLE, PR('oatmilk', { x: 400, y: 1170, s: 1.0 }), PR('sparkles', { y: 1000, s: 0.8 })],
        text: 'Hafermilch. Mit einem Zettel: Entschuldigung.', key: ['HAFERMILCH.', 'ENTSCHULDIGUNG.'] },
    ],
  },

  // ------------------------------------------------------------------ 3
  orangensaft: {
    title: 'Zahnpasta und Orangensaft',
    scenes: [
      { bg: 'kitchen', items: [KID({ y: 760, expr: 'disgust', green: true }), TABLE, PR('oj', { y: 1240, s: 1.1 })],
        text: 'Du warst das Kind, das morgens keinen Orangensaft wollte.', key: ['ORANGENSAFT'] },
      { bg: 'kitchen', items: [KID({ y: 760, expr: 'joy' }), TABLE, PR('oranges', { y: 1300, s: 1.2 })],
        text: 'Dabei hast du Orangen geliebt.', key: ['GELIEBT.'] },
      { bg: 'kitchen', items: [P('dad', { y: 780, armUp: true, hold: 'toothbrush' })],
        text: 'Aber dein Vater hatte eine Regel: Erst Zähne putzen, dann Frühstück.', key: ['REGEL:'] },
      { bg: 'bathroom', items: [KID({ y: 900, expr: 'happy', armUp: true, hold: 'toothbrush' })],
        text: 'Also hast du brav geputzt',  key: ['GEPUTZT'] },
      { bg: 'kitchen', items: [KID({ y: 760, expr: 'happy', armUp: true, hold: 'oj' }), TABLE],
        text: 'und danach einen großen Schluck Saft genommen.', key: ['SCHLUCK'] },
      { bg: 'kitchen', items: [KID({ y: 800, expr: 'disgust', green: true, s: 1.9 })],
        text: 'Bitter. Sauer. Einfach eklig.', key: ['BITTER.', 'SAUER.', 'EKLIG.'] },
      { bg: 'kitchen', items: [P('dad', { x: 360, y: 820, s: 1.3, expr: 'smug' }), TABLE, PR('coffee', { x: 330, y: 1310, s: 1.1 }), KID({ x: 800, y: 900, s: 1.0, expr: 'sad' })],
        text: 'Dein Vater trank seinen Kaffee: Du bist so kompliziert.', key: ['KOMPLIZIERT.'] },
      { bg: 'classroom', bgo: { poster: 'molecule' }, items: [P('pupil2', { x: 230, y: 1100, s: 0.9 }), KID({ x: 540, y: 1120, s: 0.95, expr: 'think' }), P('pupil1', { x: 850, y: 1100, s: 0.9 })],
        text: 'Jahre später im Chemieunterricht', key: ['CHEMIEUNTERRICHT'] },
      { bg: 'classroom', bgo: { poster: 'molecule' }, items: [P('chemTeacher', { x: 830, y: 900, s: 1.3, armUp: true })],
        text: 'zeigte der Lehrer einen Stoff aus der Zahnpasta.', key: ['ZAHNPASTA.'] },
      { bg: 'classroom', bgo: { poster: 'tongue' }, items: [PR('sugarBlock', { y: 1150, s: 1.3 })],
        text: 'Er blockiert kurz die Zunge für Süßes und macht Bitteres stärker.', key: ['SÜSSES', 'BITTERES'] },
      { bg: 'dark', items: [PR('oj', { x: 540, y: 800, s: 1.6 }), PR('bigword', { text: 'BITTER', y: 1150, size: 170, color: '#9be25a' })],
        text: 'Darum schmeckt der Saft danach so furchtbar.', key: ['FURCHTBAR.'] },
      { bg: 'glow', items: [PR('frame', { y: 880 }), KID({ expr: 'proud', y: 760, s: 1.5 }), PR('sparkles', { y: 880 })],
        text: 'Du warst nicht kompliziert. Das war Chemie.', key: ['CHEMIE.'] },
      { bg: 'kitchen', items: [KID({ y: 760, expr: 'joy', armUp: true, hold: 'oj' }), TABLE, PR('oranges', { x: 300, y: 1310, s: 0.9 })],
        text: 'Seitdem gilt deine Regel: Erst Frühstück, später Zähne putzen.', key: ['DEINE', 'REGEL:'] },
      { bg: 'bathroom', items: [P('dad', { y: 860, armUp: true, hold: 'toothbrush', expr: 'think' })],
        text: 'Und dein Vater? Hat es heimlich ausprobiert.', key: ['HEIMLICH'] },
      { bg: 'kitchen', items: [P('dad', { y: 800, s: 1.9, expr: 'disgust', green: true })],
        text: 'Er sagt seitdem nichts mehr.', key: ['NICHTS', 'MEHR.'] },
    ],
  },
};

if (typeof module !== 'undefined') module.exports = STORIES;
