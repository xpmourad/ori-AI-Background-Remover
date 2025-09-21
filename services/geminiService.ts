
import { GoogleGenAI, Modality } from "@google/genai";

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // The result includes the Base64 prefix, which we need to remove.
        resolve(reader.result.split(',')[1]);
      } else {
        resolve(''); // Should not happen with readAsDataURL
      }
    };
    reader.readAsDataURL(file);
  });
  const base64Data = await base64EncodedDataPromise;
  return {
    inlineData: {
      data: base64Data,
      mimeType: file.type,
    },
  };
};

export const removeBackground = async (imageFile: File): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const imagePart = await fileToGenerativePart(imageFile);

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image-preview',
    contents: {
      parts: [
        imagePart,
        { text: 'Remove the background of this image. Make the background transparent. Output a PNG file.' },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });
  
  // Find the image part in the response
  const imageResponsePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

  if (imageResponsePart && imageResponsePart.inlineData) {
    return imageResponsePart.inlineData.data;
  }

  // Check for text response which might contain an error or refusal
  const textResponsePart = response.candidates?.[0]?.content?.parts?.find(part => part.text);
  if (textResponsePart && textResponsePart.text) {
      throw new Error(`API returned a text response instead of an image: ${textResponsePart.text}`);
  }
  
  throw new Error("Failed to process the image. The API did not return an image.");
};
