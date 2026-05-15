// scripts/seed.ts
// Inserts the 8 sample articles directly into the SQLite database.
// Uses better-sqlite3 (already installed via @payloadcms/db-sqlite) to bypass
// the Payload initialisation chain, which fails on Node.js 24 due to a
// @next/env ESM interop bug.
//
// HOW TO RUN:
//   npm run seed

import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.resolve(__dirname, '../payload.db')

const articles = [
  {
    title: 'Η δίκη Musk vs OpenAI ξεκινά – AI σε στρατό, automation και νέα πειράματα νοημοσύνης',
    slug: 'musk-vs-openai-dikastirio',
    description: 'Η μεγάλη δικαστική μάχη μεταξύ Elon Musk και OpenAI ξεκινά, με κατηγορίες για «κατάχρηση μη κερδοσκοπικής αποστολής» και τεράστιες επιπτώσεις στον χώρο της τεχνητής νοημοσύνης.',
    content: '<h2>Περίληψη</h2><p>Η μεγάλη δικαστική μάχη μεταξύ Elon Musk και OpenAI ξεκινά επίσημα. Ο Musk κατηγορεί την εταιρεία ότι αποκλίνει από τη μη κερδοσκοπική της αποστολή. Παράλληλα, η Google προχωρά σε στρατιωτική συνεργασία με το Πεντάγωνο, προκαλώντας αντιδράσεις εργαζομένων.</p><h2>Κύρια σημεία</h2><ul><li>Ο Elon Musk καταθέτει αγωγή κατά της OpenAI, ζητώντας απομάκρυνση του Sam Altman.</li><li>Η OpenAI απαντά ότι η αγωγή είναι αποτέλεσμα ανταγωνιστικής δυσαρέσκειας.</li><li>Η Google υπέγραψε συμφωνία με το Πεντάγωνο για χρήση AI σε κυβερνητικές εφαρμογές.</li><li>Το Codex επιτρέπει πλήρη αυτοματοποίηση εργασιών υπολογιστή.</li></ul><h2>Αναλυτικά</h2><p>Η δίκη αποτελεί ένα από τα σημαντικότερα γεγονότα στην ιστορία της τεχνητής νοημοσύνης. Η έκβαση μπορεί να επηρεάσει σημαντικά τον τρόπο που οι εταιρείες AI οργανώνονται στο μέλλον.</p><h3>Δείκτης Συναισθήματος: Μικτό (6/10)</h3>',
    image: '/images/article-musk-openai.jpg',
    category: 'AI & Law',
    author: 'Business Analytics',
    popularity: 95,
  },
  {
    title: 'Ρήγμα στη συνεργασία OpenAI–Microsoft – AI πόλεμος σε cloud, γεωπολιτική και νέα μοντέλα',
    slug: 'openai-microsoft-rigma',
    description: 'Η συνεργασία μεταξύ OpenAI και Microsoft αναδιαμορφώνεται, καταργώντας την αποκλειστικότητα και επιτρέποντας στην OpenAI να χρησιμοποιεί ανταγωνιστικά cloud όπως το Amazon.',
    content: '<h2>Περίληψη</h2><p>Η συνεργασία μεταξύ OpenAI και Microsoft αναδιαμορφώνεται, καταργώντας την αποκλειστικότητα και επιτρέποντας στην OpenAI να χρησιμοποιεί ανταγωνιστικά cloud όπως το Amazon. Την ίδια στιγμή, η Κίνα μπλοκάρει εξαγωγές της Meta.</p><h2>Κύρια σημεία</h2><ul><li>Η OpenAI καταργεί την αποκλειστικότητα με τη Microsoft.</li><li>Η Κίνα μπλοκάρει εξαγωγές της Meta, αναδεικνύοντας το AI ως θέμα εθνικής ασφάλειας.</li><li>Το νέο lab Ineffable Intelligence συγκεντρώνει $1.1 δισ. για superintelligent AI.</li></ul><h3>Δείκτης Συναισθήματος: Στρατηγικό (7/10)</h3>',
    image: '/images/article-openai-microsoft.jpg',
    category: 'Industry',
    author: 'Business Analytics',
    popularity: 88,
  },
  {
    title: 'DeepSeek V4 φέρνει φθηνό AI και πιέζει τη Δύση – Agents, deals και νέα AI εργαλεία',
    slug: 'deepseek-v4-ftino-ai',
    description: 'Το DeepSeek παρουσίασε το νέο V4 μοντέλο, επιδεικνύοντας υψηλή απόδοση στο χαμηλό κόστος με συμβατότητα Huawei chips, αλλάζοντας τη δυναμική του AI ανταγωνισμού.',
    content: '<h2>Περίληψη</h2><p>Η DeepSeek παρουσίασε το νέο V4 μοντέλο, εστιάζοντας στο χαμηλό κόστος και τη συμβατότητα με Huawei chips, αλλάζοντας την εξίσωση του AI ανταγωνισμού.</p><h2>Κύρια Σημεία</h2><ul><li>Το DeepSeek V4 προσφέρει υψηλή απόδοση σε πολύ χαμηλότερο κόστος.</li><li>Υποστηρίζει Huawei chips, μειώνοντας την εξάρτηση από Nvidia.</li><li>Google σχεδιάζει επένδυση έως $40B στην Anthropic.</li></ul><h3>Δείκτης Συναισθήματος: Θετικό (7/10)</h3>',
    image: '/images/article-deepseek-v4.jpg',
    category: 'Models',
    author: 'Business Analytics',
    popularity: 82,
  },
  {
    title: 'Η τεχνητή νοημοσύνη μαθαίνει να σε "χακάρει" σαν άνθρωπος — και αυτό είναι ήδη πρόβλημα',
    slug: 'ai-social-engineering-khakarei',
    description: 'Η τεχνητή νοημοσύνη γίνεται εξαιρετικά καλή στη χειραγώγηση ανθρώπων μέσω social engineering επιθέσεων σε μεγάλη κλίμακα.',
    content: '<h2>Περίληψη</h2><p>Η τεχνητή νοημοσύνη δεν βελτιώνεται μόνο στο γράψιμο ή τον κώδικα — γίνεται ιδιαίτερα καλή στη χειραγώγηση ανθρώπων. Ένα πείραμα έδειξε ότι μοντέλα AI μπορούν να εκτελούν πειστικές επιθέσεις social engineering.</p><h2>Κύρια σημεία</h2><ul><li>Μοντέλα AI μπορούν να εκτελούν social engineering επιθέσεις με υψηλή επιτυχία.</li><li>Η αύξηση AI-driven κυβερνοεπιθέσεων αγγίζει +89% σε σχέση με πέρυσι.</li><li>Ολόκληρη η επίθεση γίνεται fully automated: phishing emails, voice cloning, fake video.</li></ul><h3>Δείκτης Συναισθήματος: Αρνητικό (3/10)</h3>',
    image: '/images/article-ai-hack.jpg',
    category: 'Security',
    author: 'Business Analytics',
    popularity: 91,
  },
  {
    title: 'Διαρροή Mythos, νέα μάχη AI agents και είσοδος της SpaceX στο coding race',
    slug: 'mythos-diarroi-spacex-coding',
    description: 'Η εβδομάδα δείχνει ξεκάθαρα ότι το AI περνάει σε φάση έντονου ανταγωνισμού και κινδύνου, με τη διαρροή του Mythos και την είσοδο της SpaceX στο AI coding.',
    content: '<h2>Περίληψη</h2><p>Η εβδομάδα δείχνει ότι το AI περνάει σε φάση έντονου ανταγωνισμού. Το μοντέλο Mythos της Anthropic διέρρευσε σε Discord group, ενώ η SpaceX επιβεβαιώνει τη σύγκλισή της με το AI coding μέσω της Cursor.</p><h2>Κύρια σημεία</h2><ul><li>Το model Mythos διέρρευσε σε Discord group σχεδόν άμεσα μετά την κυκλοφορία του.</li><li>Deal έως $60B για την Cursor — Guaranteed $100M συνεργασία με SpaceX.</li></ul><h3>Δείκτης Συναισθήματος: Μικτό (5/10)</h3>',
    image: '/images/article-mythos-leak.jpg',
    category: 'Agents',
    author: 'Business Analytics',
    popularity: 78,
  },
  {
    title: 'Κεφάλαια κατευθύνονται σε AI υποδομές, crypto και αγορές υψηλής ανάπτυξης',
    slug: 'kefalia-ai-ypodomes-crypto',
    description: 'Η εβδομάδα χαρακτηρίζεται από έντονη ροή κεφαλαίων σε τεχνητή νοημοσύνη, υποδομές υπολογιστικής ισχύος και crypto.',
    content: '<h2>Περίληψη</h2><p>Η εβδομάδα χαρακτηρίζεται από έντονη ροή κεφαλαίων σε τεχνητή νοημοσύνη, υποδομές υπολογιστικής ισχύος και crypto.</p><h2>Κύρια σημεία</h2><ul><li>Η Anthropic εξασφαλίζει έως $25B σε συνεργασία με την Amazon.</li><li>Η Cursor αποτιμάται $50B στην αγορά AI coding.</li><li>Η Visa και η Stripe επενδύουν σε blockchain πληρωμές.</li></ul><h3>Δείκτης Συναισθήματος: Θετικό (bullish)</h3>',
    image: '/images/article-capital-flow.jpg',
    category: 'Finance',
    author: 'Business Analytics',
    popularity: 75,
  },
  {
    title: 'Η OpenAI απαντά στο Mythos με το GPT-5.4-Cyber και ανοίγει την άμυνα σε περισσότερους οργανισμούς',
    slug: 'openai-gpt-cyber-amyna',
    description: 'Η OpenAI παρουσίασε το GPT-5.4-Cyber, ένα νέο μοντέλο εξειδικευμένο στην αμυντική κυβερνοασφάλεια.',
    content: '<h2>Περίληψη</h2><p>Η OpenAI παρουσίασε το GPT-5.4-Cyber, ένα νέο μοντέλο προσανατολισμένο στην αμυντική κυβερνοασφάλεια, ως απάντηση στη στρατηγική περιορισμένης πρόσβασης της Anthropic με το Mythos.</p><h2>Κύρια σημεία</h2><ul><li>Η OpenAI λανσάρει το GPT-5.4-Cyber με Trusted Access for Cyber.</li><li>Το μοντέλο κάνει reverse engineering σε compiled software.</li><li>Η Anthropic αναβάθμισε το Claude Code desktop app.</li></ul><h3>Δείκτης Συναισθήματος: Θετικό (7/10)</h3>',
    image: '/images/article-gpt-cyber.jpg',
    category: 'Cybersecurity',
    author: 'Business Analytics',
    popularity: 86,
  },
  {
    title: '$500M στο AI για βιολογία – Νέα εποχή στην υγεία, διάγνωση και "food intelligence"',
    slug: '500m-ai-viologia-ygeia',
    description: 'Η πρωτοβουλία Biohub του Mark Zuckerberg επενδύει $500 εκατ. για να φέρει την τεχνητή νοημοσύνη πιο κοντά στην κατανόηση και θεραπεία ασθενειών σε κυτταρικό επίπεδο.',
    content: '<h2>Περίληψη</h2><p>Η πρωτοβουλία Biohub του Mark Zuckerberg επενδύει $500 εκατ. για να φέρει την τεχνητή νοημοσύνη πιο κοντά στην κατανόηση και θεραπεία ασθενειών σε κυτταρικό επίπεδο. Παράλληλα, η Mayo Clinic παρουσίασε AI που εντοπίζει καρκίνο παγκρέατος έως 3 χρόνια πριν τη διάγνωση.</p><h2>Κύρια Σημεία</h2><ul><li>Το Biohub (CZI) επενδύει $500M για ανάπτυξη AI που προσομοιώνει ανθρώπινα κύτταρα.</li><li>Το μοντέλο REDMOD πέτυχε ανίχνευση 73% σε περιπτώσεις που είχαν χαρακτηριστεί «φυσιολογικές».</li><li>Νέα έρευνα «Food AI» δείχνει ότι μοντέλα κατανοούν γεύση χωρίς χημικά δεδομένα.</li></ul><h3>Δείκτης Συναισθήματος: Θετικό (8/10)</h3>',
    image: '/images/article-spacex-defense.jpg',
    category: 'Health & AI',
    author: 'Business Analytics',
    popularity: 97,
  },
]

const db = new Database(DB_PATH)

const insert = db.prepare(`
  INSERT OR IGNORE INTO articles (title, slug, description, content, image, category, author, popularity)
  VALUES (@title, @slug, @description, @content, @image, @category, @author, @popularity)
`)

console.log(`Seeding ${articles.length} articles into ${DB_PATH}\n`)

let created = 0
let skipped = 0

for (const article of articles) {
  const result = insert.run(article)
  if (result.changes > 0) {
    console.log(`  CREATED: ${article.title.slice(0, 60)}...`)
    created++
  } else {
    console.log(`  SKIP (slug already exists): ${article.slug}`)
    skipped++
  }
}

db.close()
console.log(`\nDone — ${created} created, ${skipped} skipped.`)
