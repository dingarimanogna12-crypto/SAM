import { FullAnalysisResult } from '../types';
import { SupportedLanguage } from '../i18n/languages';

export interface PatientFriendlySummary {
  verdictBadge: {
    status: 'safe' | 'caution' | 'urgent';
    label: string;
    sublabel: string;
  };
  headline: string;
  simpleExplanation: string;
  medicationGuidance: Array<{
    drugName: string;
    whatItIs: string;
    howToTake: string;
    duration: string;
    categoryTag: string;
    timingTip?: string;
  }>;
  safetyAdvice: string[];
  actionSteps: string[];
  whyFinishCourseText: string;
  questionsForDoctor: string[];
  fullAudioScript: string;
}

/**
 * Translates clinical pharmacokinetic & regulatory analysis results
 * into plain-language, patient-centric guidance across rural & regional languages.
 */
export function generatePatientFriendlySummary(
  result: FullAnalysisResult,
  lang: SupportedLanguage = 'en'
): PatientFriendlySummary {
  const { overallStatus, prescription, stage1, stage2, stage3, stage4 } = result;
  const isVet = prescription.patient.type === 'veterinary';
  const species = prescription.patient.species || (isVet ? 'Animal' : 'Patient');
  const duration = prescription.medications[0]?.durationDays || 5;

  // Localized Verdict Badges
  const verdictMap: Record<
    SupportedLanguage,
    Record<'CRITICAL' | 'WARNING' | 'INFO' | 'COMPLIANT', { label: string; sublabel: string; status: 'safe' | 'caution' | 'urgent' }>
  > = {
    en: {
      CRITICAL: { label: 'HOLD & CONTACT PRESCRIBER', sublabel: 'Important safety concern detected before starting', status: 'urgent' },
      WARNING: { label: 'USE WITH CAUTION', sublabel: 'Clarification recommended with doctor or pharmacist', status: 'caution' },
      INFO: { label: 'ROUTINE MONITORING', sublabel: 'Generally safe, follow standard administration schedule', status: 'caution' },
      COMPLIANT: { label: '100% VERIFIED & SAFE', sublabel: 'Dosage, indication, and safety checks are completely optimal', status: 'safe' },
    },
    hi: {
      CRITICAL: { label: 'रुकें व डॉक्टर से संपर्क करें', sublabel: 'दवा शुरू करने से पहले महत्वपूर्ण सुरक्षा जोखिम पाया गया', status: 'urgent' },
      WARNING: { label: 'सावधानीपूर्वक सेवन करें', sublabel: 'खुराक या समय के बारे में डॉक्टर/फार्मासिस्ट से पुष्टि करें', status: 'caution' },
      INFO: { label: 'नियमित निगरानी आवश्यक', sublabel: 'दवा सामान्य रूप से सुरक्षित है, निर्धारित समय पर लें', status: 'caution' },
      COMPLIANT: { label: '100% सुरक्षित एवं प्रमाणित', sublabel: 'खुराक, बीमारी और सुरक्षा जांच पूरी तरह सही पाई गई', status: 'safe' },
    },
    te: {
      CRITICAL: { label: 'ఆపండి & వైద్యుడిని సంప్రదించండి', sublabel: 'మందులు ప్రారంభించే ముందు ముఖ్యమైన భద్రతా సమస్య గుర్తించబడింది', status: 'urgent' },
      WARNING: { label: 'జాగ్రత్తగా ఉపయోగించండి', sublabel: 'మోతాదు గురించి వైద్యుడు లేదా ఫార్మసిస్ట్‌తో స్పష్టత పొందండి', status: 'caution' },
      INFO: { label: 'సాధారణ పర్యవేక్షణ', sublabel: 'సాధారణంగా సురక్షితం, సూచించిన సమయాల్లో తీసుకోండి', status: 'caution' },
      COMPLIANT: { label: '100% ధృవీకరించబడింది & సురక్షితం', sublabel: 'మోతాదు మరియు భద్రతా తనిఖీలు పూర్తిగా సరైనవిగా ఉన్నాయి', status: 'safe' },
    },
    ta: {
      CRITICAL: { label: 'மருந்தை நிறுத்தி மருத்துவரை அணுகவும்', sublabel: 'தொடங்குவதற்கு முன் முக்கிய பாதுகாப்பு எச்சரிக்கை கண்டறியப்பட்டது', status: 'urgent' },
      WARNING: { label: 'எச்சரிக்கையுடன் உட்கொள்ளவும்', sublabel: 'மருத்துவர் அல்லது மருந்தாளுநரிடம் அளவு குறித்து தெளிவுபடுத்தவும்', status: 'caution' },
      INFO: { label: 'வழக்கமான கண்காணிப்பு', sublabel: 'பொதுவாக பாதுகாப்பானது, குறித்த நேரத்தில் உட்கொள்ளவும்', status: 'caution' },
      COMPLIANT: { label: '100% சரிபார்க்கப்பட்டது & பாதுகாப்பானது', sublabel: 'மருந்தின் அளவு மற்றும் பாதுகாப்பு முற்றிலும் சரியாக உள்ளது', status: 'safe' },
    },
    bn: {
      CRITICAL: { label: 'অপেক্ষা করুন ও ডাক্তার দেখান', sublabel: 'ঔষধ শুরুর আগে গুরুত্বপূর্ণ সুরক্ষা ঝুঁকি শনাক্ত হয়েছে', status: 'urgent' },
      WARNING: { label: 'সতর্কতার সাথে সেবন করুন', sublabel: 'সঠিক মাত্রা সম্পর্কে চিকিৎসক বা ফার্মাসিস্টের সাথে কথা বলুন', status: 'caution' },
      INFO: { label: 'নিয়মিত পর্যবেক্ষণ', sublabel: 'সাধারণত নিরাপদ, নিয়মিত সময় মেনে চলুন', status: 'caution' },
      COMPLIANT: { label: '১০০% পরীক্ষিত ও সম্পূর্ণ নিরাপদ', sublabel: 'ঔষধের মাত্রা ও নিরাপত্তা সম্পূর্ণ সঠিক পাওয়া গেছে', status: 'safe' },
    },
    es: {
      CRITICAL: { label: 'PAUSAR Y CONTACTAR AL MÉDICO', sublabel: 'Se detectó una alerta de seguridad importante antes de iniciar', status: 'urgent' },
      WARNING: { label: 'USAR CON PRECAUCIÓN', sublabel: 'Se recomienda aclarar la dosis con su médico o farmacéutico', status: 'caution' },
      INFO: { label: 'MONITOREO DE RUTINA', sublabel: 'Generalmente seguro, siga el horario habitual', status: 'caution' },
      COMPLIANT: { label: '100% VERIFICADO Y SEGURO', sublabel: 'Las dosis, indicación y seguridad son completamente óptimas', status: 'safe' },
    },
  };

  const verdictBadge = verdictMap[lang]?.[overallStatus] || verdictMap.en[overallStatus];

  // Localized Headlines
  let headline = '';
  if (lang === 'hi') {
    if (overallStatus === 'COMPLIANT') {
      headline = `यह पर्चा ${isVet ? species : 'आपके'} स्वास्थ्य के लिए सुरक्षित और पूरी तरह उपयुक्त है।`;
    } else if (overallStatus === 'CRITICAL') {
      headline = `महत्वपूर्ण ध्यान दें: कृपया दवा शुरू करने से पहले डॉक्टर से परामर्श लें।`;
    } else {
      headline = `सावधानी निर्देश: सुरक्षित रहने के लिए खुराक और समय का विशेष ध्यान रखें।`;
    }
  } else if (lang === 'te') {
    if (overallStatus === 'COMPLIANT') {
      headline = `ఈ ప్రిస్క్రిప్షన్ ${isVet ? species : 'మీ'} ఆరోగ్యానికి సురక్షితమైనది మరియు సరిగ్గా సరిపోతుంది.`;
    } else if (overallStatus === 'CRITICAL') {
      headline = `ముఖ్యమైన హెచ్చరిక: దయచేసి మందులు తీసుకునే ముందు వైద్యుడిని సంప్రదించండి.`;
    } else {
      headline = `జాగ్రత్త సూచనలు: సురక్షితంగా ఉండటానికి మోతాదు మరియు సమయాన్ని ఖచ్చితంగా పాటించండి.`;
    }
  } else if (lang === 'ta') {
    if (overallStatus === 'COMPLIANT') {
      headline = `இந்த மருந்துச்சீட்டு ${isVet ? species : 'உங்கள்'} நலனுக்கு பாதுகாப்பானது மற்றும் பொருத்தமானது.`;
    } else if (overallStatus === 'CRITICAL') {
      headline = `முக்கிய எச்சரிக்கை: மருந்தை உட்கொள்வதற்கு முன் மருத்துவரை அணுகவும்.`;
    } else {
      headline = `முன்னெச்சரிக்கை குறிப்புகள்: பாதுகாப்பாக இருக்க சரியான நேரத்தை பின்பற்றவும்.`;
    }
  } else if (lang === 'bn') {
    if (overallStatus === 'COMPLIANT') {
      headline = `এই প্রেসক্রিপশনটি ${isVet ? species : 'আপনার'} স্বাস্থ্যের জন্য সম্পূর্ণ নিরাপদ ও উপযুক্ত।`;
    } else if (overallStatus === 'CRITICAL') {
      headline = `জরুরি সতর্কতা: ঔষধ শুরু করার পূর্বে চিকিৎসকের পরামর্শ গ্রহণ করুন।`;
    } else {
      headline = `সতর্কতা নির্দেশিকা: সুরক্ষার জন্য সঠিক নিয়ম মেনে চলুন।`;
    }
  } else if (lang === 'es') {
    if (overallStatus === 'COMPLIANT') {
      headline = `Esta prescripción es segura y adecuada para ${isVet ? species : 'usted'}.`;
    } else if (overallStatus === 'CRITICAL') {
      headline = `Atención requerida: Por favor pause y consulte a su médico antes de tomarla.`;
    } else {
      headline = `Instrucciones de precaución: Siga el horario de dosificación cuidadosamente.`;
    }
  } else {
    if (overallStatus === 'COMPLIANT') {
      headline = `This prescription is safe, well-matched, and ready for ${isVet ? species : 'you'}.`;
    } else if (overallStatus === 'CRITICAL') {
      headline = `Action Required: Please pause and check with your healthcare provider.`;
    } else {
      headline = `Review recommended: Important instructions and cautions to keep ${isVet ? species : 'you'} safe.`;
    }
  }

  // Simple Explanation
  let simpleExplanation = '';
  if (lang === 'hi') {
    if (overallStatus === 'COMPLIANT') {
      simpleExplanation = `यह दवा ${prescription.patient.diagnosis} के लिए पहली पसंद का प्रमाणित एंटीबायोटिक उपचार है। खुराक मरीज के वजन (${prescription.patient.weightKg || 'सामान्य'} किग्रा) के अनुकूल है और कोई खतरनाक दवा टकराव नहीं मिला।`;
    } else if (stage3.interactions.length > 0) {
      const clashes = stage3.interactions.map((i) => `${i.drugA} और ${i.drugB}`).join(', ');
      simpleExplanation = `${clashes} के बीच दवा टकराव पाया गया है। इन्हें एक साथ लेने से दुष्प्रभाव हो सकते हैं या दवा का असर घट सकता है।`;
    } else {
      simpleExplanation = `दवा की मात्रा या लेने के समय में समायोजन की आवश्यकता है। कृपया फार्मासिस्ट या डॉक्टर से सही समय सुनिश्चित करें।`;
    }
  } else if (lang === 'te') {
    if (overallStatus === 'COMPLIANT') {
      simpleExplanation = `ఈ మందులు ${prescription.patient.diagnosis} కొరకు ప్రామాణిక మొదటి ఎంపిక చికిత్స. బరువు (${prescription.patient.weightKg || 'సాధారణ'} కేజీలు)కు మోతాదు సరిపోతుంది మరియు మందుల మధ్య ఎలాంటి ప్రమాదకర ప్రభావాలు లేవు.`;
    } else if (stage3.interactions.length > 0) {
      const clashes = stage3.interactions.map((i) => `${i.drugA} మరియు ${i.drugB}`).join(', ');
      simpleExplanation = `${clashes} మందుల మధ్య పరస్పర చర్య గుర్తించబడింది. వీటిని ఒకేసారి తీసుకోవడం వల్ల దుష్ప్రభావాలు రావచ్చు.`;
    } else {
      simpleExplanation = `మందుల మోతాదు లేదా వ్యవధిలో మార్పులు అవసరం కావచ్చు. దయచేసి ఫార్మసిస్ట్ లేదా డాక్టర్‌తో మాట్లాడండి.`;
    }
  } else if (lang === 'ta') {
    if (overallStatus === 'COMPLIANT') {
      simpleExplanation = `${prescription.patient.diagnosis} சிகிச்சைக்கு இந்த நுண்ணுயிர் எதிர்ப்பு மருந்துகள் சிறந்த தேர்வாகும். எடையுடன் மருந்து அளவு பொருந்துகிறது, எந்த ஆபத்தான மோதல்களும் இல்லை.`;
    } else {
      simpleExplanation = `மருந்தின் அளவு அல்லது உட்கொள்ளும் நேரத்தில் கவனம் தேவை. தயவுசெய்து உங்கள் மருத்துவரிடம் சரிபார்க்கவும்.`;
    }
  } else if (lang === 'bn') {
    if (overallStatus === 'COMPLIANT') {
      simpleExplanation = `${prescription.patient.diagnosis} রোগের জন্য এই অ্যান্টিবায়োটিকগুলো সবচেয়ে উপযুক্ত ও আদর্শ চিকিৎসা। কোনো ক্ষতিকর প্রভাব পাওয়া যায়নি।`;
    } else {
      simpleExplanation = `ঔষধের মাত্রা বা সেবনবিধির ক্ষেত্রে সমন্বয় প্রয়োজন হতে পারে। অনুগ্রহ করে ফার্মাসিস্টের পরামর্শ নিন।`;
    }
  } else if (lang === 'es') {
    if (overallStatus === 'COMPLIANT') {
      simpleExplanation = `Los medicamentos recetados son tratamientos estándar de primera línea para ${prescription.patient.diagnosis}. La dosis se ajusta al peso (${prescription.patient.weightKg || 'estándar'} kg) sin interacciones peligrosas.`;
    } else {
      simpleExplanation = `Se recomienda verificar la dosis y los horarios con su farmacéutico o médico para asegurar un tratamiento seguro.`;
    }
  } else {
    if (overallStatus === 'COMPLIANT') {
      simpleExplanation = `The prescribed medicines are standard first-choice treatments for ${prescription.patient.diagnosis}. The dose matches the patient profile (${prescription.patient.weightKg || 'standard'} kg) with no hazardous drug clashes.`;
    } else if (stage3.interactions.length > 0) {
      const clashes = stage3.interactions.map((i) => `${i.drugA} and ${i.drugB}`).join(', ');
      simpleExplanation = `An interaction between ${clashes} was detected. Taking them together without adjusting timing or dose can cause unwanted effects or reduce effectiveness.`;
    } else {
      simpleExplanation = `The recommended daily dose or treatment duration needs attention. Dosage checks suggest discussing the exact strength with your pharmacist.`;
    }
  }

  // Medication Guidance
  const medicationGuidance = prescription.medications.map((med) => {
    const foundAM = stage1.antimicrobialsFound.find(
      (a) => a.drugName.toLowerCase() === med.drugName.toLowerCase()
    );

    let categoryTag = 'Standard Antibiotic';
    if (foundAM) {
      if (foundAM.whoAWaReGroup === 'ACCESS') {
        categoryTag =
          lang === 'hi'
            ? 'WHO Access (प्राथमिक सुरक्षित एंटीबायोटिक)'
            : lang === 'te'
            ? 'WHO Access (మొదటి ఎంపిక సురక్షిత యాంటీబయాటిక్)'
            : lang === 'ta'
            ? 'WHO Access (முதன்மை பாதுகாப்பான மருந்து)'
            : lang === 'bn'
            ? 'WHO Access (প্রথম সারির নিরাপদ ঔষধ)'
            : lang === 'es'
            ? 'WHO Access (Antimicrobiano de Primera Línea)'
            : 'WHO Access (Preferred First-Line Choice)';
      } else if (foundAM.whoAWaReGroup === 'WATCH') {
        categoryTag =
          lang === 'hi'
            ? 'WHO Watch (प्रतिरोधकता का उच्च जोखिम - विशेष निगरानी)'
            : lang === 'te'
            ? 'WHO Watch (నిరోధకత ప్రమాదం - ప్రత్యేక పర్యవేక్షణ)'
            : lang === 'ta'
            ? 'WHO Watch (கண்காணிப்பு தேவைப்படும் மருந்து)'
            : lang === 'bn'
            ? 'WHO Watch (সতর্ক নজরদারির ঔষধ)'
            : lang === 'es'
            ? 'WHO Watch (Mayor Riesgo de Resistencia)'
            : 'WHO Watch (Higher Resistance Risk - Specialist Monitor)';
      } else if (foundAM.whoAWaReGroup === 'RESERVE') {
        categoryTag =
          lang === 'hi'
            ? 'WHO Reserve (अंतिम विकल्प - गंभीर मामलों हेतु)'
            : lang === 'te'
            ? 'WHO Reserve (చివరి ప్రయత్నపు అత్యవసర ఔషధం)'
            : lang === 'ta'
            ? 'WHO Reserve (அவசர கால கடைசி மருந்து)'
            : lang === 'bn'
            ? 'WHO Reserve (সর্বশেষ বিকল্প জীবনরক্ষাকারী)'
            : lang === 'es'
            ? 'WHO Reserve (Último Recurso Clínico)'
            : 'WHO Reserve (Last-Resort Antimicrobial)';
      }
    }

    // Localized Timing Tips
    let timingTip =
      lang === 'hi'
        ? 'इसे हर दिन एक निश्चित समय पर एक गिलास पानी के साथ लें।'
        : lang === 'te'
        ? 'ప్రతిరోజూ ఒకే సమయానికి ఒక గ్లాసు నీటితో తీసుకోండి.'
        : lang === 'ta'
        ? 'தினமும் ஒரே நேரத்தில் ஒரு டம்ளர் தண்ணீருடன் உட்கொள்ளவும்.'
        : lang === 'bn'
        ? 'প্রতিদিন নির্দিষ্ট সময়ে এক গ্লাস জল দিয়ে সেবন করুন।'
        : lang === 'es'
        ? 'Tómelo con un vaso lleno de agua a la misma hora todos los días.'
        : 'Take with a full glass of water at the same time each day.';

    const lowerName = med.drugName.toLowerCase();
    if (lowerName.includes('cipro') || lowerName.includes('levo') || lowerName.includes('doxy')) {
      timingTip =
        lang === 'hi'
          ? 'दूध, दही, कैल्शियम या एंटासिड दवाइयों से कम से कम 2 घंटे का अंतर रखें।'
          : lang === 'te'
          ? 'పాలు, పెరుగు, కాల్షియం లేదా ఎసిడిటీ మందులకు కనీసం 2 గంటల వ్యవధి ఇవ్వండి.'
          : lang === 'ta'
          ? 'பால், தயிர், கால்சியம் மாத்திரைகளிலிருந்து 2 மணி நேரம் இடைவெளி விடவும்.'
          : lang === 'bn'
          ? 'দুধ, দই বা অ্যান্টাসিড গ্রহণের সাথে অন্তত ২ ঘণ্টার ব্যবধান রাখুন।'
          : lang === 'es'
          ? 'Separe de lácteos, calcio, hierro o antiácidos por al menos 2 horas.'
          : 'Separate from milk, yogurt, calcium, iron, or antacids by at least 2 hours.';
    } else if (lowerName.includes('amox') || lowerName.includes('augmentin')) {
      timingTip =
        lang === 'hi'
          ? 'पेट में जलन से बचने के लिए भोजन या नाश्ते की शुरुआत में लें।'
          : lang === 'te'
          ? 'కడుపులో మంటను నివారించడానికి భోజనంతో పాటు తీసుకోండి.'
          : lang === 'ta'
          ? 'வயிற்று உபாதையைத் தவிர்க்க உணவுடன் உட்கொள்ளவும்.'
          : lang === 'bn'
          ? 'পেটে অস্বস্তি এড়াতে খাবারের শুরুতে সেবন করুন।'
          : lang === 'es'
          ? 'Tómelo al inicio de una comida para evitar molestias estomacales.'
          : 'Take at the start of a meal or snack to minimize stomach upset.';
    } else if (lowerName.includes('metro')) {
      timingTip =
        lang === 'hi'
          ? 'इस दवा के दौरान और 48 घंटे बाद तक शराब का सेवन बिल्कुल न करें।'
          : lang === 'te'
          ? 'ఈ మందుల సమయంలో మరియు పూర్తయిన 48 గంటల వరకు మద్యం తాగకూడదు.'
          : lang === 'ta'
          ? 'இந்த மருந்தை உட்கொள்ளும் போது மது அருந்துவதை முற்றிலும் தவிர்க்கவும்.'
          : lang === 'bn'
          ? 'এই ঔষধ চলাকালীন এবং পরবর্তী ৪৮ ঘণ্টা পর্যন্ত অ্যালকোহল সম্পূর্ণ এড়িয়ে চলুন।'
          : lang === 'es'
          ? 'Evite estrictamente el alcohol durante el tratamiento y 48 horas después.'
          : 'Strictly avoid all alcohol during treatment and for 48 hours after.';
    }

    const whatItIsText =
      lang === 'hi'
        ? `${prescription.patient.diagnosis} के उपचार हेतु एंटीबायोटिक`
        : lang === 'te'
        ? `${prescription.patient.diagnosis} చికిత్స కొరకు యాంటీబయాటిక్`
        : lang === 'ta'
        ? `${prescription.patient.diagnosis} சிகிச்சைக்கான நுண்ணுயிர் எதிர்ப்பு மருந்து`
        : lang === 'bn'
        ? `${prescription.patient.diagnosis} চিকিৎসার জন্য নির্ধারিত অ্যান্টিবায়োটিক`
        : lang === 'es'
        ? `Antibiótico recetado para ${prescription.patient.diagnosis}`
        : `Antibiotic prescribed for ${prescription.patient.diagnosis}`;

    const howToTakeText =
      lang === 'hi'
        ? `${med.dosage || 'नियमित खुराक'} (${med.route || 'मुंह से'}), दिन में: ${med.frequency || 'निर्देशानुसार'}`
        : lang === 'te'
        ? `${med.dosage || 'మోతాదు'} (${med.route || 'నోటి ద్వారా'}), రోజుకు: ${med.frequency || 'సూచించినట్లు'}`
        : lang === 'ta'
        ? `${med.dosage || 'அளவு'} (${med.route || 'வாய்வழி'}), தினமும்: ${med.frequency || 'பரிந்துரைத்தபடி'}`
        : lang === 'bn'
        ? `${med.dosage || 'মাত্রা'} (${med.route || 'মুখে'}), দিনে: ${med.frequency || 'নির্দেশমতো'}`
        : lang === 'es'
        ? `${med.dosage || 'Dosis estándar'} por vía ${med.route || 'oral'}, ${med.frequency || 'según indicación'}`
        : `${med.dosage || 'Standard dose'} by ${med.route || 'mouth'}, ${med.frequency || 'as directed'}`;

    return {
      drugName: med.drugName,
      whatItIs: whatItIsText,
      howToTake: howToTakeText,
      duration:
        lang === 'hi'
          ? `${med.durationDays} लगातार दिन`
          : lang === 'te'
          ? `${med.durationDays} నిరంతర రోజులు`
          : lang === 'ta'
          ? `${med.durationDays} தொடர்ச்சியான நாட்கள்`
          : lang === 'bn'
          ? `${med.durationDays} একটানা দিন`
          : lang === 'es'
          ? `${med.durationDays} días continuos`
          : `${med.durationDays} continuous days`,
      categoryTag,
      timingTip,
    };
  });

  // Localized Safety Advice
  const safetyAdvice: string[] = [];
  if (lang === 'hi') {
    if (prescription.patient.renalFunction && prescription.patient.renalFunction !== 'Normal') {
      safetyAdvice.push(`गुर्दे (किडनी) की सूचना: चूंकि आपकी किडनी कार्यक्षमता सामान्य से भिन्न है, डॉक्टर द्वारा खुराक समायोजन की पुष्टि अवश्य करें।`);
    }
    if (prescription.patient.pregnancyOrLactation) {
      safetyAdvice.push(`गर्भावस्था / स्तनपान सतर्कता: सुनिश्चित करें कि स्त्री रोग विशेषज्ञ ने गर्भावस्था में इन सभी दवाओं की सुरक्षा जांची है।`);
    }
    stage3.interactions.forEach((i) => {
      safetyAdvice.push(`दवा टकराव (${i.drugA} + ${i.drugB}): ${i.clinicalEffect}। सलाह: ${i.management}`);
    });
    if (safetyAdvice.length === 0) {
      safetyAdvice.push('दिन भर पर्याप्त मात्रा में स्वच्छ पानी पिएं।');
      safetyAdvice.push('बची हुई एंटीबायोटिक दवाइयां दूसरों को कभी न दें।');
      safetyAdvice.push('त्वचा पर चकत्ते या तेज दस्त होने पर तुरंत स्वास्थ्य केंद्र से संपर्क करें।');
    }
  } else if (lang === 'te') {
    if (prescription.patient.renalFunction && prescription.patient.renalFunction !== 'Normal') {
      safetyAdvice.push(`మూత్రపిండాల హెచ్చరిక: మీ కిడ్నీల పనితీరును బట్టి డాక్టర్ మోతాదును సర్దుబాటు చేశారో లేదో నిర్ధారించుకోండి.`);
    }
    if (prescription.patient.pregnancyOrLactation) {
      safetyAdvice.push(`గర్భవతి / పాలిచ్చే తల్లుల జాగ్రత్త: ఈ మందులు గర్భధారణలో సురక్షితమేనా అని వైద్యుడితో సరిచూడండి.`);
    }
    stage3.interactions.forEach((i) => {
      safetyAdvice.push(`మందుల కలయిక ప్రమాదం (${i.drugA} + ${i.drugB}): ${i.clinicalEffect}. సూచన: ${i.management}`);
    });
    if (safetyAdvice.length === 0) {
      safetyAdvice.push('రోజంతా పుష్కలంగా మంచినీరు త్రాగండి.');
      safetyAdvice.push('మిగిలిపోయిన యాంటీబయాటిక్స్‌ను ఇతరులకు ఇవ్వకండి.');
      safetyAdvice.push('దద్దుర్లు లేదా విరేచనాలు వస్తే వెంటనే సమీప ఆరోగ్య కేంద్రానికి వెళ్లండి.');
    }
  } else if (lang === 'ta') {
    if (prescription.patient.renalFunction && prescription.patient.renalFunction !== 'Normal') {
      safetyAdvice.push(`சிறுநீரக பாதுகாப்பு: மருந்து அளவு சிறுநீரக நிலைக்கு ஏற்ப சரிசெய்யப்பட்டுள்ளதா என உறுதிப்படுத்தவும்.`);
    }
    stage3.interactions.forEach((i) => {
      safetyAdvice.push(`மருந்து மோதல் (${i.drugA} + ${i.drugB}): ${i.clinicalEffect}`);
    });
    if (safetyAdvice.length === 0) {
      safetyAdvice.push('நிறைய தண்ணீர் குடிக்கவும்.');
      safetyAdvice.push('மீதமுள்ள மருந்துகளை மற்றவர்களுடன் பகிர வேண்டாம்.');
      safetyAdvice.push('ஒவ்வாமை ஏற்பட்டால் உடனடியாக மருத்துவரை அணுகவும்.');
    }
  } else if (lang === 'bn') {
    if (prescription.patient.renalFunction && prescription.patient.renalFunction !== 'Normal') {
      safetyAdvice.push(`কিডনি সতর্কতা: কিডনির কার্যক্ষমতা অনুযায়ী ঔষধের মাত্রা ঠিক আছে কিনা যাচাই করুন।`);
    }
    stage3.interactions.forEach((i) => {
      safetyAdvice.push(`ঔষধের সংঘাত (${i.drugA} + ${i.drugB}): ${i.clinicalEffect}`);
    });
    if (safetyAdvice.length === 0) {
      safetyAdvice.push('প্রচুর পরিমাণে বিশুদ্ধ জল পান করুন।');
      safetyAdvice.push('অবশিষ্ট অ্যান্টিবায়োটিক অন্য কাউকে দেবেন না।');
    }
  } else if (lang === 'es') {
    if (prescription.patient.renalFunction && prescription.patient.renalFunction !== 'Normal') {
      safetyAdvice.push(`Aviso de función renal: Confirme que su médico haya ajustado la dosis para su función renal.`);
    }
    stage3.interactions.forEach((i) => {
      safetyAdvice.push(`Interacción (${i.drugA} + ${i.drugB}): ${i.clinicalEffect}. Manejo: ${i.management}`);
    });
    if (safetyAdvice.length === 0) {
      safetyAdvice.push('Manténgase bien hidratado bebiendo agua durante todo el día.');
      safetyAdvice.push('Nunca comparta antibióticos sobrantes con familiares o amigos.');
    }
  } else {
    if (prescription.patient.renalFunction && prescription.patient.renalFunction !== 'Normal') {
      safetyAdvice.push(`Kidney health notice: Because your kidney clearance is listed as "${prescription.patient.renalFunction}", be sure your doctor has confirmed this dose.`);
    }
    if (prescription.patient.pregnancyOrLactation) {
      safetyAdvice.push(`Pregnancy / Nursing alert: Make sure your clinician has specifically approved every medication in this list.`);
    }
    stage3.interactions.forEach((inter) => {
      safetyAdvice.push(`Drug Clash (${inter.drugA} + ${inter.drugB}): ${inter.clinicalEffect}. What to do: ${inter.management}`);
    });
    if (safetyAdvice.length === 0) {
      safetyAdvice.push('Stay well hydrated by drinking plenty of water throughout the day.');
      safetyAdvice.push('Never share leftover antibiotics with friends or family members.');
      safetyAdvice.push('Contact your clinic or pharmacist if you experience unexpected skin rashes or severe diarrhea.');
    }
  }

  // Localized Action Steps
  const actionSteps: string[] = [];
  if (lang === 'hi') {
    if (overallStatus === 'CRITICAL') {
      actionSteps.push('डॉक्टर या फार्मासिस्ट से बात करने से पहले यह दवा न लें।');
      actionSteps.push('दवा लेते समय यह पर्चा या डिजिटल रिपोर्ट फार्मासिस्ट को दिखाएं।');
    } else {
      actionSteps.push('दवा की हर खुराक शीशी या पैकेट पर लिखे निर्धारित समय पर ही लें।');
      actionSteps.push('दवाइयों को नमी और सीधी धूप से दूर सुरक्षित स्थान पर रखें।');
    }
  } else if (lang === 'te') {
    if (overallStatus === 'CRITICAL') {
      actionSteps.push('వైద్యుడితో మాట్లాడే వరకు ఈ మందులను ప్రారంభించవద్దు.');
      actionSteps.push('మందులు కొనేటప్పుడు ఈ డిజిటల్ నివేదికను ఫార్మసిస్ట్‌కు చూపించండి.');
    } else {
      actionSteps.push('సూచించిన సమయాల్లో క్రమం తప్పకుండా మందులు తీసుకోండి.');
      actionSteps.push('మందులను చల్లని, పొడి ప్రదేశంలో భద్రపరచండి.');
    }
  } else if (lang === 'ta') {
    actionSteps.push('பரிந்துரைக்கப்பட்ட அனைத்து மருந்துகளையும் நேரத்திற்கு உட்கொள்ளவும்.');
    actionSteps.push('குளிரான, உலர்ந்த இடத்தில் மருந்துகளை பாதுகாக்கவும்.');
  } else if (lang === 'bn') {
    actionSteps.push('সময়মতো নিয়ম মেনে প্রতিটি মাত্রা সেবন করুন।');
    actionSteps.push('ঔষধ সর্বদা শুষ্ক ও নিরাপদ স্থানে সংরক্ষণ করুন।');
  } else if (lang === 'es') {
    actionSteps.push('Tome cada dosis a la hora programada en su envase.');
    actionSteps.push('Guarde los medicamentos en un lugar fresco y seco.');
  } else {
    actionSteps.push('Take every dose on time as scheduled on your medication container.');
    actionSteps.push('Store medicines in a cool, dry place away from heat and moisture.');
  }

  // Why finish the whole course (Superbug prevention)
  let whyFinishCourseText = '';
  if (lang === 'hi') {
    whyFinishCourseText = `भले ही आपको 2 या 3 दिनों में पूर्ण आराम महसूस होने लगे, फिर भी शरीर में कुछ कीटाणु जीवित रह सकते हैं। यदि आप दवा बीच में छोड़ देंगे, तो सबसे मजबूत कीटाणु जीवित बचकर "सुपरबग" में बदल जाएंगे, जिन पर सामान्य एंटीबायोटिक्स असर करना बंद कर देती हैं। इसलिए पूरे ${duration} दिनों का कोर्स अवश्य पूरा करें।`;
  } else if (lang === 'te') {
    whyFinishCourseText = `మీకు 2 లేదా 3 రోజుల్లో నయమైనట్లు అనిపించినప్పటికీ, శరీరంలో కొన్ని బ్యాక్టీరియా మిగిలి ఉండవచ్చు. మీరు మందులు ఆపివేస్తే, బలమైన క్రిములు బతికి "సూపర్‌బగ్స్"గా మారతాయి, ఆ తర్వాత సాధారణ యాంటీబయాటిక్స్ పని చేయవు. కాబట్టి పూర్తి ${duration} రోజుల కోర్సును తప్పకుండా పూర్తి చేయండి.`;
  } else if (lang === 'ta') {
    whyFinishCourseText = `2 அல்லது 3 நாட்களில் உடல்நிலை சீரானாலும், உடலுக்குள் கிருமிகள் வாழக்கூடும். பாதியில் நிறுத்தினால், அவை 'சூப்பர்பக்'காக மாறி எதிர்காலத்தில் மருந்துகளை எதிர்க்கும். எனவே முழு ${duration} நாட்களும் மருந்தை முடிக்க வேண்டும்.`;
  } else if (lang === 'bn') {
    whyFinishCourseText = `২-৩ দিনের মধ্যে সুস্থ বোধ করলেও জীবাণু শরীরে থেকে যেতে পারে। ঔষধ বন্ধ করলে শক্তিশালী জীবাণুগুলো 'সুপারবাগ'-এ পরিণত হয়। তাই সম্পূর্ণ ${duration} দিনের কোর্স শেষ করুন।`;
  } else if (lang === 'es') {
    whyFinishCourseText = `Incluso si se siente 100% mejor después de 2 o 3 días, las bacterias sobrevivientes pueden mutar en "superbacterias" resistentes si suspende el antibiótico antes de tiempo. Complete siempre los ${duration} días indicados.`;
  } else {
    whyFinishCourseText = `Even if you feel completely better after 2 or 3 days, surviving bacteria can still linger in your system. If you stop early, the strongest bacteria will survive, multiply, and turn into drug-resistant "superbugs" that standard antibiotics can no longer cure. Always finish the entire ${duration}-day course unless a doctor specifically tells you to stop.`;
  }

  // Questions for doctor
  const questionsForDoctor: string[] = [];
  if (lang === 'hi') {
    questionsForDoctor.push(`"क्या यह मेरी बीमारी (${prescription.patient.diagnosis}) के लिए सबसे सुरक्षित एंटीबायोटिक है?"`);
    questionsForDoctor.push(`"क्या इस दवा के साथ मुझे कोई विशेष खान-पान या प्रोबायोटिक लेना चाहिए?"`);
    if (stage3.interactions.length > 0) {
      questionsForDoctor.push(`"दवाओं के टकराव से बचने के लिए मुझे इनके बीच कितने घंटे का अंतर रखना चाहिए?"`);
    }
  } else if (lang === 'te') {
    questionsForDoctor.push(`"ఈ వ్యాధి (${prescription.patient.diagnosis}) కొరకు ఇది అత్యంత సురక్షితమైన యాంటీబయాటిక్ మందేనా?"`);
    questionsForDoctor.push(`"ఈ మందులతో పాటు ఏవైనా ప్రత్యేక ఆహార జాగ్రత్తలు పాటించాలా?"`);
    if (stage3.interactions.length > 0) {
      questionsForDoctor.push(`"మందుల కలయిక దుష్ప్రభావాలను నివారించడానికి వాటి మధ్య ఎన్ని గంటల సమయం ఉండాలి?"`);
    }
  } else if (lang === 'ta') {
    questionsForDoctor.push(`"இந்த நோய் (${prescription.patient.diagnosis}) சிகிச்சைக்கு இது பாதுகாப்பான மருந்தா?"`);
    questionsForDoctor.push(`"மருந்து உட்கொள்ளும் போது ஏதேனும் உணவு கட்டுப்பாடுகள் உள்ளதா?"`);
  } else if (lang === 'bn') {
    questionsForDoctor.push(`"এই রোগের জন্য এটিই কি সবচেয়ে নিরাপদ অ্যান্টিবায়োটিক?"`);
    questionsForDoctor.push(`"এই ঔষধের সাথে কি বিশেষ কোনো খাবার খাওয়া উচিত?"`);
  } else if (lang === 'es') {
    questionsForDoctor.push(`"¿Es este el antibiótico más seguro de primera línea para ${prescription.patient.diagnosis}?"`);
    questionsForDoctor.push(`"¿Debo tomar algún probiótico o alimento especial durante el tratamiento?"`);
  } else {
    questionsForDoctor.push(`"Is this the safest first-line antibiotic for ${prescription.patient.diagnosis}?"`);
    questionsForDoctor.push(`"Should I take any probiotic or special foods while on this course?"`);
    if (stage3.interactions.length > 0) {
      questionsForDoctor.push(`"How many hours apart should I space my medications to avoid interactions?"`);
    }
  }

  // Full Audio Script for Text-to-Speech
  const audioGreeting =
    lang === 'hi'
      ? `नमस्ते। आपकी पर्ची की दवा सुरक्षा जांच पूरी हो चुकी है। स्थिति है: ${verdictBadge.label}। `
      : lang === 'te'
      ? `నమస్కారం. మీ ప్రిస్క్రిప్షన్ భద్రతా సమీక్ష పూర్తయింది. స్థితి: ${verdictBadge.label}. `
      : lang === 'ta'
      ? `வணக்கம். உங்கள் மருந்துச்சீட்டு பாதுகாப்பு ஆய்வு முடிந்தது. நிலை: ${verdictBadge.label}. `
      : lang === 'bn'
      ? `নমস্কার। আপনার প্রেসক্রিপশন নিরাপত্তা নিরীক্ষা সম্পন্ন হয়েছে। অবস্থা: ${verdictBadge.label}। `
      : lang === 'es'
      ? `Hola. La auditoría de seguridad de su receta está lista. Estado: ${verdictBadge.label}. `
      : `Hello. Your prescription safety review is complete. Overall status: ${verdictBadge.label}. `;

  const audioMedications = medicationGuidance
    .map((m) => `${m.drugName}: ${m.howToTake}. ${m.timingTip || ''}`)
    .join('. ');

  const fullAudioScript = `${audioGreeting} ${headline} ${simpleExplanation} ${audioMedications} ${whyFinishCourseText}`;

  return {
    verdictBadge,
    headline,
    simpleExplanation,
    medicationGuidance,
    safetyAdvice,
    actionSteps,
    whyFinishCourseText,
    questionsForDoctor,
    fullAudioScript,
  };
}
