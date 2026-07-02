// @ts-check
/* Dyrane Academy · Business Discovery · assessment schema.
   Pure data: eight modules that follow how a business naturally operates.
   The engine (app.js) renders any schema shaped like this, so industry packs
   later are just different files.

   Copy rules (locked): few words, human, no jargon, no em dashes. One idea
   per question. Help lines only when they earn their place. Options short
   enough to scan in one glance. The owner answers in their own words; never
   ask them to think like an engineer, product manager, or analyst.

   Question types the engine understands:
   short  · one-line text            long  · paragraph textarea
   single · pick one (option cards)  multi · pick many (chips)
   scale  · 1-5 rating               yesno · one-tap yes / no
   `other: true` on single/multi adds a free-text "Something else" option.
   Only `required: true` blocks Continue; everything else is skippable. */

export const SCHEMA_VERSION = 1;

export const MODULES = [
  {
    id: 'basics', name: 'Business Basics', icon: 'compass',
    intro: {
      title: 'Let’s start with your story.',
      body: 'Who you are, what you do.',
      minutes: 3,
    },
    questions: [
      { id: 'owner-name', type: 'short', required: true, title: 'What’s your name?', placeholder: 'Your name' },
      { id: 'business-name', type: 'short', required: true, title: 'What’s your business called?', placeholder: 'Business name' },
      { id: 'industry', type: 'single', other: true, title: 'What kind of business is it?', help: 'Pick the closest.', options: [
        'Retail & trading', 'Construction & materials', 'Manufacturing', 'Services',
        'Food & hospitality', 'Agriculture', 'Technology',
      ] },
      { id: 'years', type: 'single', title: 'How long have you been running?', options: ['Under a year', '1-3 years', '4-10 years', 'Over 10 years'] },
      { id: 'team-size', type: 'single', title: 'How many people work here, including you?', options: ['Just me', '2-5', '6-15', '16-50', 'Over 50'] },
      { id: 'location', type: 'short', title: 'Where do you operate from?', help: 'City, area, locations.', placeholder: 'e.g. Two showrooms in Abuja' },
      { id: 'story', type: 'long', title: 'How did it start?', help: 'Tell it like you’d tell a friend.', placeholder: 'It started when…' },
      { id: 'model', type: 'long', title: 'How does the business make money?', placeholder: 'People pay us for…' },
      { id: 'known-for', type: 'long', title: 'What should it be known for?', placeholder: 'The place you go when…' },
    ],
  },
  {
    id: 'products', name: 'Products & Services', icon: 'boxes',
    intro: {
      title: 'What you sell.',
      body: 'And why people buy it.',
      minutes: 3,
    },
    questions: [
      { id: 'offerings', type: 'long', title: 'What do you sell?', help: 'List everything that comes to mind.', placeholder: 'We sell…' },
      { id: 'categories', type: 'multi', other: true, title: 'Which of these apply?', options: [
        'Physical products', 'Services', 'Custom orders', 'Wholesale', 'Delivery', 'After-sales support', 'Rentals',
      ] },
      { id: 'bestsellers', type: 'long', title: 'What sells most?', help: 'And why, if you know.', placeholder: 'Our best seller is…' },
      { id: 'profit-makers', type: 'long', title: 'What makes you the most profit?', help: 'A rough sense is fine.', placeholder: 'The best margin is on…' },
      { id: 'brands', type: 'short', title: 'Any brands or suppliers you carry?', placeholder: 'e.g. Dangote, local artisans' },
      { id: 'edge', type: 'long', title: 'Why buy from you and not elsewhere?', placeholder: 'Customers come to us because…' },
      { id: 'pricing', type: 'single', title: 'How do you set prices?', options: [
        'Fixed price list', 'Quote per job', 'Negotiation', 'A mix',
      ] },
    ],
  },
  {
    id: 'customers', name: 'Customers', icon: 'user-round',
    intro: {
      title: 'The people who buy.',
      body: 'Who buys, and why they return.',
      minutes: 3,
    },
    questions: [
      { id: 'who-buys', type: 'multi', other: true, title: 'Who buys from you?', options: [
        'Individuals', 'Contractors', 'Businesses', 'Government', 'Resellers',
      ] },
      { id: 'how-found', type: 'multi', other: true, title: 'How do new customers find you?', options: [
        'Walk-ins', 'Word of mouth', 'Social media', 'WhatsApp', 'Google', 'Marketplaces',
      ] },
      { id: 'why-choose', type: 'long', title: 'Why do customers choose you?', placeholder: 'They choose us because…' },
      { id: 'values-most', type: 'single', title: 'What do they care about most?', options: [
        'Price', 'Quality', 'Speed', 'Trust', 'Advice', 'Range',
      ] },
      { id: 'repeat-share', type: 'single', title: 'How much is repeat business?', options: [
        'Almost all', 'About half', 'Some', 'Mostly new', 'Not sure',
      ] },
      { id: 'keep-in-touch', type: 'multi', title: 'How do you stay in touch after a sale?', options: [
        'WhatsApp', 'Calls or SMS', 'Social media', 'Email', 'They come back', 'We don’t',
      ] },
      { id: 'complaints', type: 'long', title: 'What do customers complain about?', help: 'Honest answers help most.', placeholder: 'The most common complaint is…' },
    ],
  },
  {
    id: 'sales', name: 'Sales Journey', icon: 'wallet',
    intro: {
      title: 'One sale, start to finish.',
      body: 'The real journey, not the textbook one.',
      minutes: 4,
    },
    questions: [
      { id: 'typical-sale', type: 'long', title: 'Walk us through one sale.', help: 'First contact to money in hand.', placeholder: 'First the customer…' },
      { id: 'enquiry-channels', type: 'multi', title: 'How do orders come in?', options: [
        'In person', 'Calls', 'WhatsApp', 'Social media', 'Email', 'Website',
      ] },
      { id: 'quotes', type: 'yesno', title: 'Do customers ask for quotes?' },
      { id: 'quote-how', type: 'long', title: 'How do you prepare quotes?', help: 'Paper, WhatsApp, Excel… Skip if none.', placeholder: 'We write them…' },
      { id: 'payments', type: 'multi', title: 'How do customers pay?', options: [
        'Cash', 'Transfer', 'POS', 'Instalments', 'Credit',
      ] },
      { id: 'delivery-mode', type: 'single', title: 'How do goods reach the customer?', options: [
        'They collect', 'We deliver', 'Third party', 'A mix', 'Not applicable',
      ] },
      { id: 'installation', type: 'yesno', title: 'Do you install or work on-site?' },
      { id: 'after-sales', type: 'long', title: 'What happens after a sale?', help: 'Follow-up, warranty, or nothing.', placeholder: 'After the sale we…' },
      { id: 'lost-deals', type: 'long', title: 'Where do sales fall through?', help: 'After quotes? Price talks? No stock?', placeholder: 'We lose the sale when…' },
    ],
  },
  {
    id: 'operations', name: 'Operations', icon: 'list-checks',
    intro: {
      title: 'A normal day.',
      body: 'Stock, records, and the daily routine.',
      minutes: 4,
    },
    questions: [
      { id: 'normal-day', type: 'long', title: 'Describe a normal day.', help: 'Opening to closing, the ordinary version.', placeholder: 'We open at…' },
      { id: 'inventory', type: 'single', title: 'How do you track stock?', options: [
        'In my head', 'Paper', 'Excel or Sheets', 'An app', 'We don’t', 'No stock',
      ] },
      { id: 'stockouts', type: 'single', title: 'How often does stock run out unnoticed?', options: ['Often', 'Sometimes', 'Rarely', 'Never', 'Not applicable'] },
      { id: 'purchasing', type: 'long', title: 'How do you decide what to restock?', placeholder: 'We restock when…' },
      { id: 'suppliers', type: 'long', title: 'Who do you buy from?', placeholder: 'We buy from…' },
      { id: 'records-kept', type: 'multi', title: 'Which records do you keep?', help: 'Paper counts.', options: [
        'Sales', 'Expenses', 'Customers', 'Stock', 'Owed to us', 'We owe', 'Payroll', 'Hardly any',
      ] },
      { id: 'records-where', type: 'single', title: 'Where do records live?', options: [
        'Paper', 'WhatsApp', 'Excel or Sheets', 'Software', 'Memory',
      ] },
      { id: 'tools', type: 'multi', other: true, title: 'What do you already use?', options: [
        'WhatsApp Business', 'Instagram or Facebook', 'Excel or Sheets', 'POS machine', 'Accounting software', 'Website', 'None',
      ] },
    ],
  },
  {
    id: 'people', name: 'People', icon: 'briefcase',
    intro: {
      title: 'The team.',
      body: 'Who does what, and what depends on you.',
      minutes: 2,
    },
    questions: [
      { id: 'roles', type: 'long', title: 'Who does what?', help: 'Roles are enough.', placeholder: 'I handle…' },
      { id: 'owner-only', type: 'long', title: 'What stops when you’re away?', placeholder: 'Nobody else can…' },
      { id: 'delegation', type: 'scale', title: 'How much runs without you?', low: 'Everything comes to me', high: 'The team runs most things' },
      { id: 'training', type: 'long', title: 'How do new staff learn?', placeholder: 'They learn by…' },
    ],
  },
  {
    id: 'challenges', name: 'Challenges', icon: 'shield-alert',
    intro: {
      title: 'The honest part.',
      body: 'The more honest, the more useful your report.',
      minutes: 3,
    },
    questions: [
      { id: 'frustration', type: 'long', title: 'What frustrates you most right now?', placeholder: 'What tires me most is…' },
      { id: 'time-drains', type: 'multi', other: true, title: 'Where does time get wasted?', options: [
        'Chasing debts', 'Counting stock', 'Quotes & invoices', 'Repeated questions', 'Supervising staff', 'Deliveries', 'Paperwork',
      ] },
      { id: 'money-leaks', type: 'long', title: 'Where does money leak?', help: 'Waste, theft, forgotten debts.', placeholder: 'I think we lose money on…' },
      { id: 'repeat-mistake', type: 'long', title: 'What mistake keeps repeating?', placeholder: 'It keeps happening that…' },
      { id: 'busy-breakdown', type: 'long', title: 'What breaks first when you’re busy?', placeholder: 'When we’re very busy…' },
    ],
  },
  {
    id: 'growth', name: 'Growth', icon: 'rocket',
    intro: {
      title: 'Where this is going.',
      body: 'Your plans, and what stands in the way.',
      minutes: 3,
    },
    questions: [
      { id: 'vision', type: 'long', title: 'Where is this business in three years?', help: 'If everything goes right.', placeholder: 'In three years…' },
      { id: 'plans', type: 'multi', other: true, title: 'What are you considering?', options: [
        'More locations', 'Selling online', 'New products', 'More staff', 'Bigger premises', 'Partnerships', 'Exporting',
      ] },
      { id: 'blockers', type: 'long', title: 'What’s slowing growth right now?', placeholder: 'The main thing is…' },
      { id: 'tech-readiness', type: 'scale', title: 'How ready are you for new technology?', low: 'We like how things are', high: 'Bring it on' },
      { id: 'fears', type: 'long', title: 'What worries you about the future?', placeholder: 'What keeps me up at night…' },
      { id: 'anything-else', type: 'long', title: 'Anything else we should know?', placeholder: 'One more thing…' },
    ],
  },
];

/* ---- derived helpers (used by engine + admin + tests) -------------------- */

/** Flat list of every question with its module attached. */
export const ALL_QUESTIONS = MODULES.flatMap((m) => m.questions.map((q) => ({ ...q, module: m.id })));

export const TOTAL_QUESTIONS = ALL_QUESTIONS.length;

/** @param {string} id */
export const questionById = (id) => ALL_QUESTIONS.find((q) => q.id === id) || null;

/** Progress %, counting a question as done when it has any non-empty answer.
 * @param {Record<string, any>} answers */
export function progressPct(answers) {
  if (!answers) return 0;
  let n = 0;
  for (const q of ALL_QUESTIONS) {
    const v = answers[q.id];
    if (v == null) continue;
    if (Array.isArray(v) ? v.length : String(v).trim() !== '') n++;
  }
  return Math.round((n / TOTAL_QUESTIONS) * 100);
}
