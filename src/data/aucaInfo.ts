type FaqItem = { keywords: string[]; answer: string; };

const FAQ: FaqItem[] = [
    {
        keywords: ['auca', 'adventist', 'university', 'central africa'],
        answer:
            'AUCA is the Adventist University of Central Africa. For official institutional info, please confirm with the AUCA website or Registrar office.',
    },
    {
        keywords: ['campus', 'masoro', 'gishushu', 'nursing'],
        answer:
            'AUCA has multiple campuses (including Masoro, Gishushu, and Nursing/Midwifery). Campus-specific services are handled by each campus office.',
    },
    {
        keywords: ['academic calendar', 'semester', 'term', 'exam', 'timetable', 'schedule'],
        answer:
            'Academic calendars and exam schedules are issued by the Registrar and updated each semester. Please confirm with the Registrar office for the latest dates.',
    },
    {
        keywords: ['tuition', 'fees', 'payment', 'finance', 'bank', 'receipt'],
        answer:
            'Tuition and fee payment details are managed by the Finance Office. Use official AUCA channels for current fees and deadlines.',
    },
    {
        keywords: ['admission', 'apply', 'registration', 'enroll'],
        answer:
            'Admissions and registration steps are published by the Admissions/Registrar office. Always confirm requirements from official AUCA communications.',
    },
    {
        keywords: ['library', 'books', 'borrow', 'return'],
        answer:
            'Library services, opening hours, and borrowing rules are provided by the AUCA library desk. Please confirm locally for up-to-date policies.',
    },
    {
        keywords: ['hostel', 'housing', 'accommodation', 'dorm'],
        answer:
            'Accommodation details are handled by Student Affairs or campus administration. Contact them for availability and procedures.',
    },
    {
        keywords: ['chaplain', 'chapel', 'worship', 'adventist'],
        answer:
            'Chapel and spiritual services are coordinated by the University Chaplaincy. Check campus notices for programs and schedules.',
    },
    {
        keywords: ['aucasa', 'guild', 'election', 'vote'],
        answer:
            'AUCASA elections and student leadership updates are communicated by AUCASA. For official info, check AUCASA announcements.',
    },
];

const TOPICS = [
    'campuses',
    'academic calendar',
    'fees and payments',
    'admissions and registration',
    'library services',
    'accommodation',
    'chaplaincy',
    'AUCASA elections',
];

const normalize = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

export const findAucaAnswer = (question: string) => {
    const normalized = normalize(question);
    if (!normalized) {
        return 'Please type your question about AUCA or AUCASA, and I will try to help.';
    }
    let best: FaqItem | null = null;
    let bestScore = 0;
    for (const item of FAQ) {
        let score = 0;
        for (const key of item.keywords) {
            if (normalized.includes(key)) {
                score += 1;
            }
        }
        if (score > bestScore) {
            bestScore = score;
            best = item;
        }
    }
    if (best && bestScore >= 1) {
        return best.answer;
    }
    return `I only answer verified AUCA/AUCASA topics. Try asking about: ${TOPICS.join(', ')}.`;
};
