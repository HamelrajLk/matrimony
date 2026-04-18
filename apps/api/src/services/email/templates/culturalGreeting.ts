import { baseTemplate } from '../baseTemplate';

type Festival = 'sinhala_new_year' | 'deepavali' | 'eid' | 'christmas' | 'vesak' | 'new_year';

const FESTIVALS: Record<Festival, { subject: string; headline: string; message: string; icon: string }> = {
  sinhala_new_year: {
    subject: '🌸 සුභ අලුත් අවුරුද්දක් වේවා! Happy Sinhala & Tamil New Year!',
    headline: 'Happy Sinhala & Tamil New Year! 🌸',
    icon: '🌸',
    message: `May this auspicious New Year bring you joy, prosperity, and your perfect life partner.<br/><br/>
              <em>සුභ අලුත් අවුරුද්දක් වේවා! புத்தாண்டு வாழ்த்துக்கள்!</em>`,
  },
  deepavali: {
    subject: '✨ Happy Deepavali from The Wedding Partners!',
    headline: 'Happy Deepavali! ✨',
    icon: '🪔',
    message: `May the Festival of Lights illuminate your path to love and happiness.<br/><br/>
              May this Deepavali bring you closer to finding your perfect life partner.<br/><br/>
              <em>தீபாவளி வாழ்த்துக்கள்!</em>`,
  },
  eid: {
    subject: '🌙 Eid Mubarak from The Wedding Partners!',
    headline: 'Eid Mubarak! 🌙',
    icon: '🌙',
    message: `Wishing you and your family a blessed and joyful Eid.<br/><br/>
              May Allah grant you happiness and your perfect life partner in His own perfect time.<br/><br/>
              <em>عيد مبارك · Eid Mubarak!</em>`,
  },
  christmas: {
    subject: '🎄 Merry Christmas from The Wedding Partners!',
    headline: 'Merry Christmas! 🎄',
    icon: '🎄',
    message: `Wishing you a season filled with love, laughter, and family joy.<br/><br/>
              May this Christmas bring you closer to finding your special someone. 💕`,
  },
  vesak: {
    subject: '🙏 Happy Vesak Poya from The Wedding Partners!',
    headline: 'Happy Vesak! 🙏',
    icon: '🪷',
    message: `On this sacred day of Vesak, we wish you peace, compassion, and loving-kindness.<br/><br/>
              May the blessings of the Triple Gem guide you on your journey to finding your life partner.<br/><br/>
              <em>සුභ වෙසක් මංගල්‍යයක් වේවා!</em>`,
  },
  new_year: {
    subject: '🎊 Happy New Year from The Wedding Partners!',
    headline: 'Happy New Year! 🎊',
    icon: '🎊',
    message: `May the new year bring you love, happiness, and your perfect life partner.<br/><br/>
              Thank you for being part of The Wedding Partners family. Here's to new beginnings! 🥂`,
  },
};

export function culturalGreeting({ recipientName, festival, dashboardUrl }: {
  recipientName: string; festival: Festival; dashboardUrl: string;
}): { subject: string; html: string } {
  const f = FESTIVALS[festival] || FESTIVALS.new_year;
  const body = `
    <p>Dear ${recipientName},</p>
    <div style="text-align:center;font-size:48px;margin:20px 0;">${f.icon}</div>
    <p style="text-align:center;font-size:15px;color:#2A1A1A;line-height:1.75;">
      ${f.message}
    </p>
    <p style="text-align:center;margin-top:20px;font-size:13px;color:#9A8A7A;">
      With warm wishes,<br/>
      The Wedding Partners Family 🌸
    </p>
  `;
  return {
    subject: f.subject,
    html: baseTemplate({
      preheader: `${f.headline} — Warm wishes from The Wedding Partners.`,
      headline: f.headline,
      body,
      ctaText: 'Find Your Match →',
      ctaUrl: dashboardUrl,
    }),
  };
}
