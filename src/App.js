import React, { useState, useEffect, useRef, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import emailjs from "emailjs-com";

// Navigation Items (keys for translation)
const navItems = [
  { key: "home", id: "hero" },
  { key: "aboutMe", id: "about" },
  { key: "skills", id: "skills" },
  { key: "projects", id: "projects" },
  { key: "contact", id: "contact" },
];

// Theme colors as before
const themeColors = {
  saffron: {
    primary: "#f59e0b",
    primaryDark: "#d97706",
    primaryLight: "#fbbf24",
    threeColor1: "#d97706",
    threeColor2: "#f59e0b",
    particlesColor: "#fbbf24",
  },
  blue: {
    primary: "#3b82f6",
    primaryDark: "#2563eb",
    primaryLight: "#60a5fa",
    threeColor1: "#2563eb",
    threeColor2: "#3b82f6",
    particlesColor: "#3b82f6",
  },
  violet: {
    primary: "#8b5cf6",
    primaryDark: "#7c3aed",
    primaryLight: "#a78bfa",
    threeColor1: "#7c3aed",
    threeColor2: "#8b5cf6",
    particlesColor: "#a78bfa",
  },
};

// TRANSLATIONS for supported languages
const translations = {
  en: {
    home: "Home",
    aboutMe: "About Me",
    skills: "Skills",
    projects: "Projects",
    contact: "Contact",
    fullStack: "Full-stack Developer & AI Enthusiast — Building beautiful, scalable web experiences.",
    seeMyWork: "See My Work",
    about: "About Me",
    aboutDescription1:
      "Meet Gojiya is a Solution Analyst on the Product Engineering and Development team, within the Engineering, AI, and Data offering at Deloitte Canada. Meet has the ability to link business with technology to extract insights from complex data and build data-driven solutions.",
    aboutDescription2:
      "Meet is a graduate of the University of New Brunswick, where he earned a Master of Computer Science degree. He also holds a Bachelor’s degree in Computer Engineering from Gujarat Technological University. Meet is driven by technology innovation, advanced analytics, adaptability, collaboration, and creativity, ultimately furthering his career as well as those around him. He possesses a strong entrepreneurial spirit, which fuels his passion for creating impactful solutions and driving positive change within the industry and the world.",
    aboutDescription3:
      "An avid learner and active listener, Meet thrives on absorbing knowledge from as many people as possible, recognizing that every interaction is an opportunity to gain new insights and perspectives. His extremely curious personality propels him to explore new ideas, question existing paradigms, and continuously seek out opportunities for learning and growth.",
    sendMessage: "Send Message",
    messageSent: "Message sent successfully!",
    messageFailed: "Oops! Something went wrong. Please try again.",
    backToTop: "Back to top",
    downloadResume: "Download Resume",
  },
  fr: {
    home: "Accueil",
    aboutMe: "À propos",
    skills: "Compétences",
    projects: "Projets",
    contact: "Contact",
    fullStack: "Développeur Full-stack & passionné d'IA — Création d'expériences web belles et évolutives.",
    seeMyWork: "Voir mon travail",
    about: "À propos de moi",
    aboutDescription1:
      "Meet Gojiya est un analyste de solutions dans l'équipe de développement et d'ingénierie produit chez Deloitte Canada. Meet est capable de relier le business à la technologie pour extraire des insights de données complexes et construire des solutions basées sur les données.",
    aboutDescription2:
      "Meet est diplômé de l'Université du Nouveau-Brunswick, où il a obtenu un Master en informatique. Il détient également une licence en ingénierie informatique de l'Université technologique du Gujarat. Meet est motivé par l'innovation technologique, l'analyse avancée, l'adaptabilité, la collaboration et la créativité, ce qui fait avancer sa carrière ainsi que celle des autres.",
    aboutDescription3:
      "Apprenant avide et auditeur actif, Meet s'efforce d'absorber les connaissances de nombreuses personnes, reconnaissant que chaque interaction est une opportunité d'acquérir de nouvelles perspectives. Sa curiosité extrême le pousse à explorer de nouvelles idées et à chercher continuellement des opportunités d'apprentissage.",
    sendMessage: "Envoyer le message",
    messageSent: "Message envoyé avec succès !",
    messageFailed: "Oups ! Quelque chose a mal tourné. Veuillez réessayer.",
    backToTop: "Retour en haut",
    downloadResume: "Télécharger le CV",
  },
  hi: {
    home: "होम",
    aboutMe: "मेरे बारे में",
    skills: "कौशल",
    projects: "परियोजनाएँ",
    contact: "संपर्क करें",
    fullStack: "फुल-स्टैक डेवलपर और एआई उत्साही — सुंदर, स्केलेबल वेब अनुभव बना रहे हैं।",
    seeMyWork: "मेरा काम देखें",
    about: "मेरे बारे में",
    aboutDescription1:
      "मीत गोजिया डेलॉइट कनाडा में इंजीनियरिंग, एआई और डेटा टीम के उत्पाद इंजीनियरिंग और विकास टीम में एक समाधान विश्लेषक हैं। मीत व्यवसाय और तकनीक को जोड़कर जटिल डेटा से अंतर्दृष्टि निकालने और डेटा-आधारित समाधान बनाने में सक्षम हैं।",
    aboutDescription2:
      "मीत ने यूनिवर्सिटी ऑफ न्यू ब्रंसविक से मास्टर ऑफ कंप्यूटर साइंस की डिग्री प्राप्त की है। उन्होंने गुजरात टेक्नोलॉजिकल यूनिवर्सिटी से कंप्यूटर इंजीनियरिंग में स्नातक की डिग्री भी हासिल की है। मीत तकनीकी नवाचार, उन्नत विश्लेषिकी, अनुकूलनशीलता, सहयोग और रचनात्मकता द्वारा प्रेरित हैं, जो उनकी और उनके आसपास के लोगों के करियर को आगे बढ़ाता है।",
    aboutDescription3:
      "एक उत्साही शिक्षार्थी और सक्रिय श्रोता के रूप में, मीत जितने हो सके लोगों से ज्ञान प्राप्त करने में लगनशील हैं, यह मानते हुए कि हर बातचीत नई अंतर्दृष्टि और दृष्टिकोण प्राप्त करने का अवसर है। उनकी अत्यधिक जिज्ञासु प्रकृति उन्हें नए विचारों का अन्वेषण करने, मौजूदा मान्यताओं को चुनौती देने और सीखने और विकास के अवसरों की खोज जारी रखने के लिए प्रेरित करती है।",
    sendMessage: "संदेश भेजें",
    messageSent: "संदेश सफलतापूर्वक भेजा गया!",
    messageFailed: "अरे! कुछ गलत हो गया। कृपया पुनः प्रयास करें।",
    backToTop: "ऊपर जाएं",
    downloadResume: "बायोडाटा डाउनलोड करें",
  },
  gu: {
    home: "હોમ",
    aboutMe: "મારા વિશે",
    skills: "કૌશલ્ય",
    projects: "પ્રોજેક્ટ્સ",
    contact: "સંપર્ક કરો",
    fullStack: "ફુલ-સ્ટેક ડેવલપર અને AI ઉત્સાહી — સુંદર, સ્કેલેબલ વેબ અનુભવ બનાવી રહ્યા છે.",
    seeMyWork: "મારું કામ જુઓ",
    about: "મારા વિશે",
    aboutDescription1:
      "મીટ ગોજિયા ડિલોઇટ કેનેડામાં એન્જિનિયરિંગ, AI અને ડેટા ટીમમાં પ્રોડક્ટ એન્જિનિયરિંગ અને ડેવલપમેન્ટ ટીમમાં સોલ્યુશન એનાલિસ્ટ છે. મીટ જટિલ ડેટામાંથી બિઝનેસને ટેક્નોલોજી સાથે જોડીને અંદરજાણી કાઢી શકે છે અને ડેટા આધારિત સોલ્યુશન્સ બનાવી શકે છે.",
    aboutDescription2:
      "મીટ યુનિવર્સિટી ઓફ ન્યુ બ્રન્સવિકથી માસ્ટર ઓફ કમ્પ્યુટર સાયન્સ ડિગ્રી ધરાવે છે. તેણે ગુજરાત ટેકનોલોજિકલ યુનિવર્સિટીથી કમ્પ્યુટર એન્જિનિયરિંગમાં બેચલર ડિગ્રી પણ મેળવી છે. મીટ ટેક્નોલોજી ઈનોવેશન, એડવાન્સ એનાલિટિક્સ, એડેપ્ટેબિલિટી, સહકાર અને ક્રિએટિવિટી દ્વારા પ્રેરિત છે, જે તેમના અને તેમના આસપાસના લોકોના કરિયરનું વિકાસ કરે છે.",
    aboutDescription3:
      "એક ઉત્સાહી શીખનાર અને સક્રિય શ્રોતાર તરીકે, મીટ જેટલા લોકો પાસેથી જ્ઞાન શીખવા માટે ઉત્સુક છે, માનતાં કે દરેક સંવાદ નવું દ્રષ્ટિકોણ અને જાણકારી મેળવવાનો અવસર છે. તેમનું અત્યંત કૌતુક સ્વભાવ તેમને નવા વિચારોનું અન્વેષણ કરવા અને સતત શીખવાની તક શોધવા માટે પ્રેરિત કરે છે.",
    sendMessage: "સંદેશ મોકલો",
    messageSent: "સંદેશ સફળતાપૂર્વક મોકલાયો!",
    messageFailed: "અફસોસ! કંઈક ખોટું થયું. કૃપા કરીને ફરીથી પ્રયાસ કરો.",
    backToTop: "ઉપર જાઓ",
    downloadResume: "રિઝ્યૂમ ડાઉનલોડ કરો",
  },
  kn: {
    home: "ಹೋಮ್",
    aboutMe: "ನನ್ನ ಬಗ್ಗೆ",
    skills: "ದಕ್ಷತೆಗಳು",
    projects: "ಪ್ರಾಜೆಕ್ಟ್ಸ್",
    contact: "ಸಂಪರ್ಕಿಸಿ",
    fullStack: "ಫುಲ್-ಸ್ಟಾಕ್ ಡೆವಲಪರ್ ಮತ್ತು AI ಆಸಕ್ತರು — ಸುಂದರ, ಪಾರಮರ್ಶನೀಯ ವೆಬ್ ಅನುಭವಗಳನ್ನು ನಿರ್ಮಿಸುತ್ತಿದ್ದಾರೆ.",
    seeMyWork: "ನನ್ನ ಕೆಲಸ ನೋಡಿ",
    about: "ನನ್ನ ಬಗ್ಗೆ",
    aboutDescription1:
      "ಮೀಟ್ ಗೋಜಿಯಾ ಡಿಲಾಯ್ಟ್ ಕಾನಡಾದ ಎಂಜಿನಿಯರಿಂಗ್, AI ಮತ್ತು ಡೇಟಾ ತಂಡದ ಉತ್ಪನ್ನ ಎಂಜಿನಿಯರಿಂಗ್ ಮತ್ತು ಅಭಿವೃದ್ಧಿ ತಂಡದ ಪರಿಹಾರ ವಿಶ್ಲೇಷಕನಾಗಿದ್ದಾರೆ. ಮೀಟ್ ವಾಣಿಜ್ಯ ಮತ್ತು ತಂತ್ರಜ್ಞಾನದ ಸಂಪರ್ಕದಿಂದ ಸಂಕೀರ್ಣ ಡೇಟಾದಿಂದ ಒಳನೋಟಗಳನ್ನು ಹೊರತೆಗೆದು ಡೇಟಾ ಆಧಾರಿತ ಪರಿಹಾರಗಳನ್ನು ನಿರ್ಮಿಸಲು ಸಾಮರ್ಥ್ಯವಿದೆ.",
    aboutDescription2:
      "ಮೀಟ್ ನ್ಯೂ ಬ್ರನ್ಸ್ವಿಕ್ ವಿಶ್ವವಿದ್ಯಾಲಯದಿಂದ ಕಂಪ್ಯೂಟರ್ ಸೈನ್ಸ್‌ನಲ್ಲಿ ಮಾಸ್ಟರ್ ಪದವಿ ಪಡೆದಿದ್ದಾರೆ. ಅವರು ಗುಜರಾತ್ ಟೆಕ್ನಾಲಾಜಿಕಲ್ ವಿಶ್ವವಿದ್ಯಾಲಯದಿಂದ ಕಂಪ್ಯೂಟರ್ ಎಂಜಿನಿಯರಿಂಗ್‌ನಲ್ಲಿ ಬ್ಯಾಚುಲರ್ ಪದವಿ ಹೊಂದಿದ್ದಾರೆ. ಮೀಟ್ ತಂತ್ರಜ್ಞಾನ ನವೋದ್ಯಮ, ಪ್ರಗತಿಶೀಲ ವಿಶ್ಲೇಷಣೆ, ಹೊಂದಾಣಿಕೆ, ಸಹಕಾರ ಮತ್ತು ಸೃಜನಾತ್ಮಕತೆಯಿಂದ ಪ್ರೇರಿತನಾಗಿದ್ದು, ಅವರ ಮತ್ತು ಅವರ ಸುತ್ತಲೂ ಇರುವವರ ವೃತ್ತಿಜೀವನವನ್ನು ಮುಂದುವರಿಸುತ್ತಿದ್ದಾರೆ.",
    aboutDescription3:
      "ಆತ್ಮಸಾತ್ಕಾರವಾದ ಕಲಿಕಾರರು ಮತ್ತು ಸಕ್ರಿಯ ಶ್ರೋತೃಗಳಾಗಿ, ಮೀಟ್ ಸಾಧ್ಯವಾದಷ್ಟು ಜನರಿಂದ ಜ್ಞಾನವನ್ನು ಆಜಮಾಯಿಸಲು ಉತ್ಸುಕನಾಗಿದ್ದಾರೆ, ಪ್ರತಿ ಸಂಭಾಷಣೆ ಹೊಸ ದೃಷ್ಟಿಕೋಣ ಮತ್ತು ತಿಳಿವಳಿಕೆಯ ಅವಕಾಶವಾಗಿರುತ್ತದೆ ಎಂದು ಗುರುತಿಸಿಕೊಂಡಿದ್ದಾರೆ. ಅವರ ಅತ್ಯಂತ ಕುತೂಹಲದ ವ್ಯಕ್ತಿತ್ವ ಹೊಸ ಕಲ್ಪನೆಗಳನ್ನು ಅನ್ವೇಷಿಸಲು, ಸಧ್ಯದ ಪರಿಕಲ್ಪನೆಗಳಿಗೆ ಪ್ರಶ್ನೆಗಳನ್ನು ಎತ್ತಲು ಮತ್ತು ಕಲಿಕೆ ಮತ್ತು ಬೆಳವಣಿಗೆಯ ಅವಕಾಶಗಳನ್ನು ನಿರಂತರವಾಗಿ ಹುಡುಕಲು ಪ್ರೇರಣೆ ನೀಡುತ್ತದೆ.",
    sendMessage: "ಸಂದೇಶ ಕಳುಹಿಸಿ",
    messageSent: "ಸಂದೇಶ ಯಶಸ್ವಿಯಾಗಿ ಕಳುಹಿಸಲಾಗಿದೆ!",
    messageFailed: "ಓಹ್! ಕೆಲವು ತಪ್ಪಾಗಿದೆ. ದಯವಿಟ್ಟು ಮರುಪ್ರಯತ್ನಿಸಿ.",
    backToTop: "ಮೇಲಿಗೆ ಹೋಗಿ",
    downloadResume: "ರೆಸ್ಯೂಮ್ ಡೌನ್ಲೋಡ್ ಮಾಡಿ",
  },
  te: {
    home: "హోమ్",
    aboutMe: "నా గురించి",
    skills: "నైపుణ్యాలు",
    projects: "ప్రాజెక్టులు",
    contact: "సంప్రదించండి",
    fullStack: "ఫుల్-స్టాక్ డెవలపర్ & AI అభిమాని — అందమైన, స్కేలబుల్ వెబ్ అనుభవాలను నిర్మిస్తున్నాడు.",
    seeMyWork: "నా పని చూడండి",
    about: "నా గురించి",
    aboutDescription1:
      "మీట్ గోజియా డెలాయిట్ కెనడాలోని ఇంజనీరింగ్, AI, మరియు డేటా టీమ్‌లో ప్రొడక్ట్ ఇంజనీరింగ్ మరియు అభివృద్ధి టీమ్‌లో సొల్యూషన్ అనలిస్ట్‌గా ఉన్నారు. మీట్ వ్యాపారాన్ని సాంకేతికతతో కలిపి సంక్లిష్టమైన డేటా నుండి అవగాహనలను పొందగలడు మరియు డేటా ఆధారిత పరిష్కారాలను రూపొందించగలడు.",
    aboutDescription2:
      "మీట్ యూనివర్సిటీ ఆఫ్ న్యూ బ్రన్స్‌విక్ నుండి మాస్టర్ ఆఫ్ కంప్యూటర్ సైన్స్ డిగ్రీ పొందారు. గుజరాత్ టెక్నాలాజికల్ యూనివర్సిటీ నుండి కంప్యూటర్ ఇంజనీరింగ్‌లో బ్యాచిలర్ డిగ్రీను కూడా కలిగి ఉన్నారు. మీట్ సాంకేతిక నూతనత, ఆధునిక విశ్లేషణలు, అనుకూలత, సహకారం మరియు సృజనాత్మకత ద్వారా ప్రేరేపితుడుగా, తన మరియు తన చుట్టుపక్కల వారిలో వృత్తిపరమైన అభివృద్ధిని కొనసాగిస్తున్నారు.",
    aboutDescription3:
      "ఒక ఉత్సాహవంతుడైన అభ్యాసకుడిగా మరియు చురుకైన శ్రోతగా, మీట్ ఎంతమేరకు వీరితో ఉన్నవారినుండి జ్ఞానాన్ని గ్రహిస్తారు, ప్రతి సంభాషణ కొత్త అవగాహనలు మరియు దృక్కోణాలను పొందే అవకాశం అని గుర్తిస్తున్నారు. అతని అత్యంత జిజ్ఞాసువు స్వభావం కొత్త ఆలోచనలు అన్వేషించడానికి, ఉన్న పరిధులను ప్రశ్నించడానికి మరియు ఎల్లప్పుడూ అభ్యాసం మరియు ఎదుగుదల అవకాశాలను అన్వేషించడానికి ప్రేరేపిస్తుంది.",
    sendMessage: "సందేశం పంపండి",
    messageSent: "సందేశం విజయవంతంగా పంపబడింది!",
    messageFailed: "ఓహ్! ఏదో తప్పిపోయింది. దయచేసి మళ్ళీ ప్రయత్నించండి.",
    backToTop: "పైకి వెళ్లండి",
    downloadResume: "రెస్యూమ్ డౌన్లోడ్ చేయండి",
  },
  pa: {
    home: "ਹੋਮ",
    aboutMe: "ਮੇਰੇ ਬਾਰੇ",
    skills: "ਕੌਸ਼ਲ",
    projects: "ਪ੍ਰੋਜੈਕਟ",
    contact: "ਸੰਪਰਕ ਕਰੋ",
    fullStack: "ਫੁੱਲ-ਸਟੈਕ ਡਿਵੈਲਪਰ ਅਤੇ ਏਆਈ ਉਤਸ਼ਾਹੀ — ਸੁੰਦਰ, ਸਕੇਲਏਬਲ ਵੈੱਬ ਅਨੁਭਵ ਬਣਾ ਰਹੇ ਹਨ।",
    seeMyWork: "ਮੇਰਾ ਕੰਮ ਵੇਖੋ",
    about: "ਮੇਰੇ ਬਾਰੇ",
    aboutDescription1:
      "ਮੀਟ ਗੋਜੀਆ ਡਿਲੌਇਟ ਕੈਨੇਡਾ ਵਿੱਚ ਇੰਜੀਨੀਅਰਿੰਗ, ਏਆਈ ਅਤੇ ਡੇਟਾ ਟੀਮ ਵਿੱਚ ਉਤਪਾਦ ਇੰਜੀਨੀਅਰਿੰਗ ਅਤੇ ਵਿਕਾਸ ਟੀਮ ਵਿੱਚ ਇੱਕ ਸਾਂਝਾ ਵਿਸ਼ਲੇਸ਼ਕ ਹਨ। ਮੀਟ ਕਾਰੋਬਾਰ ਨੂੰ ਤਕਨਾਲੋਜੀ ਨਾਲ ਜੋੜ ਕੇ ਜਟਿਲ ਡੇਟਾ ਵਿੱਚੋਂ ਅੰਦਰੂਨੀ ਜਾਣਕਾਰੀ ਪ੍ਰਾਪਤ ਕਰਨ ਅਤੇ ਡੇਟਾ-ਆਧਾਰਿਤ ਸਮਾਧਾਨ ਬਣਾਉਣ ਵਿੱਚ ਸਮਰੱਥ ਹਨ।",
    aboutDescription2:
      "ਮੀਟ ਯੂਨੀਵਰਸਿਟੀ ਆਫ ਨਿਊ ਬ੍ਰੰਸਵਿਕ ਤੋਂ ਕੰਪਿਊਟਰ ਸਾਇੰਸ ਵਿੱਚ ਮਾਸਟਰ ਦੀ ਡਿਗਰੀ ਪ੍ਰਾਪਤ ਕੀਤੀ ਹੈ। ਉਹ ਗੁਜਰਾਤ ਟੈਕਨੋਲੋਜੀਕਲ ਯੂਨੀਵਰਸਿਟੀ ਤੋਂ ਕੰਪਿਊਟਰ ਇੰਜੀਨੀਅਰਿੰਗ ਵਿੱਚ ਬੈਚਲਰ ਡਿਗਰੀ ਵੀ ਰੱਖਦੇ ਹਨ। ਮੀਟ ਤਕਨਾਲੋਜੀ ਨਵੀਂਕਰਨ, ਉन्नਤ ਵਿਸ਼ਲੇਸ਼ਣ, ਅਨੁਕੂਲਤਾ, ਸਹਿਯੋਗ ਅਤੇ ਰਚਨਾਤਮਕਤਾ ਨਾਲ ਪ੍ਰੇਰਿਤ ਹਨ, ਜੋ ਉਹਨਾਂ ਅਤੇ ਉਹਨਾਂ ਦੇ ਆਸ-ਪਾਸ ਲੋਕਾਂ ਦੇ ਕਰੀਅਰ ਨੂੰ ਅੱਗੇ ਵਧਾਉਂਦੇ ਹਨ।",
    aboutDescription3:
      "ਇੱਕ ਉਤਸ਼ਾਹੀ ਸਿੱਖਣ ਵਾਲੇ ਅਤੇ ਸਰਗਰਮ ਸੁਣਨ ਵਾਲੇ ਵਜੋਂ, ਮੀਟ ਸੰਭਵ ਹੱਦ ਤਕ ਲੋਕਾਂ ਤੋਂ ਗਿਆਨ ਸਿੱਖਣ ਲਈ ਪ੍ਰੇਰਿਤ ਹਨ, ਸਮਝਦੇ ਹਨ ਕਿ ਹਰ ਇੰਟਰੈਕਸ਼ਨ ਨਵੀਆਂ ਅੰਦਰੂਨੀ ਜਾਣਕਾਰੀਆਂ ਅਤੇ ਦ੍ਰਿਸ਼ਟੀਕੋਣ ਪ੍ਰਾਪਤ ਕਰਨ ਦਾ ਮੌਕਾ ਹੈ। ਉਹਨਾਂ ਦੀ ਬਹੁਤ ਹੀ ਜਿਗਿਆਸੂ ਸ਼ਖਸੀਅਤ ਉਨ੍ਹਾਂ ਨੂੰ ਨਵੀਆਂ ਵਿਚਾਰਧਾਰਾਵਾਂ ਦੀ ਖੋਜ ਕਰਨ, ਮੌਜੂਦਾ ਧਾਰਣਾ ਨੂੰ ਚੁਣੌਤੀ ਦੇਣ ਅਤੇ ਸਿੱਖਣ ਅਤੇ ਵਿਕਾਸ ਦੇ ਮੌਕੇ ਲੱਭਣ ਲਈ ਪ੍ਰੇਰਿਤ ਕਰਦੀ ਹੈ।",
    sendMessage: "ਸੁਨੇਹਾ ਭੇਜੋ",
    messageSent: "ਸੁਨੇਹਾ ਸਫਲਤਾਪੂਰਵਕ ਭੇਜਿਆ ਗਿਆ!",
    messageFailed: "ਉਫ! ਕੁਝ ਗਲਤ ਹੋ ਗਿਆ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
    backToTop: "ਉੱਪਰ ਜਾਓ",
    downloadResume: "ਰੀਜ਼ਿਊਮ ਡਾਊਨਲੋਡ ਕਰੋ",
  },
  es: {
    home: "Inicio",
    aboutMe: "Sobre mí",
    skills: "Habilidades",
    projects: "Proyectos",
    contact: "Contacto",
    fullStack: "Desarrollador Full-stack y entusiasta de IA — Construyendo experiencias web hermosas y escalables.",
    seeMyWork: "Ver mi trabajo",
    about: "Sobre mí",
    aboutDescription1:
      "Meet Gojiya es un Analista de Soluciones en el equipo de Ingeniería y Desarrollo de Producto en Deloitte Canadá. Meet tiene la habilidad de vincular negocios con tecnología para extraer información de datos complejos y construir soluciones basadas en datos.",
    aboutDescription2:
      "Meet es graduado de la Universidad de New Brunswick, donde obtuvo una Maestría en Ciencias de la Computación. También posee una licenciatura en Ingeniería Informática de la Universidad Tecnológica de Gujarat. Meet se siente impulsado por la innovación tecnológica, análisis avanzado, adaptabilidad, colaboración y creatividad, impulsando su carrera y la de quienes lo rodean.",
    aboutDescription3:
      "Un ávido aprendiz y oyente activo, Meet se esfuerza por absorber conocimientos de tantas personas como sea posible, reconociendo que cada interacción es una oportunidad para obtener nuevas perspectivas y conocimientos. Su personalidad extremadamente curiosa lo impulsa a explorar nuevas ideas, cuestionar paradigmas existentes y buscar continuamente oportunidades para aprender y crecer.",
    sendMessage: "Enviar mensaje",
    messageSent: "¡Mensaje enviado con éxito!",
    messageFailed: "¡Vaya! Algo salió mal. Por favor, inténtelo de nuevo.",
    backToTop: "Volver arriba",
    downloadResume: "Descargar CV",
  },
  zh: {
    home: "首页",
    aboutMe: "关于我",
    skills: "技能",
    projects: "项目",
    contact: "联系",
    fullStack: "全栈开发者和AI爱好者——打造美观且可扩展的网页体验。",
    seeMyWork: "查看我的作品",
    about: "关于我",
    aboutDescription1:
      "Meet Gojiya 是 Deloitte 加拿大工程、AI 和数据团队的产品工程与开发团队解决方案分析师。Meet 能够将业务与技术结合，从复杂数据中提取见解并构建数据驱动的解决方案。",
    aboutDescription2:
      "Meet 毕业于新不伦瑞克大学，获得计算机科学硕士学位。还拥有古吉拉特理工大学的计算机工程学士学位。Meet 以技术创新、高级分析、适应性、协作和创造力为动力，推动自己及周围人的职业发展。",
    aboutDescription3:
      "作为一个热衷学习和积极倾听的人，Meet 热衷于从尽可能多的人那里吸取知识，认识到每一次互动都是获得新见解和视角的机会。他极具好奇心的个性推动他探索新想法、质疑现有范式，并不断寻求学习和成长的机会。",
    sendMessage: "发送信息",
    messageSent: "信息发送成功！",
    messageFailed: "哎呀！出了点问题。请再试一次。",
    backToTop: "返回顶部",
    downloadResume: "下载简历",
  },
  ar: {
    home: "الرئيسية",
    aboutMe: "عني",
    skills: "المهارات",
    projects: "المشاريع",
    contact: "اتصل",
    fullStack: "مطور شامل ومتحمس للذكاء الاصطناعي — بناء تجارب ويب جميلة وقابلة للتوسع.",
    seeMyWork: "شاهد أعمالي",
    about: "عني",
    aboutDescription1:
      "ميت غوجيا هو محلل حلول في فريق تطوير المنتجات والهندسة في ديلويت كندا. يمتلك ميت القدرة على ربط الأعمال بالتكنولوجيا لاستخلاص الرؤى من البيانات المعقدة وبناء حلول قائمة على البيانات.",
    aboutDescription2:
      "تخرج ميت من جامعة نيو برونزويك حيث حصل على درجة الماجستير في علوم الكمبيوتر. كما يحمل درجة البكالوريوس في هندسة الكمبيوتر من جامعة جوجارات التقنية. يحفز ميت الابتكار التكنولوجي والتحليلات المتقدمة والقدرة على التكيف والتعاون والإبداع، مما يدفع مسيرته المهنية ومسيرة من حوله.",
    aboutDescription3:
      "بصفته متعلمًا نهمًا ومستمعًا نشطًا، يزدهر ميت في امتصاص المعرفة من أكبر عدد ممكن من الناس، معترفًا بأن كل تفاعل هو فرصة للحصول على رؤى ومنظورات جديدة. تدفعه شخصيته الفضولية للغاية إلى استكشاف أفكار جديدة والتشكيك في النماذج الحالية والبحث المستمر عن فرص التعلم والنمو.",
    sendMessage: "أرسل رسالة",
    messageSent: "تم إرسال الرسالة بنجاح!",
    messageFailed: "عذرًا! حدث خطأ ما. يرجى المحاولة مرة أخرى.",
    backToTop: "العودة إلى الأعلى",
    downloadResume: "تحميل السيرة الذاتية",
  },
};

// Language full names for dropdown
const languageOptions = [
  { code: "en", name: "English" },
  { code: "fr", name: "Français" },
  { code: "hi", name: "हिन्दी" },
  { code: "gu", name: "ગુજરાતી" },
  { code: "kn", name: "ಕನ್ನಡ" },
  { code: "te", name: "తెలుగు" },
  { code: "pa", name: "ਪੰਜਾਬੀ" },
  { code: "es", name: "Español" },
  { code: "zh", name: "中文" },
  { code: "ar", name: "العربية" },
];

// 3D Cursor component (same as before)
function Cursor3D({ color }) {
  const meshRef = React.useRef();
  const { viewport, mouse } = useThree();
  const pos = React.useRef([0, 0]);

  useFrame(() => {
    pos.current[0] += (mouse.x * viewport.width * 0.5 - pos.current[0]) * 0.15;
    pos.current[1] += (mouse.y * viewport.height * 0.5 - pos.current[1]) * 0.15;
    if (meshRef.current) {
      meshRef.current.position.x = pos.current[0];
      meshRef.current.position.y = pos.current[1];
      meshRef.current.rotation.x += 0.02;
      meshRef.current.rotation.y += 0.025;
      meshRef.current.scale.lerp([1.5, 1.5, 1.5], 0.07);
    }
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[0.25, 0]} />
      <meshStandardMaterial
        color={color}
        metalness={0.95}
        roughness={0.1}
        emissive={color}
        emissiveIntensity={0.7}
      />
    </mesh>
  );
}

// Interactive Particles (same as before)
function InteractiveParticles({ color }) {
  const { viewport, mouse } = useThree();

  const PARTICLE_COUNT = 100;
  const PARTICLE_DISTANCE = 1.7;
  const positions = React.useRef([]);
  const velocities = React.useRef([]);

  if (positions.current.length === 0) {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions.current.push([
        (Math.random() - 0.5) * viewport.width * 1.2,
        (Math.random() - 0.5) * viewport.height * 1.2,
        (Math.random() - 0.5) * 5,
      ]);
      velocities.current.push([
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.01,
      ]);
    }
  }

  const pointsRef = React.useRef();
  const linesRef = React.useRef();

  useFrame(() => {
    const ptsPositions = pointsRef.current.geometry.attributes.position.array;
    const linesPositions = linesRef.current.geometry.attributes.position.array;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      let p = positions.current[i];
      let v = velocities.current[i];

      for (let axis = 0; axis < 3; axis++) {
        p[axis] += v[axis];
      }

      // Bounce boundaries bigger for full viewport + some margin
      if (p[0] < -viewport.width / 2 - 1 || p[0] > viewport.width / 2 + 1) v[0] = -v[0];
      if (p[1] < -viewport.height / 2 - 1 || p[1] > viewport.height / 2 + 1) v[1] = -v[1];
      if (p[2] < -3 || p[2] > 3) v[2] = -v[2];

      // Stronger mouse repulsion with smoothing
      const mx = mouse.x * viewport.width * 0.5;
      const my = mouse.y * viewport.height * 0.5;
      const dx = p[0] - mx;
      const dy = p[1] - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1.5) {
        const force = (1.5 - dist) * 0.05;
        v[0] += (dx / dist) * force;
        v[1] += (dy / dist) * force;
      }

      // Clamp velocity with a bit more speed for liveliness
      v[0] = Math.min(Math.max(v[0], -0.04), 0.04);
      v[1] = Math.min(Math.max(v[1], -0.04), 0.04);
      v[2] = Math.min(Math.max(v[2], -0.04), 0.04);

      ptsPositions[i * 3] = p[0];
      ptsPositions[i * 3 + 1] = p[1];
      ptsPositions[i * 3 + 2] = p[2];
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;

    // Update lines
    let lineIndex = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      for (let j = i + 1; j < PARTICLE_COUNT; j++) {
        const p1 = positions.current[i];
        const p2 = positions.current[j];
        const dx = p1[0] - p2[0];
        const dy = p1[1] - p2[1];
        const dz = p1[2] - p2[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < PARTICLE_DISTANCE) {
          linesPositions[lineIndex++] = p1[0];
          linesPositions[lineIndex++] = p1[1];
          linesPositions[lineIndex++] = p1[2];
          linesPositions[lineIndex++] = p2[0];
          linesPositions[lineIndex++] = p2[1];
          linesPositions[lineIndex++] = p2[2];
        }
      }
    }
    linesRef.current.geometry.setDrawRange(0, lineIndex / 3);
    linesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={PARTICLE_COUNT}
            array={new Float32Array(PARTICLE_COUNT * 3)}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color={color}
          size={0.12}
          sizeAttenuation
          transparent
          opacity={0.95}
          depthWrite={false}
        />
      </points>
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={PARTICLE_COUNT * PARTICLE_COUNT * 2}
            array={new Float32Array(PARTICLE_COUNT * PARTICLE_COUNT * 3 * 2)}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={0.4} depthWrite={false} />
      </lineSegments>
    </>
  );
}

function Floating3DCanvas({ theme }) {
  const colors = themeColors[theme] || themeColors.saffron;

  return (
    <Canvas
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "auto",
        zIndex: 1,
        opacity: 0.8,
      }}
      camera={{ position: [0, 0, 12], fov: 65 }}
      gl={{ antialias: true, toneMappingExposure: 1.5 }}
    >
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <pointLight position={[-5, -5, 5]} intensity={0.5} />
      <Suspense fallback={null}>
        <InteractiveParticles color={colors.particlesColor} />
        <Cursor3D color={colors.primary} />
      </Suspense>
      <OrbitControls autoRotate autoRotateSpeed={0.1} enableZoom={false} enablePan={false} />
    </Canvas>
  );
}

function ScrollIndicator({ onClick }) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: 1, y: [0, 15, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-12 left-1/2 transform -translate-x-1/2 focus:outline-none"
      aria-label="Scroll down indicator"
      title="Scroll down"
      style={{
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: 0,
      }}
    >
      <svg
        className="w-8 h-8 text-gray-500 dark:text-gray-300"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </motion.button>
  );
}

function SectionReveal({ id, colors, title, children }) {
  const controls = useAnimation();
  const ref = useRef();

  useEffect(() => {
    const onScroll = () => {
      if (!ref.current) return;
      const top = ref.current.getBoundingClientRect().top;
      const windowHeight = window.innerHeight;
      if (top < windowHeight - 100) {
        controls.start({ opacity: 1, y: 0, transition: { duration: 0.8 } });
      }
    };
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [controls]);

  return (
    <motion.section
      id={id}
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={controls}
      className="max-w-4xl mx-auto px-4 space-y-8 text-center relative z-10"
    >
      <motion.h2 className="text-4xl font-bold" style={{ color: colors.primary }}>
        {title}
      </motion.h2>
      <div className="text-lg max-w-3xl mx-auto leading-relaxed text-justify">{children}</div>
    </motion.section>
  );
}

const EMAILJS_SERVICE_ID = "service_i6dqi68";
const EMAILJS_TEMPLATE_ID = "template_mrty8sn";
const EMAILJS_USER_ID = "bqXMM_OmpPWcc1AMi";

export default function App() {
  const validThemes = ["saffron", "blue", "violet"];

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    return validThemes.includes(saved) ? saved : "blue";
  });

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved === null ? true : saved === "true";
  });

  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem("lang");
    return saved && translations[saved] ? saved : "en";
  });

  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [contactStatus, setContactStatus] = useState(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const formRef = useRef(null);

  // Translation helper
  const t = (key) => translations[lang]?.[key] || key;

  // Save lang on change
  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
    const html = document.documentElement;
    if (darkMode) html.classList.add("dark");
    else html.classList.remove("dark");
  }, [darkMode]);

  useEffect(() => {
    const sections = navItems.map(({ id }) => document.getElementById(id));
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.body.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
      setScrolled(scrollTop > 30);
      setShowBackToTop(scrollTop > 300);

      let current = "hero";
      sections.forEach((section) => {
        if (section) {
          const offsetTop = section.offsetTop - 120;
          if (scrollTop >= offsetTop) current = section.id;
        }
      });
      setActiveSection(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const yOffset = -80;
    const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const sendEmail = (e) => {
    e.preventDefault();
    setContactStatus(null);
    emailjs
      .sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, formRef.current, EMAILJS_USER_ID)
      .then(() => {
        setContactStatus("SUCCESS");
        formRef.current.reset();
      })
      .catch(() => setContactStatus("FAILED"));
  };

  // Sample projects and skills as before
  const projects = [
    {
      title: "Stock Market Copilot",
      description:
        "End-to-end React and FastAPI app that delivers stock data, news, and AI insights for smarter investment decisions.",
      link: "https://github.com/meetgojiya98/Stock-Market-Copilot",
      live: "https://stock-market-copilot.vercel.app/",
    },
    {
      title: "Stock Sentiment Dashboard",
      description:
        "The app provides a real-time dashboard displaying stock market sentiment, trending stocks, latest news, and Reddit posts to help users track market mood and insights.",
      link: "https://github.com/meetgojiya98/Stock-Sentiment-Dashboard",
      live: "https://meetgojiya98.github.io/stock-sentiment-frontend/",
    },
    {
      title: "StockVision",
      description:
        "StockVision is a responsive web app that predicts future stock prices using real market data. It features interactive charts, multiple ticker support, dark mode, and lets users save favorite stocks for easy access.",
      link: "https://github.com/meetgojiya98/StockVision",
      live: "https://stock-vision-five.vercel.app/",
    },
  ];

  const skills = [
    "JavaScript (ES6+)",
    "React.js & Next.js",
    "Node.js & Express",
    "MongoDB & SQL",
    "Python & FastAPI",
    "HTML5 & CSS3",
    "Git & CI/CD",
    "Pandas & NumPy",
    "REST APIs",
    "Postman & Jira",
    "TypeScript",
    "Java",
    "AWS",
    "OpenAI & AI Integration",
    "Selenium",
  ];

  const [currentProject, setCurrentProject] = useState(0);
  const projectTimeout = useRef();

  useEffect(() => {
    projectTimeout.current = setTimeout(() => {
      setCurrentProject((prev) => (prev + 1) % projects.length);
    }, 6000);
    return () => clearTimeout(projectTimeout.current);
  }, [currentProject]);

  const cycleTheme = () => {
    const currentIndex = validThemes.indexOf(theme);
    setTheme(validThemes[(currentIndex + 1) % validThemes.length]);
  };

  const colors = themeColors[theme] || themeColors.saffron;

  return (
    <>
      <style>{`
        :root {
          --color-primary: ${colors.primary};
          --color-primary-dark: ${colors.primaryDark};
          --color-primary-light: ${colors.primaryLight};
          transition: background-color 0.5s ease, color 0.5s ease;
        }
        .glass-card {
          background: rgba(255 255 255 / 0.15);
          backdrop-filter: saturate(180%) blur(10px);
          transition: background 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease;
        }
        .glass-card:hover {
          background: rgba(255 255 255 / 0.3);
          box-shadow: 0 0 20px var(--color-primary-light);
          transform: translateY(-5px) scale(1.03);
          cursor: pointer;
        }
        nav ul li:hover {
          color: var(--color-primary);
          text-decoration: underline;
          transform: scale(1.05);
          transition: all 0.3s ease;
        }
        a:hover {
          color: var(--color-primary);
          text-decoration: underline;
          transform: scale(1.05);
          transition: all 0.3s ease;
        }
        button:hover {
          transform: scale(1.05);
          transition: transform 0.2s ease;
        }
        /* Back to top button */
        .back-to-top {
          position: fixed;
          bottom: 80px;
          right: 20px;
          z-index: 100;
          background-color: var(--color-primary);
          border: none;
          padding: 0.75rem 1rem;
          border-radius: 9999px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 12px rgb(0 0 0 / 0.15);
          opacity: 0.8;
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
        .back-to-top:hover {
          opacity: 1;
          transform: scale(1.1);
        }
        /* Language selector */
        .lang-select {
          background: transparent;
          border: none;
          color: inherit;
          font-weight: 600;
          cursor: pointer;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          transition: background-color 0.3s ease;
        }
        .lang-select:hover {
          background-color: var(--color-primary-light);
          color: var(--color-primary-dark);
        }
      `}</style>

      <div
        className={`relative bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen transition-colors duration-700 font-sans`}
        style={{ paddingBottom: "90px" }}
      >
        <Floating3DCanvas theme={theme} />

        <div
          className="fixed top-0 left-0 h-1 z-50 transition-all"
          style={{ width: `${scrollProgress}%`, backgroundColor: colors.primary }}
        />

        <nav
          className={`fixed top-0 w-full z-40 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-700 transition-shadow ${
            scrolled ? "shadow-lg" : ""
          }`}
        >
          <div className="container mx-auto flex justify-between items-center px-6 py-3">
            <div
              onClick={() => scrollTo("hero")}
              className="text-2xl font-bold cursor-pointer select-none"
            >
              Meet Gojiya
            </div>

            {/* Desktop nav */}
            <ul className="hidden md:flex space-x-10 font-medium text-lg">
              {navItems.map(({ key, id }) => (
                <li
                  key={id}
                  onClick={() => scrollTo(id)}
                  className={`cursor-pointer hover:text-[var(--color-primary)] transition ${
                    activeSection === id ? "text-[var(--color-primary)] font-semibold" : ""
                  }`}
                >
                  {t(key)}
                </li>
              ))}
            </ul>

            {/* Language selector */}
            <select
              className="lang-select hidden md:block"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              aria-label="Select Language"
              title="Select Language"
            >
              {languageOptions.map(({ code, name }) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>

            <div className="flex items-center space-x-4">
              <button
                aria-label="Toggle Dark Mode"
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-full text-white transition"
                style={{ backgroundColor: colors.primary }}
              >
                {darkMode ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d="M12 3v1m0 16v1m8.66-11.66l-.707.707M5.05 18.95l-.707.707m15.192 2.121l-.707-.707M5.05 5.05l-.707-.707M21 12h-1M4 12H3" />
                    <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth={2} />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    stroke="none"
                  >
                    <path d="M12 3a9 9 0 0 0 0 18 9 9 0 0 1 0-18z" />
                  </svg>
                )}
              </button>
              <button
                aria-label="Cycle Color Theme"
                onClick={() => {
                  const currentIndex = validThemes.indexOf(theme);
                  setTheme(validThemes[(currentIndex + 1) % validThemes.length]);
                }}
                className="p-2 rounded-full bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 transition"
                title="Cycle Color Theme"
              >
                🎨
              </button>
            </div>
          </div>
        </nav>

        {/* Back to Top button */}
        {showBackToTop && (
          <button
            onClick={scrollToTop}
            className="back-to-top"
            aria-label={t("backToTop")}
            title={t("backToTop")}
          >
            ↑
          </button>
        )}

        <main className="container mx-auto px-6 pt-24 space-y-48 max-w-6xl scroll-smooth">
          {/* Hero */}
          <section
            id="hero"
            className="min-h-screen flex flex-col justify-center items-center text-center space-y-8 relative z-10"
          >
            <motion.h1
              initial={{ y: -60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1.2 }}
              className="text-6xl font-extrabold tracking-tight"
              style={{ color: colors.primary }}
            >
              Meet Gojiya
            </motion.h1>
            <motion.p
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1.5 }}
              className="max-w-xl text-lg md:text-xl"
            >
              {t("fullStack")}
            </motion.p>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => scrollTo("projects")}
              className="px-8 py-3 text-white rounded-lg shadow-lg transition z-10"
              style={{ backgroundColor: colors.primary }}
            >
              {t("seeMyWork")}
            </motion.button>
            <ScrollIndicator onClick={() => scrollTo("about")} />
          </section>

          {/* About Me */}
          <SectionReveal id="about" colors={colors} title={t("about")}>
            <p>{t("aboutDescription1")}</p>
            <br />
            <p>{t("aboutDescription2")}</p>
            <br />
            <p>{t("aboutDescription3")}</p>
          </SectionReveal>

          {/* Skills */}
          <SectionReveal id="skills" colors={colors} title={t("skills")}>
            <div className="flex flex-wrap justify-center gap-4">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="glass-card px-5 py-2 rounded-full text-white font-semibold shadow-lg cursor-default select-none transition"
                  style={{ backgroundColor: colors.primary }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </SectionReveal>

          {/* Projects */}
          <SectionReveal id="projects" colors={colors} title={t("projects")}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={projects[currentProject].title}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.8 }}
                className="glass-card block mx-auto max-w-3xl p-8 rounded-xl shadow-lg cursor-pointer select-none"
              >
                <h3 className="text-2xl font-semibold mb-4" style={{ color: colors.primary }}>
                  {projects[currentProject].title}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 text-lg mb-4">
                  {projects[currentProject].description}
                </p>

                <div className="flex justify-center gap-6">
                  <a
                    href={projects[currentProject].live}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline font-semibold"
                    style={{ color: colors.primary }}
                  >
                    Live Demo
                  </a>
                  <a
                    href={projects[currentProject].link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline font-semibold"
                    style={{ color: colors.primary }}
                  >
                    GitHub
                  </a>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-center gap-4 mt-4">
              {projects.map((_, idx) => (
                <button
                  key={idx}
                  aria-label={`Go to project ${idx + 1}`}
                  className={`w-4 h-4 rounded-full ${
                    idx === currentProject ? `bg-[var(--color-primary)]` : "bg-gray-400"
                  } transition`}
                  onClick={() => setCurrentProject(idx)}
                  style={{ backgroundColor: idx === currentProject ? colors.primary : undefined }}
                />
              ))}
            </div>
          </SectionReveal>

          {/* Contact */}
          <SectionReveal id="contact" colors={colors} title={t("contact")}>
            <form ref={formRef} onSubmit={sendEmail} className="space-y-6 text-left">
              <input
                type="text"
                name="user_name"
                placeholder={t("home")}
                required
                className="w-full p-3 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:outline-none transition"
                style={{ borderColor: colors.primary }}
              />
              <input
                type="email"
                name="user_email"
                placeholder={t("contact")}
                required
                className="w-full p-3 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:outline-none transition"
                style={{ borderColor: colors.primary }}
              />
              <textarea
                name="message"
                placeholder={t("sendMessage")}
                rows={6}
                required
                className="w-full p-3 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:outline-none transition resize-none"
                style={{ borderColor: colors.primary }}
              />
              <button
                type="submit"
                className="w-full py-3 text-white rounded-lg transition"
                style={{ backgroundColor: colors.primary }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = colors.primaryDark)}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = colors.primary)}
              >
                {t("sendMessage")}
              </button>
            </form>
            {contactStatus === "SUCCESS" && (
              <p className="mt-4 text-green-500 font-semibold">{t("messageSent")}</p>
            )}
            {contactStatus === "FAILED" && (
              <p className="mt-4 text-red-500 font-semibold">{t("messageFailed")}</p>
            )}
          </SectionReveal>
        </main>

        <footer className="fixed bottom-0 left-0 w-full bg-gray-200 dark:bg-gray-800 border-t border-gray-300 dark:border-gray-700 flex justify-between items-center px-6 py-2 text-sm text-gray-700 dark:text-gray-300 select-none z-40">
          <div>© {new Date().getFullYear()} Meet Gojiya. All rights reserved.</div>
          <div className="flex space-x-6">
            <a
              href="https://github.com/meetgojiya98"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="hover:text-current transition"
              style={{ color: colors.primary }}
            >
              <svg fill="currentColor" className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.373 0 12a12 12 0 008.207 11.385c.6.11.82-.26.82-.577v-2.022c-3.338.725-4.042-1.61-4.042-1.61-.546-1.385-1.333-1.754-1.333-1.754-1.09-.744.083-.729.083-.729 1.205.086 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.996.108-.775.42-1.305.763-1.605-2.665-.3-5.466-1.333-5.466-5.933 0-1.312.467-2.38 1.235-3.22-.123-.303-.535-1.522.117-3.176 0 0 1.008-.323 3.3 1.23a11.5 11.5 0 016.003 0c2.29-1.553 3.296-1.23 3.296-1.23.654 1.654.243 2.873.12 3.176.77.84 1.232 1.91 1.232 3.22 0 4.61-2.807 5.63-5.48 5.922.43.37.815 1.102.815 2.222v3.293c0 .32.22.694.825.576A12 12 0 0024 12c0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/in/meet-gojiya/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="hover:text-current transition"
              style={{ color: colors.primary }}
            >
              <svg fill="currentColor" className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.028-3.037-1.852-3.037-1.853 0-2.136 1.447-2.136 2.942v5.664H9.354V9h3.415v1.561h.047c.476-.9 1.637-1.848 3.372-1.848 3.604 0 4.27 2.372 4.27 5.455v6.284zM5.337 7.433c-1.145 0-2.073-.928-2.073-2.073 0-1.146.928-2.073 2.073-2.073s2.073.927 2.073 2.073c0 1.145-.928 2.073-2.073 2.073zm1.777 13.019H3.56V9h3.554v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.224.792 24 1.771 24h20.451c.98 0 1.778-.776 1.778-1.729V1.729C24 .774 23.205 0 22.225 0z" />
              </svg>
            </a>
          </div>
        </footer>

        <a
          href="https://drive.google.com/file/d/1d8C33RiAOEV_1q_QDPrWC0uk-i8J4kqO/view?usp=sharing"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-20 right-6 z-50 text-white px-5 py-3 rounded-full shadow-lg transition flex items-center space-x-2 select-none"
          title={t("downloadResume")}
          download
          style={{ backgroundColor: colors.primary }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = colors.primaryDark)}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = colors.primary)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12v8m0 0l-4-4m4 4l4-4M12 4v8"
            />
          </svg>
          <span>{t("downloadResume")}</span>
        </a>
      </div>
    </>
  );
}
