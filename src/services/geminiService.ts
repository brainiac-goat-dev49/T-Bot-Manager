import { GoogleGenAI } from "@google/genai";
import { BotCommand, BotAIConfig, BotIntegrationsConfig } from "../types";

// Initialize Gemini directly in the frontend as per AI Studio guidelines
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const geminiService = {
  async generateResponse(
    userMessage: string,
    botName: string,
    botDescription: string,
    botCommands: BotCommand[],
    aiConfig?: BotAIConfig
  ): Promise<string> {
    // Default Fallbacks
    const isReasoning = aiConfig?.useReasoning || false;
    const useSearch = aiConfig?.useSearch || false;
    // Use user provided instruction, or fallback to default constructed one
    const customInstruction = aiConfig?.systemInstruction || "";
    const knowledgeBase = aiConfig?.knowledgeBase || "";
    const trainingUrls = aiConfig?.trainingUrls || [];
    
    // Model Selection - Updated to recommended models from gemini-api skill
    const modelName = isReasoning ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview';

    const commandList = botCommands.length > 0 
      ? botCommands.map(c => `/${c.command} - ${c.description}`).join('\n')
      : "No commands defined.";

    const baseSystemInstruction = `You are a Telegram Bot named ${botName}. 
    Your description is: "${botDescription}". 
    
    [COMMANDS ACCESS]
    You have access to the following commands:
    ${commandList}
    
    [KNOWLEDGE BASE]
    Use the following information to answer user questions:
    ${knowledgeBase}
    
    [REFERENCE LINKS]
    ${trainingUrls.length > 0 ? "Refer to these links if needed:" + trainingUrls.join(', ') : ""}

    [STRICT BEHAVIOR RULES]
    1. **Command Suggestions:** Do NOT list the available commands in every response. ONLY suggest a command if it directly helps solve the user's specific problem or request. If the user's message is just a greeting or general chat, do NOT mention commands.
    2. **Tone:** Be helpful, concise, and professional.
    3. **Fallback:** If you don't know the answer based on the knowledge base, use your general knowledge but mention you are not explicitly trained on that topic.
    4. **Link Formatting:** NEVER format URLs as Markdown links (e.g., [url](url) or [text](url)). ALWAYS output the raw URL directly (e.g., https://example.com) so it renders cleanly.
    `;

    // Combine or use custom override
    const finalSystemInstruction = customInstruction.trim() !== "" 
        ? `${customInstruction}\n\n[CONTEXT INJECTION]\nBot Name: ${botName}\n\n[COMMANDS]\n${commandList}\n\n[KNOWLEDGE BASE]\n${knowledgeBase}\n\n[URLS]\n${trainingUrls.join('\n')}\n\n[RULES]\nOnly suggest commands if they directly address the user's specific request. Do not list them otherwise. Do not use Markdown for URLs; use raw URLs.`
        : baseSystemInstruction;

    // Configure Tools
    const tools: any[] = [];
    if (useSearch) {
        tools.push({ googleSearch: {} });
    }

    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: userMessage,
        config: {
          systemInstruction: finalSystemInstruction,
          tools: tools.length > 0 ? tools : undefined,
        }
      });
      
      return response.text || "I'm thinking, but I have nothing to say right now.";
    } catch (error: any) {
      console.error("Gemini Error:", error);
      return `I encountered an error trying to think of a response: ${error.message}`;
    }
  },

  // Helper to refine the system instruction using AI
  async refineSystemInstruction(currentInstruction: string): Promise<string> {
      try {
          const response = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: `Rewrite the following Telegram Bot system instruction to be more professional, concise, and effective. Keep the core personality but optimize it for an AI model.
              
              Current Instruction:
              "${currentInstruction}"`
          });
          return response.text || currentInstruction;
      } catch (e) {
          console.error("Refine Error", e);
          return currentInstruction;
      }
  },

  // Helper to generate a command structure from a user prompt
  async suggestCommand(userPrompt: string): Promise<BotCommand> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Create a Telegram bot command based on this request: "${userPrompt}". 
            Ensure the 'command' field is a single lowercase word without slashes.
            Ensure the 'response' is a natural, helpful reply the bot would send.
            
            Return ONLY a JSON object with keys: command, description, response.`
        });
        
        const text = response.text;
        if (!text) throw new Error("No response from AI");
        // Extract JSON if model wrapped it in markdown
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : text;
        return JSON.parse(jsonStr) as BotCommand;
    } catch (e) {
        console.error("Command suggestion failed", e);
        throw e;
    }
  },

  // Helper to generate JavaScript code for the scripting editor
  async generateScript(userPrompt: string, availableIntegrations: BotIntegrationsConfig, currentScript: string = ''): Promise<string> {
      // Construct a context string about what tools are available
      const toolsContext = [];
      
      toolsContext.push("### GLOBAL VARIABLES (String Constants available in scope)");
      toolsContext.push("- BOT_TOKEN");
      toolsContext.push("- OPENAI_API_KEY");
      toolsContext.push("- CUSTOM_GEMINI_API_KEY");
      toolsContext.push("- GITHUB_TOKEN");
      toolsContext.push("- HUGGINGFACE_API_KEY");
      toolsContext.push("- GMAIL_EMAIL");
      toolsContext.push("- GMAIL_PASSWORD");
      
      toolsContext.push("\n### LIBRARY FUNCTIONS (Using 'lib')");
      toolsContext.push("Note: 'lib' functions automatically use the saved credentials from Settings. You can OVERRIDE them by passing a config object as the last argument.");
      
      toolsContext.push("- lib.telegram.sendMessage(chatId, text)");
      toolsContext.push("- lib.telegram.getMe()");
      
      toolsContext.push("- lib.openai.chat(prompt, systemPrompt?, { apiKey? }) // Returns string");
      if (availableIntegrations.openai?.enabled) toolsContext.push("  (OpenAI is ENABLED in settings)");
      
      toolsContext.push("- lib.gemini.generate(prompt, { apiKey? }) // Returns string");
      if (availableIntegrations.customGemini?.enabled) toolsContext.push("  (Custom Gemini is ENABLED in settings)");
      
      toolsContext.push("- lib.github.call(path, method?, body?, { token? }) // Returns JSON");
      
      toolsContext.push("- lib.huggingface.infer(input, { apiKey?, endpoint? }) // Returns JSON");
      
      toolsContext.push("- lib.gmail.send(to, subject, body, { email?, appPassword? }) // Returns string");

      const prompt = `
      You are an expert JavaScript developer writing a script for a specific bot runtime environment.
      
      The environment provides a global object 'lib' and global string constants for API keys.
      
      ${toolsContext.join('\n')}
      
      Also 'console.log' is available for debugging.

      Current Code in Editor:
      \`\`\`javascript
      ${currentScript}
      \`\`\`

      User Request: "${userPrompt}"
      
      Task: 
      Analyze the user request. 
      - If they are asking to modify, fix, or extend the current code, return the FULL updated code.
      - If they are asking for a completely new script, return the new code.
      
      Rules:
      1. ONLY return the JavaScript code. Do not wrap in markdown code blocks.
      2. Use 'await' where necessary (top-level await is supported in this runtime).
      3. Add comments explaining the steps.
      4. If the user asks to use a specific key (e.g. "use fetched Gemini key"), utilize the global constant (e.g. CUSTOM_GEMINI_API_KEY) in the function override.
         Example: await lib.gemini.generate("Prompt", { apiKey: CUSTOM_GEMINI_API_KEY });
      5. If the user doesn't specify a key, assume the 'lib' function's default behavior (using saved settings).
      6. Handle errors using try/catch.
      `;

      try {
          const response = await ai.models.generateContent({
              model: 'gemini-3.1-pro-preview',
              contents: prompt
          });
          
          let code = response.text || "// Could not generate code.";
          // Strip markdown code blocks if the model ignores the rule
          code = code.replace(/```javascript/g, '').replace(/```/g, '');
          return code.trim();
      } catch (e) {
          console.error("Code generation failed", e);
          throw e;
      }
  }
};
