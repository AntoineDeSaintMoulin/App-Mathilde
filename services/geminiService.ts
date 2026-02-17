
import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini AI client using the API key from environment variables as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export type ToneType = 'bienveillant' | 'neutre' | 'structuré';

export const generateReport = async (
  studentName: string,
  comments: string[],
  academicResults: string,
  tone: ToneType
) => {
  const prompt = `
    En tant qu'expert en pédagogie primaire (1MA), rédige un commentaire de bulletin scolaire professionnel et fluide pour l'élève ${studentName}.
    
    INFORMATIONS À ANALYSER :
    1. Progrès qualitatifs (Suivi hebdomadaire) :
    ${comments.map((c, i) => `Semaine ${i + 1}: ${c}`).join('\n')}
    
    2. Résultats quantitatifs par matière (Acquisitions) :
    ${academicResults}

    CONTRAINTES DE RÉDACTION :
    - Ton : ${tone === 'bienveillant' ? 'Très encourageant, chaleureux et protecteur' : tone === 'structuré' ? 'Précis, analytique, factuel et rigoureux' : 'Professionnel, équilibré et bienveillant'}.
    - Style : Professionnel, adapté à un bulletin scolaire, rédigé à la troisième personne.
    - Contenu : Synthétise les réussites académiques et les efforts observés. Met en avant les forces et suggère des axes d'amélioration précis de manière positive.
    - Format : Un paragraphe fluide, pas de listes à puces.
    - Langue : Français de France, soigné.
    - Signature implicite : Enseignante (Mathilde Lits).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.8,
      },
    });

    // Directly access the .text property from GenerateContentResponse
    return response.text;
  } catch (error) {
    console.error("Erreur Gemini:", error);
    throw new Error("Impossible de générer le rapport IA pour le moment.");
  }
};
