const EmergencyRequest = require('../models/EmergencyRequest');
const EmergencyAnalysis = require('../models/EmergencyAnalysis');
const { GoogleGenAI } = require('@google/genai');

// Fallback configuration if Gemini key is unset or times out during live demo
const aiEngineFallback = {
  priority: "High",
  severity: "Medium",
  confidence: 45,
  reason: "Automated analysis timeout. Shifted to operator manual validation review queue.",
  requires_human_review: true
};

exports.submitRequest = async (req, res) => {
  try {
    const { category, description, people_count, latitude, longitude, landmark } = req.body;
    const user_id = req.user.id; // Pulled dynamically from active JWT authentication

    // 1. Create the persistent database record for the citizen input
    const request = await EmergencyRequest.create({
      user_id, category, description, people_count, latitude, longitude, landmark, status: 'Under Analysis'
    });

    // 2. Format a highly restrictive prompt instructions payload for Gemini
    let aiAnalysisResult = aiEngineFallback;
    
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE') {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `
          You are an advanced emergency dispatch AI triage unit for ResQNet.
          Analyze this crisis report:
          Category: ${category}
          Description: ${description}
          People Impacted: ${people_count}

          Respond with a valid raw JSON object matching the sample block below exactly. Do not provide markdown code wrappers (no \`\`\`json blocks), formatting indicators, or additional contextual prose.

          {
            "priority": "Critical" | "High" | "Medium" | "Low",
            "severity": "High" | "Medium" | "Low",
            "confidence": <integer percentage from 0 to 100>,
            "reason": "1-2 sentence logical justification linking situation descriptions to selected triage values.",
            "requires_human_review": <true if confidence is below 50, otherwise false>
          }
        `;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        let cleanText = response.text.trim();
        if (cleanText.startsWith("```")) {
          cleanText = cleanText.replace(/^```json/, "").replace(/```$/, "").trim();
        }
        aiAnalysisResult = JSON.parse(cleanText);
      } catch (aiErr) {
        console.error("Gemini API processing failure, triggering fallback:", aiErr.message);
      }
    }

    // Ensure the human review flag explicitly forces manual control if confidence dips
    if (aiAnalysisResult.confidence < 50) {
      aiAnalysisResult.requires_human_review = true;
    }

    // 3. Store the AI analysis result alongside the original request record
    await EmergencyAnalysis.create({
      request_id: request.id,
      priority: aiAnalysisResult.priority,
      severity: aiAnalysisResult.severity,
      confidence: aiAnalysisResult.confidence,
      reason: aiAnalysisResult.reason,
      requires_human_review: aiAnalysisResult.requires_human_review
    });

    res.status(201).json({
      message: "Emergency request recorded and analyzed cleanly.",
      requestId: request.id,
      analysis: aiAnalysisResult
    });

  } catch (error) {
    res.status(500).json({ message: "Request initialization loop crashed.", error: error.message });
  }
};

// GET ALL REQUESTS FOR ADMIN GRID VIEW
exports.getAllRequests = async (req, res) => {
  try {
    const requests = await EmergencyRequest.findAll({
      include: ['EmergencyAnalysis'] // Automatically merges analysis details into return data array
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Failed to grab request records.", error: error.message });
  }
};