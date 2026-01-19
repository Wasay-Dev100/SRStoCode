const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

class SRSManager {
    constructor(context) {
        this.context = context;
        this.parsedSRS = null;
    }

    async parseSRS(fileUri) {
        try {
            const fileContent = await vscode.workspace.fs.readFile(fileUri);
            const filePath = fileUri.fsPath;
            const fileExtension = path.extname(filePath).toLowerCase();
            
            let functionalities = [];
            
            if (fileExtension === '.pdf') {
                const base64Content = Buffer.from(fileContent).toString('base64');
                functionalities = await this.parsePDFWithLLM(base64Content, path.basename(filePath));
            } else if (fileExtension === '.txt') {
                const textContent = Buffer.from(fileContent).toString('utf8');
                functionalities = await this.extractFunctionalitiesFromText(textContent);
            } else if (fileExtension === '.docx') {
                const textContent = await this.extractTextFromDocx(fileContent);
                functionalities = await this.extractFunctionalitiesFromText(textContent);
            } else {
                const textContent = Buffer.from(fileContent).toString('utf8');
                functionalities = await this.extractFunctionalitiesFromText(textContent);
            }
            
            if (functionalities.length === 0) {
                throw new Error('No functionalities found in SRS document. Please ensure the document contains functional requirements.');
            }
            
            this.parsedSRS = {
                content: Buffer.from(fileContent).toString('utf8'),
                functionalities: functionalities
            };
            
            return this.parsedSRS;
        } catch (error) {
            throw new Error(`Failed to parse SRS: ${error.message}`);
        }
    }

    async parsePDFWithLLM(base64Content, filename) {
        try {
            const pdfParse = require('pdf-parse');
            const buffer = Buffer.from(base64Content, 'base64');
            const data = await pdfParse(buffer);
            const pdfText = data.text;
            
            if (pdfText && pdfText.length > 100) {
                return await this.extractFunctionalitiesFromText(pdfText);
            } else {
                return await this.extractFunctionalitiesFromBase64(base64Content);
            }
        } catch (error) {
            console.log('PDF parsing failed, trying base64 approach:', error.message);
            return await this.extractFunctionalitiesFromBase64(base64Content);
        }
    }

    async extractTextFromDocx(fileContent) {
        try {
            const mammoth = require('mammoth');
            const result = await mammoth.extractRawText({ buffer: fileContent });
            return result.value;
        } catch (error) {
            throw new Error(`Failed to extract text from DOCX: ${error.message}`);
        }
    }

    async extractFunctionalitiesFromText(text) {
        const config = vscode.workspace.getConfiguration('kinmail');
        const apiKey = config.get('openaiApiKey');
        
        if (!apiKey) {
            throw new Error('OpenAI API key not configured. Please set it in VS Code settings.');
        }

        const textChunks = this.splitTextIntoChunks(text, 8000);
        const allFunctionalities = [];
        
        for (let i = 0; i < textChunks.length; i++) {
            const prompt = `You are an expert SRS analyst. Extract functionality packets from this SRS document text.

CRITICAL INSTRUCTIONS:
- Return ONLY a valid JSON array
- No explanations, no markdown, no additional text
- If no functionalities found in this chunk, return: []
- Each functionality must be a complete, implementable feature
- Look for functional requirements, use cases, system features

REQUIRED JSON FORMAT:
[
  {
    "name": "Feature Name (e.g., Student Registration)",
    "description": "Detailed description of what this feature does",
    "useCases": ["Specific use case 1", "Specific use case 2"],
    "activityDiagrams": ["Workflow description 1", "Process flow 2"],
    "context": "Additional context, diagrams, or related information",
    "requirements": ["Requirement 1", "Requirement 2", "Requirement 3"],
    "dependencies": ["Other feature 1", "Other feature 2"]
  }
]

SRS TEXT CHUNK ${i + 1}/${textChunks.length}:
${textChunks[i]}

EXTRACT FUNCTIONALITIES FROM THIS TEXT:`;

            try {
                const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                    model: 'gpt-4-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an expert software analyst. Extract functionalities from SRS documents and return structured JSON.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 4000
                }, {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                });

                let jsonContent = response.data.choices[0].message.content.trim();
                
                if (jsonContent.includes('```json')) {
                    jsonContent = jsonContent.replace(/```json\s*/, '').replace(/\s*```$/, '');
                } else if (jsonContent.includes('```')) {
                    jsonContent = jsonContent.replace(/```\s*/, '').replace(/\s*```$/, '');
                }
                
                jsonContent = jsonContent.replace(/^```.*$/gm, '').trim();
                
                const functionalities = JSON.parse(jsonContent);
                
                if (Array.isArray(functionalities) && functionalities.length > 0) {
                    allFunctionalities.push(...functionalities);
                }
            } catch (error) {
                console.log(`Error processing text chunk ${i + 1}: ${error.message}`);
            }
        }
        
        return allFunctionalities;
    }

    async extractFunctionalitiesFromBase64(base64Content) {
        const config = vscode.workspace.getConfiguration('kinmail');
        const apiKey = config.get('openaiApiKey');
        
        if (!apiKey) {
            throw new Error('OpenAI API key not configured.');
        }

        const prompt = `You are an expert SRS analyst. Extract functionality packets from this PDF document.

CRITICAL INSTRUCTIONS:
- Return ONLY a valid JSON array
- No explanations, no markdown, no additional text
- Each functionality must be a complete, implementable feature

REQUIRED JSON FORMAT:
[
  {
    "name": "Feature Name",
    "description": "Detailed description",
    "useCases": ["Use case 1", "Use case 2"],
    "activityDiagrams": [],
    "context": "",
    "requirements": ["Req 1", "Req 2"],
    "dependencies": []
  }
]

BASE64 PDF CONTENT (first 10000 chars):
${base64Content.substring(0, 10000)}...

EXTRACT FUNCTIONALITIES:`;

        try {
            const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: 'gpt-4-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert software analyst. Extract functionalities from SRS documents.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 4000
            }, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            let jsonContent = response.data.choices[0].message.content.trim();
            
            if (jsonContent.includes('```json')) {
                jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (jsonContent.includes('```')) {
                jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }
            
            const functionalities = JSON.parse(jsonContent);
            return Array.isArray(functionalities) ? functionalities : [];
        } catch (error) {
            console.log(`Error processing base64 content: ${error.message}`);
            return [];
        }
    }

    splitTextIntoChunks(text, chunkSize) {
        const chunks = [];
        const lines = text.split('\n');
        let currentChunk = '';
        
        for (const line of lines) {
            if (currentChunk.length + line.length > chunkSize && currentChunk.length > 0) {
                chunks.push(currentChunk.trim());
                currentChunk = line;
            } else {
                currentChunk += (currentChunk ? '\n' : '') + line;
            }
        }
        
        if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
        }
        
        return chunks;
    }

    async getAvailableFeatures() {
        if (!this.parsedSRS) {
            return [];
        }
        
        return this.parsedSRS.functionalities.map(func => ({
            id: func.name?.toLowerCase().replace(/[^a-z0-9]/g, '-') || `feature-${Math.random().toString(36).substr(2, 9)}`,
            title: func.name || 'Untitled Feature',
            description: func.description || '',
            useCases: func.useCases || [],
            requirements: func.requirements || [],
            context: func.context || '',
            dependencies: func.dependencies || [],
            activityDiagrams: func.activityDiagrams || []
        }));
    }
}

module.exports = { SRSManager };











