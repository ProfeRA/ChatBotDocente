const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

module.exports = async function handler(req, res) {
  // 1. Permitir solo peticiones de tipo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Utilizá POST.' });
  }

  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Debe proporcionar una consulta.' });
    }

    // 2. Leer el archivo del estatuto desde la raíz del proyecto
    const filePath = path.join(process.cwd(), 'estatuto.md');
    const estatutoText = fs.readFileSync(filePath, 'utf8');

    // 3. Inicializar el cliente de Gemini usando la API Key guardada en la variable de entorno
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // 4. Configurar el System Instruction con el texto del Estatuto y llamar al modelo
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      config: {
        systemInstruction: `Sos un asesor legal especialista en el Estatuto del Docente de la Provincia de Buenos Aires (Ley 10.579, Dec. 2485/92 y modificatorias).

REGLAS DE RESPUESTA:
1. Respondé ÚNICAMENTE con la información contenida en el documento de referencia provisto abajo.
2. Citá SIEMPRE de forma explícita el Número de Artículo, Inciso y Capítulo correspondiente en cada respuesta.
3. Si la pregunta del docente no está contemplada en el Estatuto o no se puede responder con el texto provisto, indicá amablemente: "Esa consulta no se encuentra regulada expresamente en el texto del Estatuto provisto."
4. Mantené un lenguaje claro, profesional, directo y accesible para un docente o directivo.

DOCUMENTO BASE DE CONSULTA:
${estatutoText}`,
      },
      contents: message,
    });

    // 5. Devolver la respuesta generada al frontend
    return res.status(200).json({ reply: response.text });

  } catch (error) {
    console.error('Error en api/chat:', error);
    return res.status(500).json({ error: 'Ocurrió un error al procesar la consulta en el servidor.' });
  }
};