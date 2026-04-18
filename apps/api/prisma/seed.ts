import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // ── Countries ──────────────────────────────────────────────────
  console.log('  → Countries');
  const countries = [
    { name: 'Sri Lanka',            nameTa: 'இலங்கை',                     nameSi: 'ශ්‍රී ලංකාව',           code: 'LK', currency: 'LKR' },
    { name: 'India',                nameTa: 'இந்தியா',                     nameSi: 'ඉන්දියාව',              code: 'IN', currency: 'INR' },
    { name: 'Australia',            nameTa: 'ஆஸ்திரேலியா',                 nameSi: 'ඕස්ට්‍රේලියාව',        code: 'AU', currency: 'AUD' },
    { name: 'United Kingdom',       nameTa: 'ஐக்கிய இராச்சியம்',           nameSi: 'එක්සත් රාජධානිය',       code: 'GB', currency: 'GBP' },
    { name: 'United States',        nameTa: 'அமெரிக்கா',                   nameSi: 'ඇමෙරිකාව',             code: 'US', currency: 'USD' },
    { name: 'Canada',               nameTa: 'கனடா',                        nameSi: 'කැනඩාව',               code: 'CA', currency: 'CAD' },
    { name: 'New Zealand',          nameTa: 'நியூசிலாந்து',                 nameSi: 'නවසීලන්තය',            code: 'NZ', currency: 'NZD' },
    { name: 'Germany',              nameTa: 'ஜெர்மனி',                     nameSi: 'ජර්මනිය',              code: 'DE', currency: 'EUR' },
    { name: 'France',               nameTa: 'பிரான்ஸ்',                    nameSi: 'ප්‍රංශය',               code: 'FR', currency: 'EUR' },
    { name: 'Italy',                nameTa: 'இத்தாலி',                     nameSi: 'ඉතාලිය',               code: 'IT', currency: 'EUR' },
    { name: 'Netherlands',          nameTa: 'நெதர்லாந்து',                  nameSi: 'නෙදර්ලන්තය',           code: 'NL', currency: 'EUR' },
    { name: 'Switzerland',          nameTa: 'சுவிட்சர்லாந்து',              nameSi: 'ස්විට්සර්ලන්තය',       code: 'CH', currency: 'CHF' },
    { name: 'Sweden',               nameTa: 'சுவீடன்',                     nameSi: 'ස්වීඩනය',              code: 'SE', currency: 'SEK' },
    { name: 'Norway',               nameTa: 'நோர்வே',                      nameSi: 'නෝර්වේ',               code: 'NO', currency: 'NOK' },
    { name: 'Denmark',              nameTa: 'டென்மார்க்',                   nameSi: 'ඩෙන්මාර්කය',           code: 'DK', currency: 'DKK' },
    { name: 'Finland',              nameTa: 'பின்லாந்து',                   nameSi: 'ෆින්ලන්තය',            code: 'FI', currency: 'EUR' },
    { name: 'Belgium',              nameTa: 'பெல்ஜியம்',                   nameSi: 'බෙල්ජියම',             code: 'BE', currency: 'EUR' },
    { name: 'Spain',                nameTa: 'ஸ்பெயின்',                    nameSi: 'ස්පාඤ්ඤය',             code: 'ES', currency: 'EUR' },
    { name: 'Portugal',             nameTa: 'போர்த்துகல்',                  nameSi: 'පෘතුගාලය',             code: 'PT', currency: 'EUR' },
    { name: 'Ireland',              nameTa: 'அயர்லாந்து',                   nameSi: 'අයර්ලන්තය',            code: 'IE', currency: 'EUR' },
    { name: 'Singapore',            nameTa: 'சிங்கப்பூர்',                  nameSi: 'සිංගප්පූරුව',           code: 'SG', currency: 'SGD' },
    { name: 'Malaysia',             nameTa: 'மலேசியா',                     nameSi: 'මැලේසියාව',             code: 'MY', currency: 'MYR' },
    { name: 'United Arab Emirates', nameTa: 'ஐக்கிய அரபு எமிரேட்ஸ்',      nameSi: 'එක්සත් අරාබි එමිරේට්ස්', code: 'AE', currency: 'AED' },
    { name: 'Qatar',                nameTa: 'கத்தார்',                     nameSi: 'කතාර්',                code: 'QA', currency: 'QAR' },
    { name: 'Saudi Arabia',         nameTa: 'சவூதி அரேபியா',               nameSi: 'සෞදි අරාබිය',           code: 'SA', currency: 'SAR' },
    { name: 'Kuwait',               nameTa: 'குவைத்',                      nameSi: 'කුවේට්',               code: 'KW', currency: 'KWD' },
    { name: 'Bahrain',              nameTa: 'பஹ்ரைன்',                     nameSi: 'බහ්රේන්',              code: 'BH', currency: 'BHD' },
    { name: 'Oman',                 nameTa: 'ஓமான்',                       nameSi: 'ඕමානය',                code: 'OM', currency: 'OMR' },
    { name: 'Japan',                nameTa: 'ஜப்பான்',                     nameSi: 'ජපානය',                code: 'JP', currency: 'JPY' },
    { name: 'South Korea',          nameTa: 'தென் கொரியா',                 nameSi: 'දකුණු කොරියාව',        code: 'KR', currency: 'KRW' },
    { name: 'China',                nameTa: 'சீனா',                        nameSi: 'චීනය',                 code: 'CN', currency: 'CNY' },
    { name: 'Pakistan',             nameTa: 'பாகிஸ்தான்',                  nameSi: 'පාකිස්තානය',            code: 'PK', currency: 'PKR' },
    { name: 'Bangladesh',           nameTa: 'வங்காளதேசம்',                 nameSi: 'බංගලාදේශය',             code: 'BD', currency: 'BDT' },
    { name: 'Maldives',             nameTa: 'மாலத்தீவு',                   nameSi: 'මාල දිවයිනය',           code: 'MV', currency: 'MVR' },
    { name: 'South Africa',         nameTa: 'தென் ஆப்பிரிக்கா',            nameSi: 'දකුණු අප්‍රිකාව',      code: 'ZA', currency: 'ZAR' },
    { name: 'Other',                nameTa: 'மற்றவை',                      nameSi: 'වෙනත්',                code: null, currency: null  },
  ];

  await prisma.country.createMany({ data: countries, skipDuplicates: true });

  // ── Religions ──────────────────────────────────────────────────
  console.log('  → Religions');
  const religions = [
    { name: 'Buddhist',          nameTa: 'பவுத்தம்',                  nameSi: 'බෞද්ධ' },
    { name: 'Hindu',             nameTa: 'இந்து',                     nameSi: 'හින්දු' },
    { name: 'Roman Catholic',    nameTa: 'ரோமன் கத்தோலிக்கம்',       nameSi: 'රෝමෝ කතෝලික' },
    { name: 'Christian (Non RC)',nameTa: 'கிறிஸ்தவம் (ஆர்.சி அல்ல)', nameSi: 'ක්‍රිස්තියානි (RC නොවේ)' },
    { name: 'Muslim',            nameTa: 'இஸ்லாம்',                   nameSi: 'මුස්ලිම්' },
    { name: 'Burgher',           nameTa: 'பர்கர்',                    nameSi: 'බර්ගර්' },
    { name: 'Other',             nameTa: 'மற்றவை',                    nameSi: 'වෙනත්' },
  ];
  await prisma.religion.createMany({ data: religions, skipDuplicates: true });

  // ── Mother Tongues ─────────────────────────────────────────────
  console.log('  → Mother Tongues');
  const motherTongues = [
    { name: 'Sinhala', nameTa: 'சிங்களம்',  nameSi: 'සිංහල' },
    { name: 'Tamil',   nameTa: 'தமிழ்',      nameSi: 'දෙමළ' },
    { name: 'English', nameTa: 'ஆங்கிலம்',  nameSi: 'ඉංග්‍රීසි' },
    { name: 'Other',   nameTa: 'மற்றவை',    nameSi: 'වෙනත්' },
  ];
  await prisma.motherTongue.createMany({ data: motherTongues, skipDuplicates: true });

  // ── Education ──────────────────────────────────────────────────
  console.log('  → Education');
  const educations = [
    { name: 'Below High School',        nameTa: 'உயர்நிலைக்கு கீழ்',     nameSi: 'උසස් පාසලට පෙළ' },
    { name: 'High School',              nameTa: 'உயர்நிலைப் பள்ளி',      nameSi: 'උසස් පාසල' },
    { name: 'Professional Certificate', nameTa: 'தொழில்முறை சான்றிதழ்',   nameSi: 'වෘත්තීය සහතිකය' },
    { name: 'Diploma',                  nameTa: 'டிப்ளோமா',               nameSi: 'ඩිප්ලෝමාව' },
    { name: 'Higher Diploma',           nameTa: 'உயர் டிப்ளோமா',          nameSi: 'උසස් ඩිප්ලෝමාව' },
    { name: "Bachelor's Degree",        nameTa: 'இளநிலை பட்டம்',          nameSi: 'ශාස්ත්‍රවේදී උපාධිය' },
    { name: "Master's Degree",          nameTa: 'முதுகலை பட்டம்',          nameSi: 'ශාස්ත්‍රපති උපාධිය' },
    { name: 'PhD / Doctorate',          nameTa: 'முனைவர் பட்டம்',          nameSi: 'PhD / ආචාර්ය' },
    { name: 'Other',                    nameTa: 'மற்றவை',                  nameSi: 'වෙනත්' },
  ];
  await prisma.education.createMany({ data: educations, skipDuplicates: true });

  // ── Occupation Groups + Occupations ───────────────────────────
  console.log('  → Occupation Groups & Occupations');

  const occupationData: { group: string; occupations: string[] }[] = [
    {
      group: 'Administration',
      occupations: [
        'Manager', 'Supervisor', 'Officer', 'Administrative Professional',
        'Executive', 'Clerk', 'Human Resources Professional', 'Secretary / Front Office',
      ],
    },
    {
      group: 'Agriculture',
      occupations: ['Agriculture & Farming Professional', 'Horticulturist'],
    },
    {
      group: 'Airline',
      occupations: ['Pilot', 'Air Hostess / Flight Attendant', 'Airline Professional'],
    },
    {
      group: 'Architecture & Design',
      occupations: ['Architect', 'Interior Designer'],
    },
    {
      group: 'Banking & Finance',
      occupations: [
        'Chartered Accountant', 'Company Secretary', 'Accounts / Finance Professional',
        'Banking Service Professional', 'Auditor', 'Financial Accountant',
        'Financial Analyst / Planning', 'Investment Professional',
      ],
    },
    {
      group: 'Beauty & Fashion',
      occupations: [
        'Fashion Designer', 'Beautician', 'Hair Stylist',
        'Jewellery Designer', 'Designer (Others)', 'Makeup Artist',
      ],
    },
    {
      group: 'BPO & Customer Service',
      occupations: ['BPO / KPO / ITes Professional', 'Customer Service Professional'],
    },
    {
      group: 'Civil Services',
      occupations: ['Civil Services (SLAS)'],
    },
    {
      group: 'Corporate Professionals',
      occupations: [
        'Analyst', 'Consultant', 'Corporate Communication', 'Corporate Planning',
        'Marketing Professional', 'Operations Management', 'Sales Professional',
        'Senior Manager / Manager', 'Subject Matter Expert',
        'Business Development Professional', 'Content Writer',
      ],
    },
    {
      group: 'Defence',
      occupations: ['Army', 'Navy', 'Air Force', 'Paramilitary', 'Defence Services (Others)'],
    },
    {
      group: 'Education & Training',
      occupations: [
        'Professor / Lecturer', 'Teaching / Academician', 'Education Professional',
        'Training Professional', 'Research Assistant', 'Research Scholar',
      ],
    },
    {
      group: 'Engineering',
      occupations: [
        'Civil Engineer', 'Electronics / Telecom Engineer', 'Mechanical / Production Engineer',
        'Quality Assurance Engineer (Non IT)', 'Engineer (Non IT)',
        'Product Manager (Non IT)', 'Project Manager (Non IT)',
      ],
    },
    {
      group: 'Hospitality',
      occupations: [
        'Hotel / Hospitality Professional', 'Restaurant / Catering Professional', 'Chef / Cook',
      ],
    },
    {
      group: 'IT & Software',
      occupations: [
        'Software Professional', 'Hardware Professional', 'Product Manager', 'Project Manager',
        'Program Manager', 'Animator', 'Cyber / Network Security', 'UI / UX Designer',
        'Web / Graphic Designer', 'Software Consultant', 'Data Analyst', 'Data Scientist',
        'Network Engineer', 'Quality Assurance Engineer',
      ],
    },
    {
      group: 'Legal',
      occupations: ['Lawyer & Legal Professional', 'Legal Assistant'],
    },
    {
      group: 'Law Enforcement',
      occupations: ['Law Enforcement Officer', 'Police'],
    },
    {
      group: 'Medical & Healthcare',
      occupations: [
        'Doctor', 'Surgeon', 'Dentist', 'Nurse', 'Pharmacist', 'Physiotherapist',
        'Psychologist', 'Veterinary Doctor', 'Therapist', 'Healthcare Professional',
        'Paramedical Professional', 'Medical Transcriptionist',
        'Dietician / Nutritionist', 'Lab Technician',
      ],
    },
    {
      group: 'Media & Entertainment',
      occupations: [
        'Journalist', 'Media Professional', 'Entertainment Professional',
        'Event Management Professional', 'Advertising / PR Professional',
        'Actor / Model', 'Artist',
      ],
    },
    {
      group: 'Merchant Navy',
      occupations: ['Mariner / Merchant Navy', 'Sailor'],
    },
    {
      group: 'Science & Research',
      occupations: ['Scientist / Researcher'],
    },
    {
      group: 'Top Management',
      occupations: ['CXO / President / Director / Chairman', 'VP / AVP / GM / DGM / AGM'],
    },
    {
      group: 'Others',
      occupations: [
        'Business Owner / Entrepreneur', 'Freelancer', 'Student', 'Not Working',
        'Technician', 'Arts & Craftsman', 'Librarian',
        'Transportation / Logistics Professional', 'Agent / Broker / Trader',
        'Contractor', 'Fitness Professional', 'Security Professional',
        'Social Worker / Volunteer / NGO', 'Sportsperson', 'Travel Professional',
        'Singer', 'Musician', 'Writer', 'Politician', 'Builder',
        'Chemist', 'CNC Operator', 'Distributor', 'Driver',
        'Mechanic', 'Medical Representative', 'Photo / Videographer',
        'Surveyor', 'Tailor', 'Associate', 'Other',
      ],
    },
  ];

  for (const { group, occupations } of occupationData) {
    const created = await prisma.occupationGroup.upsert({
      where:  { name: group },
      update: {},
      create: { name: group },
    });

    await prisma.occupation.createMany({
      data: occupations.map((name) => ({ name, groupId: created.id })),
      skipDuplicates: true,
    });
  }

  // ── Body Types ─────────────────────────────────────────────────
  console.log('  → Body Types');
  const bodyTypes = [
    {
      value: 'SLIM', label: 'Slim', labelTa: 'மெலிதான உடல்', labelSi: 'සිහිනැසිය',
      description: 'Slender build', descriptionTa: 'மெல்லிய கட்டமைப்பு', descriptionSi: 'සිහිල් ශරීරාකාරය',
      sortOrder: 1,
      svgContent: '<ellipse cx="14" cy="7" rx="5" ry="6"/><path d="M10 13 Q14 17 18 13 L18.5 34 Q14 33 9.5 34 Z"/><rect x="10" y="33" width="4" height="20" rx="2"/><rect x="14.5" y="33" width="4" height="20" rx="2"/>',
    },
    {
      value: 'ATHLETIC', label: 'Athletic', labelTa: 'தடகள உடல்', labelSi: 'ක්‍රීඩාත්මක',
      description: 'Toned & fit', descriptionTa: 'வலிமையான & தகுதியான', descriptionSi: 'ශක්තිමත් සහ සෞඛ්‍යසම්පන්න',
      sortOrder: 2,
      svgContent: '<ellipse cx="14" cy="6" rx="5.5" ry="5.5"/><path d="M7 12 Q14 18 21 12 L21 34 Q14 32 7 34 Z"/><rect x="9" y="33" width="4.5" height="20" rx="2"/><rect x="14.5" y="33" width="4.5" height="20" rx="2"/>',
    },
    {
      value: 'AVERAGE', label: 'Average', labelTa: 'சராசரி உடல்', labelSi: 'සාමාන්‍ය',
      description: 'Regular build', descriptionTa: 'சாதாரண கட்டமைப்பு', descriptionSi: 'සාමාන්‍ය ශරීරාකාරය',
      sortOrder: 3,
      svgContent: '<ellipse cx="14" cy="7" rx="5" ry="6"/><path d="M8 13 Q14 19 20 13 L21 35 Q14 33 7 35 Z"/><rect x="9" y="34" width="4.5" height="19" rx="2"/><rect x="14.5" y="34" width="4.5" height="19" rx="2"/>',
    },
    {
      value: 'HEAVY', label: 'Heavy', labelTa: 'கனத்த உடல்', labelSi: 'ශරීරාකාරය',
      description: 'Fuller build', descriptionTa: 'திரண்ட கட்டமைப்பு', descriptionSi: 'ශක්තිමත් ශරීරාකාරය',
      sortOrder: 4,
      svgContent: '<ellipse cx="14" cy="6.5" rx="6" ry="6"/><path d="M6 13 Q14 21 22 13 L23 36 Q14 35 5 36 Z"/><rect x="7" y="35" width="5.5" height="19" rx="2"/><rect x="15.5" y="35" width="5.5" height="19" rx="2"/>',
    },
  ];
  for (const bt of bodyTypes) {
    await prisma.bodyTypeOption.upsert({
      where:  { value: bt.value },
      update: { svgContent: bt.svgContent, labelTa: bt.labelTa, labelSi: bt.labelSi, descriptionTa: bt.descriptionTa, descriptionSi: bt.descriptionSi },
      create: bt,
    });
  }

  // ── Marital Status ─────────────────────────────────────────────
  console.log('  → Marital Status Options');
  const maritalStatuses = [
    { value: 'UNMARRIED', label: 'Never Married', labelTa: 'திருமணமாகாதவர்',   labelSi: 'කිසිවිටෙකත් විවාහ නොවූ', sortOrder: 1 },
    { value: 'DIVORCED',  label: 'Divorced',      labelTa: 'விவாகரத்துசெய்தவர்', labelSi: 'දික්කසාද',               sortOrder: 2 },
    { value: 'WIDOWED',   label: 'Widowed',       labelTa: 'விதவை / விதுரன்',    labelSi: 'වැන්දඹු',                sortOrder: 3 },
    { value: 'SEPARATED', label: 'Separated',     labelTa: 'பிரிந்து வாழ்பவர்',  labelSi: 'වෙන් වූ',                sortOrder: 4 },
  ];
  await (prisma as any).maritalStatusOption.createMany({ data: maritalStatuses, skipDuplicates: true });

  // ── Gender ─────────────────────────────────────────────────────
  console.log('  → Gender Options');
  const genders = [
    { value: 'FEMALE', label: 'Bride (Female)', labelTa: 'மணமகள் (பெண்)',  labelSi: 'දැරිය (ගැහැණු)', icon: '🌸', sortOrder: 1 },
    { value: 'MALE',   label: 'Groom (Male)',   labelTa: 'மணமகன் (ஆண்)',   labelSi: 'දරු (පිරිමි)',   icon: '💙', sortOrder: 2 },
  ];
  await (prisma as any).genderOption.createMany({ data: genders, skipDuplicates: true });

  // ── Physical Status ────────────────────────────────────────────
  console.log('  → Physical Status Options');
  const physicalStatuses = [
    { value: 'NORMAL',                label: 'Normal',               labelTa: 'சாதாரண',         labelSi: 'සාමාන්‍ය',                    icon: '✅', sortOrder: 1 },
    { value: 'PHYSICALLY_CHALLENGED', label: 'Physically Challenged', labelTa: 'உடல் குறைபாடுள்ளவர்', labelSi: 'ශාරීරිකව අභියෝගාත්මක', icon: '♿', sortOrder: 2 },
  ];
  await (prisma as any).physicalStatusOption.createMany({ data: physicalStatuses, skipDuplicates: true });

  // ── Smoking Habit ──────────────────────────────────────────────
  console.log('  → Smoking Habit Options');
  const smokingHabits = [
    { value: 'NO',            label: 'No',             labelTa: 'இல்லை',          labelSi: 'නැත',          icon: '🚭', sortOrder: 1 },
    { value: 'YES',           label: 'Yes',            labelTa: 'ஆம்',             labelSi: 'ඔව්',          icon: '🚬', sortOrder: 2 },
    { value: 'DOESNT_MATTER', label: "Doesn't Matter", labelTa: 'முக்கியமில்லை',  labelSi: 'වාසිය නොවේ', icon: '🤷', sortOrder: 3 },
  ];
  await (prisma as any).smokingHabitOption.createMany({ data: smokingHabits, skipDuplicates: true });

  // ── Drinking Habit ─────────────────────────────────────────────
  console.log('  → Drinking Habit Options');
  const drinkingHabits = [
    { value: 'NON_DRINKER',   label: 'Non-Drinker',    labelTa: 'குடிக்க மாட்டேன்',  labelSi: 'නොබොනු',         icon: '🚫', sortOrder: 1 },
    { value: 'LIGHT_SOCIAL',  label: 'Light / Social',  labelTa: 'சில நேரங்களில்',    labelSi: 'සැහැල්ලු / සමාජීය', icon: '🍷', sortOrder: 2 },
    { value: 'REGULAR',       label: 'Regular',          labelTa: 'தொடர்ந்து',         labelSi: 'නිතිපතා',        icon: '🍺', sortOrder: 3 },
    { value: 'DOESNT_MATTER', label: "Doesn't Matter",  labelTa: 'முக்கியமில்லை',    labelSi: 'වාසිය නොවේ',     icon: '🤷', sortOrder: 4 },
  ];
  await (prisma as any).drinkingHabitOption.createMany({ data: drinkingHabits, skipDuplicates: true });

  // ── Eating Habit ───────────────────────────────────────────────
  console.log('  → Eating Habit Options');
  const eatingHabits = [
    { value: 'VEGETARIAN',          label: 'Vegetarian',          labelTa: 'சைவம்',                labelSi: 'නිර්මාංශ',          icon: '🥦', sortOrder: 1 },
    { value: 'NON_VEGETARIAN',      label: 'Non-Vegetarian',      labelTa: 'அசைவம்',               labelSi: 'මාංශ',              icon: '🍗', sortOrder: 2 },
    { value: 'HALAL_ALWAYS',        label: 'Halal Always',        labelTa: 'எப்போதும் ஹலால்',     labelSi: 'සෑම විටම හලාල්',   icon: '☪️', sortOrder: 3 },
    { value: 'HALAL_WHEN_POSSIBLE', label: 'Halal When Possible', labelTa: 'முடிந்தபோது ஹலால்',   labelSi: 'හැකි විට හලාල්',   icon: '☪️', sortOrder: 4 },
    { value: 'NO_RESTRICTION',      label: 'No Restriction',      labelTa: 'கட்டுப்பாடில்லை',     labelSi: 'සීමා නැත',         icon: '🍽️', sortOrder: 5 },
  ];
  await (prisma as any).eatingHabitOption.createMany({ data: eatingHabits, skipDuplicates: true });

  // ── Employment Status ──────────────────────────────────────────
  console.log('  → Employment Status Options');
  const employmentStatuses = [
    { value: 'GOVERNMENT',    label: 'Government',              labelTa: 'அரசு',           labelSi: 'රජ',              icon: '🏛️', sortOrder: 1 },
    { value: 'PRIVATE',       label: 'Private Sector',          labelTa: 'தனியார்',        labelSi: 'පෞද්ගලික',       icon: '🏢', sortOrder: 2 },
    { value: 'BUSINESS',      label: 'Business / Own Business', labelTa: 'சொந்த தொழில்',  labelSi: 'ව්‍යාපාර',       icon: '💼', sortOrder: 3 },
    { value: 'SELF_EMPLOYED', label: 'Self-Employed',           labelTa: 'சுயதொழில்',      labelSi: 'ස්ව රැකියා',    icon: '🧑‍💻', sortOrder: 4 },
    { value: 'NOT_WORKING',   label: 'Not Working',             labelTa: 'வேலை இல்லை',    labelSi: 'රැකියා නොමැත', icon: '🏠', sortOrder: 5 },
  ];
  await (prisma as any).employmentStatusOption.createMany({ data: employmentStatuses, skipDuplicates: true });

  // ── User Role ──────────────────────────────────────────────────
  console.log('  → User Role Options');
  await (prisma as any).userRoleOption.createMany({
    data: [
      { value: 'INDIVIDUAL', label: 'Individual',  sortOrder: 1 },
      { value: 'MATCHMAKER', label: 'Matchmaker',  sortOrder: 2 },
      { value: 'PARTNER',    label: 'Partner',     sortOrder: 3 },
      { value: 'ADMIN',      label: 'Admin',       sortOrder: 4 },
    ],
    skipDuplicates: true,
  });

  // ── User Status ────────────────────────────────────────────────
  console.log('  → User Status Options');
  await (prisma as any).userStatusOption.createMany({
    data: [
      { value: 'PENDING',   label: 'Pending',   sortOrder: 1 },
      { value: 'ACTIVE',    label: 'Active',    sortOrder: 2 },
      { value: 'SUSPENDED', label: 'Suspended', sortOrder: 3 },
      { value: 'DELETED',   label: 'Deleted',   sortOrder: 4 },
    ],
    skipDuplicates: true,
  });

  // ── Partner Type ───────────────────────────────────────────────
  console.log('  → Partner Type Options');
  await (prisma as any).partnerTypeOption.createMany({
    data: [
      { value: 'PHOTOGRAPHY',    label: 'Photography',          icon: '📷', sortOrder: 1 },
      { value: 'VIDEOGRAPHY',    label: 'Videography',          icon: '🎥', sortOrder: 2 },
      { value: 'VENUE',          label: 'Venue / Hall',         icon: '🏛️', sortOrder: 3 },
      { value: 'CATERING',       label: 'Catering',             icon: '🍽️', sortOrder: 4 },
      { value: 'MAKEUP',         label: 'Makeup & Beauty',      icon: '💄', sortOrder: 5 },
      { value: 'FLORIST',        label: 'Florist',              icon: '💐', sortOrder: 6 },
      { value: 'MUSIC',          label: 'Music & DJ',           icon: '🎵', sortOrder: 7 },
      { value: 'DECOR',          label: 'Decoration',           icon: '✨', sortOrder: 8 },
      { value: 'TRANSPORT',      label: 'Transport',            icon: '🚗', sortOrder: 9 },
      { value: 'INVITATION',     label: 'Invitation Cards',     icon: '💌', sortOrder: 10 },
      { value: 'CAKE',           label: 'Wedding Cake',         icon: '🎂', sortOrder: 11 },
      { value: 'JEWELLERY',      label: 'Jewellery',            icon: '💍', sortOrder: 12 },
      { value: 'MEHENDI',        label: 'Mehendi / Henna',      icon: '🌿', sortOrder: 13 },
      { value: 'ENTERTAINMENT',  label: 'Entertainment',        icon: '🎭', sortOrder: 14 },
      { value: 'PLANNING',       label: 'Wedding Planning',     icon: '📋', sortOrder: 15 },
    ],
    skipDuplicates: true,
  });

  // ── Profile Created By ─────────────────────────────────────────
  console.log('  → Profile Created By Options');
  await (prisma as any).profileCreatedByOption.createMany({
    data: [
      { value: 'MY_SELF',  label: 'Myself',            sortOrder: 1 },
      { value: 'PARENTS',  label: 'Parents',            sortOrder: 2 },
      { value: 'SIBLING',  label: 'Sibling',            sortOrder: 3 },
      { value: 'RELATIVE', label: 'Relative',           sortOrder: 4 },
      { value: 'FRIEND',   label: 'Friend',             sortOrder: 5 },
    ],
    skipDuplicates: true,
  });

  // ── Profile Status ─────────────────────────────────────────────
  console.log('  → Profile Status Options');
  await (prisma as any).profileStatusOption.createMany({
    data: [
      { value: 'INCOMPLETE', label: 'Incomplete', sortOrder: 1 },
      { value: 'ACTIVE',     label: 'Active',     sortOrder: 2 },
      { value: 'PAUSED',     label: 'Paused',     sortOrder: 3 },
      { value: 'HIDDEN',     label: 'Hidden',     sortOrder: 4 },
      { value: 'MARRIED',    label: 'Married',    sortOrder: 5 },
      { value: 'DELETED',    label: 'Deleted',    sortOrder: 6 },
    ],
    skipDuplicates: true,
  });

  // ── Subscription Plan ──────────────────────────────────────────
  console.log('  → Subscription Plan Options');
  await (prisma as any).subscriptionPlanOption.createMany({
    data: [
      { value: 'FREE',     label: 'Free',     sortOrder: 1 },
      { value: 'BASIC',    label: 'Basic',    sortOrder: 2 },
      { value: 'STANDARD', label: 'Standard', sortOrder: 3 },
      { value: 'PREMIUM',  label: 'Premium',  sortOrder: 4 },
    ],
    skipDuplicates: true,
  });

  // ── Record Status ──────────────────────────────────────────────
  console.log('  → Record Status Options');
  await (prisma as any).recordStatusOption.createMany({
    data: [
      { value: 'ACTIVE',   label: 'Active',   sortOrder: 1 },
      { value: 'INACTIVE', label: 'Inactive', sortOrder: 2 },
      { value: 'DELETED',  label: 'Deleted',  sortOrder: 3 },
    ],
    skipDuplicates: true,
  });

  // ── Match Status ───────────────────────────────────────────────
  console.log('  → Match Status Options');
  await (prisma as any).matchStatusOption.createMany({
    data: [
      { value: 'PENDING',   label: 'Pending',   sortOrder: 1 },
      { value: 'ACCEPTED',  label: 'Accepted',  sortOrder: 2 },
      { value: 'DECLINED',  label: 'Declined',  sortOrder: 3 },
      { value: 'BLOCKED',   label: 'Blocked',   sortOrder: 4 },
    ],
    skipDuplicates: true,
  });

  // ── Message Type ───────────────────────────────────────────────
  console.log('  → Message Type Options');
  await (prisma as any).messageTypeOption.createMany({
    data: [
      { value: 'TEXT',  label: 'Text',  sortOrder: 1 },
      { value: 'IMAGE', label: 'Image', sortOrder: 2 },
      { value: 'AUDIO', label: 'Audio', sortOrder: 3 },
      { value: 'VIDEO', label: 'Video', sortOrder: 4 },
    ],
    skipDuplicates: true,
  });

  // ── Contact Request Status ─────────────────────────────────────
  console.log('  → Contact Request Status Options');
  await (prisma as any).contactRequestStatusOption.createMany({
    data: [
      { value: 'NEW',       label: 'New',       sortOrder: 1 },
      { value: 'VIEWED',    label: 'Viewed',    sortOrder: 2 },
      { value: 'ACCEPTED',  label: 'Accepted',  sortOrder: 3 },
      { value: 'DECLINED',  label: 'Declined',  sortOrder: 4 },
    ],
    skipDuplicates: true,
  });

  // ── Hobbies ────────────────────────────────────────────────────
  console.log('  → Hobby Options');
  await (prisma as any).hobbyOption.createMany({
    data: [
      // Arts & Creative
      { value: 'ACTING',               label: 'Acting',                  category: 'ARTS_CREATIVE',    categoryLabel: 'Arts & Creative',   categoryEmoji: '🎨', sortOrder: 1 },
      { value: 'ART_HANDICRAFT',       label: 'Art / Handicraft',        category: 'ARTS_CREATIVE',    categoryLabel: 'Arts & Creative',   categoryEmoji: '🎨', sortOrder: 2 },
      { value: 'BLOGGING',             label: 'Blogging',                category: 'ARTS_CREATIVE',    categoryLabel: 'Arts & Creative',   categoryEmoji: '🎨', sortOrder: 3 },
      { value: 'BOOK_CLUBS',           label: 'Book clubs',              category: 'ARTS_CREATIVE',    categoryLabel: 'Arts & Creative',   categoryEmoji: '🎨', sortOrder: 4 },
      { value: 'COLLECTIBLES',         label: 'Collectibles',            category: 'ARTS_CREATIVE',    categoryLabel: 'Arts & Creative',   categoryEmoji: '🎨', sortOrder: 5 },
      { value: 'COOKING',              label: 'Cooking',                 category: 'ARTS_CREATIVE',    categoryLabel: 'Arts & Creative',   categoryEmoji: '🎨', sortOrder: 6 },
      { value: 'DANCING',              label: 'Dancing',                 category: 'ARTS_CREATIVE',    categoryLabel: 'Arts & Creative',   categoryEmoji: '🎨', sortOrder: 7 },
      { value: 'FILM_MAKING',          label: 'Film-making',             category: 'ARTS_CREATIVE',    categoryLabel: 'Arts & Creative',   categoryEmoji: '🎨', sortOrder: 8 },
      { value: 'GARDENING',            label: 'Gardening / Landscaping', category: 'ARTS_CREATIVE',    categoryLabel: 'Arts & Creative',   categoryEmoji: '🎨', sortOrder: 9 },
      { value: 'PAINTING',             label: 'Painting',                category: 'ARTS_CREATIVE',    categoryLabel: 'Arts & Creative',   categoryEmoji: '🎨', sortOrder: 10 },
      { value: 'PETS',                 label: 'Pets',                    category: 'ARTS_CREATIVE',    categoryLabel: 'Arts & Creative',   categoryEmoji: '🎨', sortOrder: 11 },
      { value: 'PHOTOGRAPHY',          label: 'Photography',             category: 'ARTS_CREATIVE',    categoryLabel: 'Arts & Creative',   categoryEmoji: '🎨', sortOrder: 12 },
      { value: 'PLAYING_INSTRUMENTS',  label: 'Playing musical instruments', category: 'ARTS_CREATIVE', categoryLabel: 'Arts & Creative', categoryEmoji: '🎨', sortOrder: 13 },
      { value: 'PUZZLES',              label: 'Puzzles',                 category: 'ARTS_CREATIVE',    categoryLabel: 'Arts & Creative',   categoryEmoji: '🎨', sortOrder: 14 },
      { value: 'WRITING',              label: 'Writing',                 category: 'ARTS_CREATIVE',    categoryLabel: 'Arts & Creative',   categoryEmoji: '🎨', sortOrder: 15 },
      // Adventure & Sports
      { value: 'ADVENTURE_SPORTS',     label: 'Adventure sports',        category: 'ADVENTURE_SPORTS', categoryLabel: 'Adventure & Sports', categoryEmoji: '⚽', sortOrder: 20 },
      { value: 'BIKING',               label: 'Biking',                  category: 'ADVENTURE_SPORTS', categoryLabel: 'Adventure & Sports', categoryEmoji: '⚽', sortOrder: 21 },
      { value: 'CYCLING',              label: 'Cycling',                 category: 'ADVENTURE_SPORTS', categoryLabel: 'Adventure & Sports', categoryEmoji: '⚽', sortOrder: 22 },
      { value: 'FISHING',              label: 'Fishing',                 category: 'ADVENTURE_SPORTS', categoryLabel: 'Adventure & Sports', categoryEmoji: '⚽', sortOrder: 23 },
      { value: 'HEALTH_FITNESS',       label: 'Health & Fitness',        category: 'ADVENTURE_SPORTS', categoryLabel: 'Adventure & Sports', categoryEmoji: '⚽', sortOrder: 24 },
      { value: 'SPORTS',               label: 'Sports',                  category: 'ADVENTURE_SPORTS', categoryLabel: 'Adventure & Sports', categoryEmoji: '⚽', sortOrder: 25 },
      { value: 'YOGA',                 label: 'Yoga',                    category: 'ADVENTURE_SPORTS', categoryLabel: 'Adventure & Sports', categoryEmoji: '⚽', sortOrder: 26 },
      // Mind & Knowledge
      { value: 'ASTROLOGY',            label: 'Astrology',               category: 'MIND_KNOWLEDGE',   categoryLabel: 'Mind & Knowledge',  categoryEmoji: '🧠', sortOrder: 30 },
      { value: 'ASTRONOMY',            label: 'Astronomy',               category: 'MIND_KNOWLEDGE',   categoryLabel: 'Mind & Knowledge',  categoryEmoji: '🧠', sortOrder: 31 },
      { value: 'COMPUTER_GAMES',       label: 'Computer games',          category: 'MIND_KNOWLEDGE',   categoryLabel: 'Mind & Knowledge',  categoryEmoji: '🧠', sortOrder: 32 },
      { value: 'CROSSWORDS',           label: 'Crosswords',              category: 'MIND_KNOWLEDGE',   categoryLabel: 'Mind & Knowledge',  categoryEmoji: '🧠', sortOrder: 33 },
      { value: 'GRAPHOLOGY',           label: 'Graphology',              category: 'MIND_KNOWLEDGE',   categoryLabel: 'Mind & Knowledge',  categoryEmoji: '🧠', sortOrder: 34 },
      { value: 'LANGUAGES',            label: 'Learning new languages',  category: 'MIND_KNOWLEDGE',   categoryLabel: 'Mind & Knowledge',  categoryEmoji: '🧠', sortOrder: 35 },
      { value: 'NATURE',               label: 'Nature',                  category: 'MIND_KNOWLEDGE',   categoryLabel: 'Mind & Knowledge',  categoryEmoji: '🧠', sortOrder: 36 },
      { value: 'NUMEROLOGY',           label: 'Numerology',              category: 'MIND_KNOWLEDGE',   categoryLabel: 'Mind & Knowledge',  categoryEmoji: '🧠', sortOrder: 37 },
      { value: 'PALMISTRY',            label: 'Palmistry',               category: 'MIND_KNOWLEDGE',   categoryLabel: 'Mind & Knowledge',  categoryEmoji: '🧠', sortOrder: 38 },
      { value: 'READING',              label: 'Reading',                 category: 'MIND_KNOWLEDGE',   categoryLabel: 'Mind & Knowledge',  categoryEmoji: '🧠', sortOrder: 39 },
      // Social & Culture
      { value: 'MOVIES',               label: 'Movies',                  category: 'SOCIAL_CULTURE',   categoryLabel: 'Social & Culture',  categoryEmoji: '🎭', sortOrder: 40 },
      { value: 'MUSIC',                label: 'Music',                   category: 'SOCIAL_CULTURE',   categoryLabel: 'Social & Culture',  categoryEmoji: '🎭', sortOrder: 41 },
      { value: 'POLITICS',             label: 'Politics',                category: 'SOCIAL_CULTURE',   categoryLabel: 'Social & Culture',  categoryEmoji: '🎭', sortOrder: 42 },
      { value: 'SOCIAL_SERVICE',       label: 'Social service',          category: 'SOCIAL_CULTURE',   categoryLabel: 'Social & Culture',  categoryEmoji: '🎭', sortOrder: 43 },
      { value: 'TELEVISION',           label: 'Television',              category: 'SOCIAL_CULTURE',   categoryLabel: 'Social & Culture',  categoryEmoji: '🎭', sortOrder: 44 },
      { value: 'THEATRE',              label: 'Theatre',                 category: 'SOCIAL_CULTURE',   categoryLabel: 'Social & Culture',  categoryEmoji: '🎭', sortOrder: 45 },
      { value: 'TRAVEL',               label: 'Travel',                  category: 'SOCIAL_CULTURE',   categoryLabel: 'Social & Culture',  categoryEmoji: '🎭', sortOrder: 46 },
    ],
    skipDuplicates: true,
  });

  // ── Music Options ──────────────────────────────────────────────
  console.log('  → Music Options');
  await (prisma as any).musicOption.createMany({
    data: [
      { value: 'BLUES',           label: 'Blues',             sortOrder: 1  },
      { value: 'COUNTRY',         label: 'Country Music',     sortOrder: 2  },
      { value: 'DEVOTIONAL',      label: 'Devotional',        sortOrder: 3  },
      { value: 'DISCO',           label: 'Disco',             sortOrder: 4  },
      { value: 'FILM_SONGS',      label: 'Film songs',        sortOrder: 5  },
      { value: 'GHAZALS',         label: 'Ghazals',           sortOrder: 6  },
      { value: 'HEAVY_METAL',     label: 'Heavy metal',       sortOrder: 7  },
      { value: 'HIP_HOP',         label: 'Hip-Hop',           sortOrder: 8  },
      { value: 'HOUSE_MUSIC',     label: 'House music',       sortOrder: 9  },
      { value: 'INDIAN_CLASSICAL',label: 'Indian classical',  sortOrder: 10 },
      { value: 'INDIPOP',         label: 'Indipop',           sortOrder: 11 },
      { value: 'JAZZ',            label: 'Jazz',              sortOrder: 12 },
      { value: 'POP',             label: 'Pop',               sortOrder: 13 },
      { value: 'QAWALIS',         label: 'Qawalis',           sortOrder: 14 },
      { value: 'RAP',             label: 'Rap',               sortOrder: 15 },
      { value: 'REGGAE',          label: 'Reggae',            sortOrder: 16 },
      { value: 'SUFI',            label: 'Sufi',              sortOrder: 17 },
      { value: 'TECHNO',          label: 'Techno',            sortOrder: 18 },
      { value: 'WESTERN_CLASSICAL',label: 'Western classical',sortOrder: 19 },
      { value: 'NOT_A_FAN',       label: "I'm not a music fan", sortOrder: 20 },
    ],
    skipDuplicates: true,
  });

  // ── Sport Options ──────────────────────────────────────────────
  console.log('  → Sport Options');
  await (prisma as any).sportOption.createMany({
    data: [
      { value: 'ADVENTURE_SPORTS',   label: 'Adventure sports',          sortOrder: 1  },
      { value: 'AEROBICS',           label: 'Aerobics',                  sortOrder: 2  },
      { value: 'BADMINTON',          label: 'Badminton',                 sortOrder: 3  },
      { value: 'BASKETBALL',         label: 'Basketball',                sortOrder: 4  },
      { value: 'BILLIARDS',          label: 'Billiards / Snooker / Pool',sortOrder: 5  },
      { value: 'BOWLING',            label: 'Bowling',                   sortOrder: 6  },
      { value: 'CARD_GAMES',         label: 'Card games',                sortOrder: 7  },
      { value: 'CARROM',             label: 'Carrom',                    sortOrder: 8  },
      { value: 'CHESS',              label: 'Chess',                     sortOrder: 9  },
      { value: 'CRICKET',            label: 'Cricket',                   sortOrder: 10 },
      { value: 'CYCLING',            label: 'Cycling',                   sortOrder: 11 },
      { value: 'FOOTBALL',           label: 'Football',                  sortOrder: 12 },
      { value: 'GOLF',               label: 'Golf',                      sortOrder: 13 },
      { value: 'HOCKEY',             label: 'Hockey',                    sortOrder: 14 },
      { value: 'JOGGING_WALKING',    label: 'Jogging / Walking',         sortOrder: 15 },
      { value: 'MARTIAL_ARTS',       label: 'Martial arts',              sortOrder: 16 },
      { value: 'SCRABBLE',           label: 'Scrabble',                  sortOrder: 17 },
      { value: 'SQUASH',             label: 'Squash',                    sortOrder: 18 },
      { value: 'SWIMMING',           label: 'Swimming / Water sports',   sortOrder: 19 },
      { value: 'TABLE_TENNIS',       label: 'Table-tennis',              sortOrder: 20 },
      { value: 'TENNIS',             label: 'Tennis',                    sortOrder: 21 },
      { value: 'VOLLEYBALL',         label: 'Volleyball',                sortOrder: 22 },
      { value: 'WEIGHT_LIFTING',     label: 'Weight lifting',            sortOrder: 23 },
      { value: 'YOGA_MEDITATION',    label: 'Yoga / Meditation',         sortOrder: 24 },
    ],
    skipDuplicates: true,
  });

  // ── Food Options ───────────────────────────────────────────────
  console.log('  → Food Options');
  await (prisma as any).foodOption.createMany({
    data: [
      { value: 'ARABIC',     label: 'Arabic',     sortOrder: 1  },
      { value: 'BENGALI',    label: 'Bengali',    sortOrder: 2  },
      { value: 'CARIBBEAN',  label: 'Caribbean',  sortOrder: 3  },
      { value: 'CHINESE',    label: 'Chinese',    sortOrder: 4  },
      { value: 'CONTINENTAL',label: 'Continental',sortOrder: 5  },
      { value: 'FRENCH',     label: 'French',     sortOrder: 6  },
      { value: 'GREEK',      label: 'Greek',      sortOrder: 7  },
      { value: 'GUJARATI',   label: 'Gujarati',   sortOrder: 8  },
      { value: 'I_AM_FOODIE',label: "I'm a foodie",sortOrder: 9 },
      { value: 'ITALIAN',    label: 'Italian',    sortOrder: 10 },
      { value: 'KONKAN',     label: 'Konkan',     sortOrder: 11 },
      { value: 'LEBANESE',   label: 'Lebanese',   sortOrder: 12 },
      { value: 'MEXICAN',    label: 'Mexican',    sortOrder: 13 },
      { value: 'MOGHLAI',    label: 'Moghlai',    sortOrder: 14 },
      { value: 'NOT_FOODIE', label: 'Not a foodie!',sortOrder:15},
      { value: 'PUNJABI',    label: 'Punjabi',    sortOrder: 16 },
      { value: 'RAJASTHANI', label: 'Rajasthani', sortOrder: 17 },
      { value: 'SOUTH_INDIAN',label: 'South Indian',sortOrder:18},
      { value: 'SPANISH',    label: 'Spanish',    sortOrder: 19 },
      { value: 'SRILANKAN',  label: 'Srilankan',  sortOrder: 20 },
      { value: 'SUSHI',      label: 'Sushi',      sortOrder: 21 },
      { value: 'THAI',       label: 'Thai',       sortOrder: 22 },
      { value: 'TURKISH',    label: 'Turkish',    sortOrder: 23 },
      { value: 'VIETNAMESE', label: 'Vietnamese', sortOrder: 24 },
    ],
    skipDuplicates: true,
  });

  // ── Subscription Plans ────────────────────────────────────────
  console.log('  → Subscription Plans & Features');

  const freePlan = await (prisma as any).subscriptionPlan.upsert({
    where: { value: 'FREE' },
    create: { value: 'FREE', label: 'Free', description: 'Basic access to browse and connect', badge: null, color: '#9A8A7A', sortOrder: 1, isActive: true },
    update: { label: 'Free', sortOrder: 1 },
  });
  const goldPlan = await (prisma as any).subscriptionPlan.upsert({
    where: { value: 'GOLD' },
    create: { value: 'GOLD', label: 'Gold', description: 'Enhanced features to find your match faster', badge: 'Popular', color: '#F4A435', sortOrder: 2, isActive: true },
    update: { label: 'Gold', badge: 'Popular', sortOrder: 2 },
  });
  const diamondPlan = await (prisma as any).subscriptionPlan.upsert({
    where: { value: 'DIAMOND' },
    create: { value: 'DIAMOND', label: 'Diamond', description: 'Premium features with priority matching', badge: 'Best Value', color: '#7B8FE8', sortOrder: 3, isActive: true },
    update: { label: 'Diamond', badge: 'Best Value', sortOrder: 3 },
  });
  const platinumPlan = await (prisma as any).subscriptionPlan.upsert({
    where: { value: 'PLATINUM' },
    create: { value: 'PLATINUM', label: 'Platinum', description: 'All-inclusive VIP matrimony experience', badge: 'VIP', color: '#E8735A', sortOrder: 4, isActive: true },
    update: { label: 'Platinum', badge: 'VIP', sortOrder: 4 },
  });

  // Prices for paid plans (3/6/12 months)
  // TEST PRICES — all £1 GBP for Stripe testing
  const prices = [
    // GOLD
    { planId: goldPlan.id, durationMonths: 3,  priceAmount: 1, originalPrice: 1, discountPercent: 0 },
    { planId: goldPlan.id, durationMonths: 6,  priceAmount: 1, originalPrice: 1, discountPercent: 0 },
    { planId: goldPlan.id, durationMonths: 12, priceAmount: 1, originalPrice: 1, discountPercent: 0 },
    // DIAMOND
    { planId: diamondPlan.id, durationMonths: 3,  priceAmount: 1, originalPrice: 1, discountPercent: 0 },
    { planId: diamondPlan.id, durationMonths: 6,  priceAmount: 1, originalPrice: 1, discountPercent: 0 },
    { planId: diamondPlan.id, durationMonths: 12, priceAmount: 1, originalPrice: 1, discountPercent: 0 },
    // PLATINUM
    { planId: platinumPlan.id, durationMonths: 3,  priceAmount: 1, originalPrice: 1, discountPercent: 0 },
    { planId: platinumPlan.id, durationMonths: 6,  priceAmount: 1, originalPrice: 1, discountPercent: 0 },
    { planId: platinumPlan.id, durationMonths: 12, priceAmount: 1, originalPrice: 1, discountPercent: 0 },
  ];
  for (const p of prices) {
    await (prisma as any).subscriptionPlanPrice.upsert({
      where: { planId_durationMonths: { planId: p.planId, durationMonths: p.durationMonths } },
      create: p,
      update: { priceAmount: p.priceAmount, originalPrice: p.originalPrice, discountPercent: p.discountPercent },
    });
  }

  // ── Individual Features ──────────────────────────────────────
  const individualFeatures = [
    { key: 'browse_profiles',        title: 'Browse Profiles',              description: 'View profiles of potential matches',          icon: '👤', sortOrder: 1 },
    { key: 'send_interests',         title: 'Send Interests',               description: 'Express interest in a profile',               icon: '💌', sortOrder: 2 },
    { key: 'photo_visibility',       title: 'Photo Visibility',             description: 'View profile photos',                         icon: '📷', sortOrder: 3 },
    { key: 'contact_details',        title: 'Contact Details',              description: 'View phone & email of matches',               icon: '📞', sortOrder: 4 },
    { key: 'advanced_search',        title: 'Advanced Search Filters',      description: 'Filter by height, education, lifestyle etc.', icon: '🔍', sortOrder: 5 },
    { key: 'daily_matches',          title: 'Daily Match Suggestions',      description: 'AI-powered daily match recommendations',      icon: '✨', sortOrder: 6 },
    { key: 'profile_highlight',      title: 'Profile Highlight',            description: 'Stand out in search results',                 icon: '⭐', sortOrder: 7 },
    { key: 'who_viewed_me',          title: 'Who Viewed My Profile',        description: 'See who has visited your profile',            icon: '👁', sortOrder: 8 },
    { key: 'message_limit',          title: 'Messaging',                    description: 'Send messages to matches',                    icon: '💬', sortOrder: 9 },
    { key: 'verified_badge',         title: 'Verified Badge',               description: 'Get a verified profile badge',                icon: '✅', sortOrder: 10 },
    { key: 'priority_support',       title: 'Priority Support',             description: '24/7 dedicated customer support',             icon: '🎧', sortOrder: 11 },
    { key: 'profile_boost',          title: 'Profile Boost',                description: 'Boost your profile to top of search',        icon: '🚀', sortOrder: 12 },
    { key: 'photo_upload_limit',     title: 'Photo Uploads',                description: 'Number of photos you can upload',            icon: '🖼️', sortOrder: 13 },
    { key: 'hide_profile',           title: 'Hide Profile',                 description: 'Control who can see your profile',           icon: '🔒', sortOrder: 14 },
    { key: 'astro_match',            title: 'Astrology Compatibility',      description: 'Horoscope-based match compatibility',        icon: '🌟', sortOrder: 15 },
  ];

  const featureMap: Record<string, any> = {};
  for (const f of individualFeatures) {
    const feat = await (prisma as any).subscriptionFeature.upsert({
      where: { key: f.key },
      create: { ...f, audience: 'INDIVIDUAL', isActive: true },
      update: { title: f.title, description: f.description },
    });
    featureMap[f.key] = feat;
  }

  // ── Matchmaker Features ──────────────────────────────────────
  const matchmakerFeatures = [
    { key: 'mm_profile_limit',       title: 'Manage Profiles',             description: 'Number of profiles you can manage',          icon: '👥', sortOrder: 1 },
    { key: 'mm_advanced_search',     title: 'Advanced Search',             description: 'Advanced filters for client matching',       icon: '🔍', sortOrder: 2 },
    { key: 'mm_contact_details',     title: 'View Contact Details',        description: 'Access contact info of matched profiles',    icon: '📞', sortOrder: 3 },
    { key: 'mm_daily_suggestions',   title: 'Daily Match Suggestions',     description: 'AI suggestions for your client profiles',    icon: '✨', sortOrder: 4 },
    { key: 'mm_profile_highlight',   title: 'Profile Highlights',          description: 'Highlight your managed profiles in search',  icon: '⭐', sortOrder: 5 },
    { key: 'mm_analytics',           title: 'Analytics Dashboard',         description: 'Track client match success rates',           icon: '📊', sortOrder: 6 },
    { key: 'mm_bulk_messaging',      title: 'Bulk Messaging',              description: 'Message multiple prospects at once',         icon: '💬', sortOrder: 7 },
    { key: 'mm_priority_listing',    title: 'Priority Listing',            description: 'Appear first in matchmaker directory',      icon: '🚀', sortOrder: 8 },
    { key: 'mm_verified_badge',      title: 'Verified Matchmaker Badge',   description: 'Build trust with verification badge',       icon: '✅', sortOrder: 9 },
    { key: 'mm_priority_support',    title: 'Priority Support',            description: '24/7 dedicated support for matchmakers',     icon: '🎧', sortOrder: 10 },
  ];

  for (const f of matchmakerFeatures) {
    const feat = await (prisma as any).subscriptionFeature.upsert({
      where: { key: f.key },
      create: { ...f, audience: 'MATCHMAKER', isActive: true },
      update: { title: f.title, description: f.description },
    });
    featureMap[f.key] = feat;
  }

  // ── Plan → Feature Assignments (INDIVIDUAL) ──────────────────
  const individualAssignments: Array<{ planId: number; key: string; included: boolean; quantity: string | null; note: string | null; sortOrder: number }> = [
    // FREE
    { planId: freePlan.id,    key: 'browse_profiles',    included: true,  quantity: 'Limited (10/day)', note: null, sortOrder: 1 },
    { planId: freePlan.id,    key: 'send_interests',     included: true,  quantity: '5/month',         note: null, sortOrder: 2 },
    { planId: freePlan.id,    key: 'photo_visibility',   included: false, quantity: null,              note: 'Blurred',sortOrder: 3 },
    { planId: freePlan.id,    key: 'contact_details',    included: false, quantity: null,              note: null, sortOrder: 4 },
    { planId: freePlan.id,    key: 'advanced_search',    included: false, quantity: null,              note: null, sortOrder: 5 },
    { planId: freePlan.id,    key: 'daily_matches',      included: true,  quantity: '3/day',           note: null, sortOrder: 6 },
    { planId: freePlan.id,    key: 'profile_highlight',  included: false, quantity: null,              note: null, sortOrder: 7 },
    { planId: freePlan.id,    key: 'who_viewed_me',      included: false, quantity: null,              note: null, sortOrder: 8 },
    { planId: freePlan.id,    key: 'message_limit',      included: false, quantity: null,              note: null, sortOrder: 9 },
    { planId: freePlan.id,    key: 'verified_badge',     included: false, quantity: null,              note: null, sortOrder: 10 },
    { planId: freePlan.id,    key: 'priority_support',   included: false, quantity: null,              note: null, sortOrder: 11 },
    { planId: freePlan.id,    key: 'profile_boost',      included: false, quantity: null,              note: null, sortOrder: 12 },
    { planId: freePlan.id,    key: 'photo_upload_limit', included: true,  quantity: '3 photos',        note: null, sortOrder: 13 },
    { planId: freePlan.id,    key: 'hide_profile',       included: false, quantity: null,              note: null, sortOrder: 14 },
    { planId: freePlan.id,    key: 'astro_match',        included: false, quantity: null,              note: null, sortOrder: 15 },
    // GOLD
    { planId: goldPlan.id,    key: 'browse_profiles',    included: true,  quantity: 'Unlimited',       note: null, sortOrder: 1 },
    { planId: goldPlan.id,    key: 'send_interests',     included: true,  quantity: '30/month',        note: null, sortOrder: 2 },
    { planId: goldPlan.id,    key: 'photo_visibility',   included: true,  quantity: null,              note: null, sortOrder: 3 },
    { planId: goldPlan.id,    key: 'contact_details',    included: true,  quantity: '10/month',        note: null, sortOrder: 4 },
    { planId: goldPlan.id,    key: 'advanced_search',    included: true,  quantity: null,              note: null, sortOrder: 5 },
    { planId: goldPlan.id,    key: 'daily_matches',      included: true,  quantity: '10/day',          note: null, sortOrder: 6 },
    { planId: goldPlan.id,    key: 'profile_highlight',  included: false, quantity: null,              note: null, sortOrder: 7 },
    { planId: goldPlan.id,    key: 'who_viewed_me',      included: true,  quantity: null,              note: null, sortOrder: 8 },
    { planId: goldPlan.id,    key: 'message_limit',      included: true,  quantity: '50/month',        note: null, sortOrder: 9 },
    { planId: goldPlan.id,    key: 'verified_badge',     included: false, quantity: null,              note: null, sortOrder: 10 },
    { planId: goldPlan.id,    key: 'priority_support',   included: false, quantity: null,              note: null, sortOrder: 11 },
    { planId: goldPlan.id,    key: 'profile_boost',      included: false, quantity: null,              note: null, sortOrder: 12 },
    { planId: goldPlan.id,    key: 'photo_upload_limit', included: true,  quantity: '10 photos',       note: null, sortOrder: 13 },
    { planId: goldPlan.id,    key: 'hide_profile',       included: true,  quantity: null,              note: null, sortOrder: 14 },
    { planId: goldPlan.id,    key: 'astro_match',        included: false, quantity: null,              note: null, sortOrder: 15 },
    // DIAMOND
    { planId: diamondPlan.id, key: 'browse_profiles',    included: true,  quantity: 'Unlimited',       note: null, sortOrder: 1 },
    { planId: diamondPlan.id, key: 'send_interests',     included: true,  quantity: 'Unlimited',       note: null, sortOrder: 2 },
    { planId: diamondPlan.id, key: 'photo_visibility',   included: true,  quantity: null,              note: null, sortOrder: 3 },
    { planId: diamondPlan.id, key: 'contact_details',    included: true,  quantity: '30/month',        note: null, sortOrder: 4 },
    { planId: diamondPlan.id, key: 'advanced_search',    included: true,  quantity: null,              note: null, sortOrder: 5 },
    { planId: diamondPlan.id, key: 'daily_matches',      included: true,  quantity: 'Unlimited',       note: null, sortOrder: 6 },
    { planId: diamondPlan.id, key: 'profile_highlight',  included: true,  quantity: null,              note: null, sortOrder: 7 },
    { planId: diamondPlan.id, key: 'who_viewed_me',      included: true,  quantity: null,              note: null, sortOrder: 8 },
    { planId: diamondPlan.id, key: 'message_limit',      included: true,  quantity: 'Unlimited',       note: null, sortOrder: 9 },
    { planId: diamondPlan.id, key: 'verified_badge',     included: true,  quantity: null,              note: null, sortOrder: 10 },
    { planId: diamondPlan.id, key: 'priority_support',   included: true,  quantity: null,              note: null, sortOrder: 11 },
    { planId: diamondPlan.id, key: 'profile_boost',      included: true,  quantity: '2/month',         note: null, sortOrder: 12 },
    { planId: diamondPlan.id, key: 'photo_upload_limit', included: true,  quantity: '20 photos',       note: null, sortOrder: 13 },
    { planId: diamondPlan.id, key: 'hide_profile',       included: true,  quantity: null,              note: null, sortOrder: 14 },
    { planId: diamondPlan.id, key: 'astro_match',        included: true,  quantity: null,              note: null, sortOrder: 15 },
    // PLATINUM
    { planId: platinumPlan.id,key: 'browse_profiles',    included: true,  quantity: 'Unlimited',       note: null, sortOrder: 1 },
    { planId: platinumPlan.id,key: 'send_interests',     included: true,  quantity: 'Unlimited',       note: null, sortOrder: 2 },
    { planId: platinumPlan.id,key: 'photo_visibility',   included: true,  quantity: null,              note: null, sortOrder: 3 },
    { planId: platinumPlan.id,key: 'contact_details',    included: true,  quantity: 'Unlimited',       note: null, sortOrder: 4 },
    { planId: platinumPlan.id,key: 'advanced_search',    included: true,  quantity: null,              note: null, sortOrder: 5 },
    { planId: platinumPlan.id,key: 'daily_matches',      included: true,  quantity: 'Unlimited',       note: null, sortOrder: 6 },
    { planId: platinumPlan.id,key: 'profile_highlight',  included: true,  quantity: null,              note: null, sortOrder: 7 },
    { planId: platinumPlan.id,key: 'who_viewed_me',      included: true,  quantity: null,              note: null, sortOrder: 8 },
    { planId: platinumPlan.id,key: 'message_limit',      included: true,  quantity: 'Unlimited',       note: null, sortOrder: 9 },
    { planId: platinumPlan.id,key: 'verified_badge',     included: true,  quantity: null,              note: null, sortOrder: 10 },
    { planId: platinumPlan.id,key: 'priority_support',   included: true,  quantity: '24/7 Dedicated',  note: null, sortOrder: 11 },
    { planId: platinumPlan.id,key: 'profile_boost',      included: true,  quantity: '5/month',         note: null, sortOrder: 12 },
    { planId: platinumPlan.id,key: 'photo_upload_limit', included: true,  quantity: 'Unlimited',       note: null, sortOrder: 13 },
    { planId: platinumPlan.id,key: 'hide_profile',       included: true,  quantity: null,              note: null, sortOrder: 14 },
    { planId: platinumPlan.id,key: 'astro_match',        included: true,  quantity: null,              note: null, sortOrder: 15 },
  ];

  for (const a of individualAssignments) {
    const feat = featureMap[a.key];
    if (!feat) continue;
    await (prisma as any).planFeatureAssignment.upsert({
      where: { planId_featureId: { planId: a.planId, featureId: feat.id } },
      create: { planId: a.planId, featureId: feat.id, included: a.included, quantity: a.quantity, note: a.note, sortOrder: a.sortOrder },
      update: { included: a.included, quantity: a.quantity, note: a.note },
    });
  }

  // ── Plan → Feature Assignments (MATCHMAKER) ──────────────────
  const matchmakerAssignments: Array<{ planId: number; key: string; included: boolean; quantity: string | null; sortOrder: number }> = [
    { planId: freePlan.id,    key: 'mm_profile_limit',     included: true,  quantity: '5 profiles',   sortOrder: 1 },
    { planId: freePlan.id,    key: 'mm_advanced_search',   included: false, quantity: null,           sortOrder: 2 },
    { planId: freePlan.id,    key: 'mm_contact_details',   included: false, quantity: null,           sortOrder: 3 },
    { planId: freePlan.id,    key: 'mm_daily_suggestions', included: true,  quantity: '3/day',        sortOrder: 4 },
    { planId: freePlan.id,    key: 'mm_profile_highlight', included: false, quantity: null,           sortOrder: 5 },
    { planId: freePlan.id,    key: 'mm_analytics',         included: false, quantity: null,           sortOrder: 6 },
    { planId: freePlan.id,    key: 'mm_bulk_messaging',    included: false, quantity: null,           sortOrder: 7 },
    { planId: freePlan.id,    key: 'mm_priority_listing',  included: false, quantity: null,           sortOrder: 8 },
    { planId: freePlan.id,    key: 'mm_verified_badge',    included: false, quantity: null,           sortOrder: 9 },
    { planId: freePlan.id,    key: 'mm_priority_support',  included: false, quantity: null,           sortOrder: 10 },

    { planId: goldPlan.id,    key: 'mm_profile_limit',     included: true,  quantity: '25 profiles',  sortOrder: 1 },
    { planId: goldPlan.id,    key: 'mm_advanced_search',   included: true,  quantity: null,           sortOrder: 2 },
    { planId: goldPlan.id,    key: 'mm_contact_details',   included: true,  quantity: '20/month',     sortOrder: 3 },
    { planId: goldPlan.id,    key: 'mm_daily_suggestions', included: true,  quantity: '10/day',       sortOrder: 4 },
    { planId: goldPlan.id,    key: 'mm_profile_highlight', included: false, quantity: null,           sortOrder: 5 },
    { planId: goldPlan.id,    key: 'mm_analytics',         included: true,  quantity: 'Basic',        sortOrder: 6 },
    { planId: goldPlan.id,    key: 'mm_bulk_messaging',    included: false, quantity: null,           sortOrder: 7 },
    { planId: goldPlan.id,    key: 'mm_priority_listing',  included: false, quantity: null,           sortOrder: 8 },
    { planId: goldPlan.id,    key: 'mm_verified_badge',    included: false, quantity: null,           sortOrder: 9 },
    { planId: goldPlan.id,    key: 'mm_priority_support',  included: false, quantity: null,           sortOrder: 10 },

    { planId: diamondPlan.id, key: 'mm_profile_limit',     included: true,  quantity: '100 profiles', sortOrder: 1 },
    { planId: diamondPlan.id, key: 'mm_advanced_search',   included: true,  quantity: null,           sortOrder: 2 },
    { planId: diamondPlan.id, key: 'mm_contact_details',   included: true,  quantity: 'Unlimited',    sortOrder: 3 },
    { planId: diamondPlan.id, key: 'mm_daily_suggestions', included: true,  quantity: 'Unlimited',    sortOrder: 4 },
    { planId: diamondPlan.id, key: 'mm_profile_highlight', included: true,  quantity: null,           sortOrder: 5 },
    { planId: diamondPlan.id, key: 'mm_analytics',         included: true,  quantity: 'Full',         sortOrder: 6 },
    { planId: diamondPlan.id, key: 'mm_bulk_messaging',    included: true,  quantity: null,           sortOrder: 7 },
    { planId: diamondPlan.id, key: 'mm_priority_listing',  included: true,  quantity: null,           sortOrder: 8 },
    { planId: diamondPlan.id, key: 'mm_verified_badge',    included: true,  quantity: null,           sortOrder: 9 },
    { planId: diamondPlan.id, key: 'mm_priority_support',  included: true,  quantity: null,           sortOrder: 10 },

    { planId: platinumPlan.id,key: 'mm_profile_limit',     included: true,  quantity: 'Unlimited',    sortOrder: 1 },
    { planId: platinumPlan.id,key: 'mm_advanced_search',   included: true,  quantity: null,           sortOrder: 2 },
    { planId: platinumPlan.id,key: 'mm_contact_details',   included: true,  quantity: 'Unlimited',    sortOrder: 3 },
    { planId: platinumPlan.id,key: 'mm_daily_suggestions', included: true,  quantity: 'Unlimited',    sortOrder: 4 },
    { planId: platinumPlan.id,key: 'mm_profile_highlight', included: true,  quantity: null,           sortOrder: 5 },
    { planId: platinumPlan.id,key: 'mm_analytics',         included: true,  quantity: 'Full + Export',sortOrder: 6 },
    { planId: platinumPlan.id,key: 'mm_bulk_messaging',    included: true,  quantity: null,           sortOrder: 7 },
    { planId: platinumPlan.id,key: 'mm_priority_listing',  included: true,  quantity: null,           sortOrder: 8 },
    { planId: platinumPlan.id,key: 'mm_verified_badge',    included: true,  quantity: null,           sortOrder: 9 },
    { planId: platinumPlan.id,key: 'mm_priority_support',  included: true,  quantity: '24/7 Dedicated',sortOrder: 10 },
  ];

  for (const a of matchmakerAssignments) {
    const feat = featureMap[a.key];
    if (!feat) continue;
    await (prisma as any).planFeatureAssignment.upsert({
      where: { planId_featureId: { planId: a.planId, featureId: feat.id } },
      create: { planId: a.planId, featureId: feat.id, included: a.included, quantity: a.quantity, note: null, sortOrder: a.sortOrder },
      update: { included: a.included, quantity: a.quantity },
    });
  }

  console.log('✅ Seeding complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
