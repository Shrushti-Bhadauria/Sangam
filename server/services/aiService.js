const { db } = require('../config/database');

class AIService {
  /**
   * Process chatbot request with context awareness and multilingual support
   */
  async chat({ message, user, language = 'en' }) {
    if (!message || !message.trim()) {
      return { response: 'Please enter a question or speak your query.' };
    }

    const query = message.trim().toLowerCase();

    // 1. Gather authenticated user context securely
    let citizenContext = null;
    let applicationsContext = [];
    let consentsContext = [];
    let notificationsContext = [];

    if (user && user.role === 'CITIZEN') {
      const citizen = db.get('SELECT * FROM citizens WHERE userId = ?', [user.id]);
      if (citizen) {
        citizenContext = citizen;
        applicationsContext = db.all('SELECT * FROM applications WHERE citizenId = ? ORDER BY updatedAt DESC', [citizen.id]);
        consentsContext = db.all("SELECT * FROM consents WHERE citizenId = ? AND status = 'PENDING'", [citizen.id]);
        notificationsContext = db.all('SELECT * FROM notifications WHERE userId = ? AND read = 0', [user.id]);
      }
    }

    // Check if an external LLM key is configured (Gemini or OpenAI)
    if (process.env.GEMINI_API_KEY) {
      try {
        const externalResponse = await this.callGeminiAPI({
          message,
          user,
          citizenContext,
          applicationsContext,
          consentsContext,
          language
        });
        if (externalResponse) return { response: externalResponse };
      } catch (err) {
        console.warn('Gemini API call failed, falling back to built-in Sangam Sahayak engine:', err.message);
      }
    }

    // 2. Built-in Context-Aware Multi-lingual Sangam Sahayak Engine
    return {
      response: this.generateSmartResponse({
        query,
        message,
        user,
        citizenContext,
        applicationsContext,
        consentsContext,
        notificationsContext,
        language
      })
    };
  }

  generateSmartResponse({ query, message, user, citizenContext, applicationsContext, consentsContext, notificationsContext, language }) {
    const isMr = language === 'mr' || query.includes('काय') || query.includes('माझा') || query.includes('अर्ज') || query.includes('संगम');
    const isHi = language === 'hi' || query.includes('क्या') || query.includes('मेरा') || query.includes('आवेदन') || query.includes('संगम');

    // Intent: Application Status check
    if (query.includes('status') || query.includes('scholarship') || query.includes('application') || query.includes('अर्ज') || query.includes('स्थिति') || query.includes('स्टेटस')) {
      if (!user) {
        if (isMr) return 'तुमच्या अर्जाची स्थिती जाणून घेण्यासाठी कृपया आधी संगम पोर्टलवर लॉगिन करा.';
        if (isHi) return 'अपने आवेदन की स्थिति जानने के लिए कृपया पहले संगम पोर्टल पर लॉगिन करें.';
        return 'To check your application status, please log in to the Sangam portal. Authenticated citizens can view real-time status across all departments.';
      }

      if (applicationsContext.length === 0) {
        if (isMr) return `नमस्कार ${citizenContext ? citizenContext.fullName : user.name}, तुमच्या नावावर सध्या कोणताही अर्ज नोंदणीकृत नाही. तुम्ही "नवीन अर्ज" मेनूवरून शिष्यवृत्तीसाठी अर्ज करू शकता.`;
        if (isHi) return `नमस्ते ${citizenContext ? citizenContext.fullName : user.name}, आपके खाते में वर्तमान में कोई सक्रिय आवेदन नहीं है. आप "नया आवेदन" विकल्प से छात्रवृत्ति के लिए आवेदन कर सकते हैं.`;
        return `Hello ${citizenContext ? citizenContext.fullName : user.name}, you currently have no active applications. You can start a new Scholarship application from the "Apply for Scholarship" button on your dashboard.`;
      }

      const latest = applicationsContext[0];
      const stageDesc = latest.remarks || latest.currentStage;
      if (isMr) {
        return `तुमचा अर्ज क्रमांक **${latest.applicationNumber}** (${latest.serviceType}) सध्या **${latest.status}** स्थितीत आहे. सद्य टप्पा: ${stageDesc}. महसूल विभागाकडून उत्पन्न दाखला पडताळणी स्वयंचलितरीत्या पूर्ण झाली आहे.`;
      }
      if (isHi) {
        return `आपका आवेदन क्रमांक **${latest.applicationNumber}** (${latest.serviceType}) वर्तमान में **${latest.status}** स्थिति में है. वर्तमान चरण: ${stageDesc}. राजस्व विभाग से आय प्रमाण पत्र का सत्यापन स्वचालित रूप से किया गया है.`;
      }
      return `Your application **${latest.applicationNumber}** for "${latest.serviceType}" is currently in status **${latest.status}** (Stage: ${latest.currentStage}). Remarks: "${latest.remarks || 'Under processing'}".`;
    }

    // Intent: Sangam ID check
    if (query.includes('sangam id') || query.includes('my id') || query.includes('संगम आयडी') || query.includes('पहचान') || query.includes('आईडी')) {
      if (citizenContext) {
        if (isMr) return `तुमचा युनिफाइड संगम आयडी आहे: **${citizenContext.sangamId}**. हा आयडी उच्च शिक्षण, महसूल, आणि समाज कल्याण विभागांशी सुरक्षितपणे जोडलेला आहे.`;
        if (isHi) return `आपका एकीकृत संगम आईडी है: **${citizenContext.sangamId}**. यह आईडी उच्च शिक्षा, राजस्व, और समाज कल्याण विभागों से सुरक्षित रूप से संबद्ध है.`;
        return `Your Unified Sangam ID is **${citizenContext.sangamId}**. This identity connects your Education (MahaDBT), Revenue (MahaBhumi), and Welfare records without requiring duplicate paper submissions.`;
      }
      return 'Please log in as a citizen to view your assigned Sangam ID.';
    }

    // Intent: Consent explanation
    if (query.includes('consent') || query.includes('permission') || query.includes('संमती') || query.includes('सहमति') || query.includes('परमिशन')) {
      if (consentsContext.length > 0) {
        const c = consentsContext[0];
        if (isMr) return `तुमच्याकडे **${c.requestedBy}** कडून एक प्रलंबित संमती विनंती आहे (उद्देश: ${c.purpose}). कृपया तुमच्या "संमती केंद्र (Consent Center)" मध्ये जाऊन ती मंजूर करा.`;
        if (isHi) return `आपके पास **${c.requestedBy}** से एक लंबित सहमति अनुरोध है (उद्देश्य: ${c.purpose}). कृपया अपने "सहमति केंद्र (Consent Center)" में जाकर इसे स्वीकृत करें.`;
        return `You have a pending consent request from **${c.requestedBy}** for "${c.purpose}". Once you approve it in the Consent Center, Sangam will automatically fetch your required verified records.`;
      }
      if (isMr) return 'संगम प्लॅटफॉर्मवर नागरिकांची गोपनीयता सर्वोच्च आहे. जोपर्यंत तुम्ही स्पष्ट संमती (Consent) देत नाही, तोपर्यंत कोणताही विभाग दुसऱ्या विभागाकडून तुमचा डेटा घेऊ शकत नाही. तुम्ही कधीही तुमची संमती मागे (Revoke) घेऊ शकता.';
      if (isHi) return 'संगम प्लेटफॉर्म पर नागरिक की गोपनीयता सर्वोपरि है. जब तक आप स्पष्ट सहमति नहीं देते, कोई भी विभाग दूसरे विभाग से आपका डेटा नहीं ले सकता. आप कभी भी अपनी सहमति वापस ले सकते हैं.';
      return 'In Sangam, Citizen Consent is mandatory. Government departments can only access your records (e.g., Revenue income certificate) after you review what is being shared, why it is needed, and approve it. You retain full control and can revoke access anytime.';
    }

    // Intent: How to apply / Documents required
    if (query.includes('how to apply') || query.includes('document') || query.includes('कसा अर्ज करावा') || query.includes('कागदपत्रे') || query.includes('दस्तावेज') || query.includes('आवेदन कैसे करें')) {
      if (isMr) {
        return 'शिष्यवृत्तीसाठी अर्ज करण्याची पायरी अतिशय सोपी आहे:\n1. डॅशबोर्डवर "शिष्यवृत्तीसाठी अर्ज करा" वर क्लिक करा.\n2. संगम प्रणाली महसूल विभागाकडून तुमचा डिजिटल उत्पन्न दाखला मागण्यासाठी संमती मागेल.\n3. तुम्ही संमती मंजूर केल्यावर, प्रणाली आपोआप दाखला पडताळणी करेल.\n4. तुम्हाला कोणतेही कागदपत्र स्कॅन करून पुन्हा पुन्हा अपलोड करण्याची आवश्यकता नाही!';
      }
      if (isHi) {
        return 'छात्रवृत्ति के लिए आवेदन करना बहुत आसान है:\n1. डैशबोर्ड पर "छात्रवृत्ति के लिए आवेदन करें" पर क्लिक करें.\n2. संगम प्रणाली राजस्व विभाग से आपका डिजिटल आय प्रमाण पत्र प्राप्त करने के लिए सहमति मांगेगी.\n3. आपके द्वारा सहमति स्वीकृत किए जाने के बाद, प्रणाली स्वचालित रूप से प्रमाण पत्र सत्यापित करेगी.\n4. आपको बार-बार दस्तावेज अपलोड करने की आवश्यकता नहीं है!';
      }
      return 'To apply for a scholarship in Sangam:\n1. Click "Apply for Scholarship" on your dashboard.\n2. Sangam resolves your identity and presents a Consent Request to verify income with the Revenue Department.\n3. Upon your approval, the Revenue connector directly fetches and validates your digital certificate.\n4. Zero paper uploads are required because interoperable government connectors share authentic data directly!';
    }

    // Intent: What is Sangam / How does it work
    if (query.includes('what is sangam') || query.includes('संगम काय आहे') || query.includes('संगम क्या है') || query.includes('interoperability') || query.includes('how does sangam connect')) {
      if (isMr) {
        return 'संगम हा महाराष्ट्र शासनाच्या विविध डिजिटल सेवांमध्ये (शिक्षण, महसूल, समाज कल्याण, नागरिक नोंदणी) आंतरकार्यक्षमता (Interoperability) निर्माण करणारा एकात्मिक प्लॅटफॉर्म आहे. "एक नागरिक. जोडलेल्या सेवा. एक अखंड प्रवास" हे याचे ब्रीदवाक्य आहे.';
      }
      if (isHi) {
        return 'संगम महाराष्ट्र सरकार के विभिन्न डिजिटल प्लेटफार्मों (शिक्षा, राजस्व, समाज कल्याण, नागरिक रजिस्ट्री) के बीच अंतरसंचालनीयता (Interoperability) स्थापित करने वाला एकीकृत समाधान है. "एक नागरिक. जुड़ी सेवाएं. एक एकीकृत यात्रा".';
      }
      return 'SANGAM is the Government of Maharashtra\'s Interoperability & Integration Platform for Smart India Hackathon 2026 (Problem Statement 129). It unifies fragmented government portals through Identity Resolution, Consent Management, Canonical Data Mapping, and Department Connectors—delivering a seamless, paperless citizen journey.';
    }

    // Intent: Notifications check
    if (query.includes('notification') || query.includes('सूचना') || query.includes('अलर्ट')) {
      if (notificationsContext && notificationsContext.length > 0) {
        const top = notificationsContext[0];
        if (isMr) return `तुमच्याकडे ${notificationsContext.length} न वाचलेल्या सूचना आहेत. नवीन सूचना: "${top.title} - ${top.message}"`;
        if (isHi) return `आपके पास ${notificationsContext.length} अपठित सूचनाएं हैं. नवीनतम सूचना: "${top.title} - ${top.message}"`;
        return `You have ${notificationsContext.length} unread notification(s). Latest: "${top.title}: ${top.message}"`;
      }
      if (isMr) return 'तुमच्याकडे सध्या कोणतीही नवीन सूचना नाही.';
      if (isHi) return 'वर्तमान में आपके पास कोई नई सूचना नहीं है.';
      return 'You currently have no unread notifications.';
    }

    // Fallback general guidance
    if (isMr) {
      return `मी संगम सहाय्यक आहे. मी तुम्हाला शिष्यवृत्ती अर्ज, उत्पन्न दाखला पडताळणी, संमती व्यवस्थापन आणि अर्जाच्या स्थितीबद्दल माहिती देऊ शकतो. मला विचारा: "माझ्या अर्जाची स्थिती काय आहे?" किंवा "संमती म्हणजे काय?".`;
    }
    if (isHi) {
      return `मैं संगम सहायक हूँ. मैं आपको छात्रवृत्ति आवेदन, आय प्रमाण पत्र सत्यापन, सहमति प्रबंधन और आवेदन की स्थिति के बारे में जानकारी दे सकता हूँ. मुझसे पूछें: "मेरे आवेदन की स्थिति क्या है?" या "सहमति क्या है?".`;
    }
    return `I am Sangam Sahayak, your AI assistant for Maharashtra Government digital services. I can assist you with scholarship applications, automatic document verification, consent permissions, and real-time status tracking. You can ask: "What is my application status?", "What is my Sangam ID?", or "How does consent work?".`;
  }

  async callGeminiAPI({ message, user, citizenContext, applicationsContext, consentsContext, language }) {
    // Standard Gemini REST call if GEMINI_API_KEY is available
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const systemPrompt = `You are Sangam Sahayak, an official, courteous, and highly knowledgeable AI Assistant for the Maharashtra Government's SANGAM Interoperability Platform (SIH 2026 Problem Statement 129).
Role: Explain government interoperability, scholarship workflows, identity resolution, and citizen consent.
Current User Context:
${user ? `User: ${user.name} (${user.email}), Role: ${user.role}` : 'Anonymous visitor'}
${citizenContext ? `Sangam ID: ${citizenContext.sangamId}, District: ${citizenContext.district}` : ''}
${applicationsContext && applicationsContext.length > 0 ? `Active Applications: ${JSON.stringify(applicationsContext)}` : 'No active applications'}
${consentsContext && consentsContext.length > 0 ? `Pending Consents: ${JSON.stringify(consentsContext)}` : 'No pending consents'}
Target Language: ${language === 'mr' ? 'Marathi' : language === 'hi' ? 'Hindi' : 'English'}.
Keep responses concise, clear, and direct.`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser Question: ${message}` }] }
        ],
        generationConfig: { maxOutputTokens: 300, temperature: 0.2 }
      })
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  }
}

module.exports = new AIService();
