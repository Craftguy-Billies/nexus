import { config } from '../config';
import OpenAI from 'openai';
import { AICharacter } from '@prisma/client';
import { PersonalityProfile, ResponseStyle } from '../types';

export interface ImageAnalysisResult {
  description: string;
  objects: string[];
  scene: string;
  mood: string;
  tags: string[];
  rawAnalysis: string;
}

export interface AIImageCommentResult {
  comment: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * Vision Service — handles image content recognition.
 *
 * Current implementation uses NVIDIA NIM (which supports vision models)
 * or can be swapped for any OpenAI-compatible vision API.
 *
 * You can also replace analyzeImage() with an on-device model
 * (e.g., MobileNet, YOLO) that runs directly on the user's phone
 * — just return the same ImageAnalysisResult shape.
 */
export class VisionService {
  private getClient(): OpenAI {
    const provider = config.ai.provider;
    if (provider === 'nvidia') {
      return new OpenAI({
        apiKey: config.ai.nvidiaApiKey,
        baseURL: config.ai.nvidiaBaseUrl,
      });
    }
    return new OpenAI({ apiKey: config.ai.openaiApiKey });
  }

  /**
   * Analyze an image and return structured content description.
   *
   * STUB: Replace this with your preferred vision model.
   * Options:
   *   1. Cloud API (NVIDIA NIM vision, OpenAI GPT-4o, Google Vision)
   *   2. On-device model (MobileNet, YOLO, Core ML, TFLite)
   *   3. Hybrid: on-device for basic tags, cloud for detailed analysis
   *
   * The function should always return an ImageAnalysisResult.
   */
  async analyzeImage(imageUrl: string): Promise<ImageAnalysisResult> {
    try {
      const client = this.getClient();
      const model = config.ai.nvidiaModel || config.ai.defaultModel;

      const response = await client.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: `You are an image analysis assistant. Analyze the image and return a JSON object with these fields:
- description: A natural 1-2 sentence description of what's in the image
- objects: Array of main objects/subjects detected (e.g., ["dog", "park", "frisbee"])
- scene: The overall scene type (e.g., "outdoor park", "restaurant", "selfie", "sunset")
- mood: The emotional mood of the image (e.g., "joyful", "serene", "energetic", "cozy")
- tags: Array of relevant hashtag-style tags without # (e.g., ["nature", "photography", "golden_hour"])

Return ONLY valid JSON, no other text.`,
          },
          {
            role: 'user',
            content: `Analyze this image: ${imageUrl}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 512,
      });

      const content = response.choices[0]?.message?.content || '';
      const parsed = this.parseAnalysisResponse(content);
      return { ...parsed, rawAnalysis: content };
    } catch (err) {
      console.error('Image analysis failed:', err);
      return this.fallbackAnalysis(imageUrl);
    }
  }

  /**
   * Generate an AI character's comment about an image based on what it "sees".
   * Combines image analysis with the character's personality.
   */
  async generateImageComment(
    character: AICharacter,
    imageUrl: string,
    postCaption?: string
  ): Promise<AIImageCommentResult> {
    const analysis = await this.analyzeImage(imageUrl);
    const personality = character.personalityProfile as unknown as PersonalityProfile;
    const style = character.responseStyle as unknown as ResponseStyle;

    const client = this.getClient();
    const model = config.ai.defaultModel;

    const systemPrompt = `You are ${character.displayName}, a social media user.
Your personality: ${personality.humor > 70 ? 'witty and humorous' : 'genuine and thoughtful'}.
Your tone is ${style.tone || 'friendly'} and ${style.verbosity === 'concise' ? 'brief' : 'expressive'}.
${style.emojiUsage === 'frequent' ? 'You use emojis freely.' : style.emojiUsage === 'minimal' ? 'You rarely use emojis.' : 'You never use emojis.'}
Your interests: ${character.interests.join(', ')}.

Write a short comment on this image post as yourself. Stay in character.
NEVER mention you are an AI. Comment like a real social media user would.`;

    const imageContext = `Image shows: ${analysis.description}
Objects: ${analysis.objects.join(', ')}
Scene: ${analysis.scene}
Mood: ${analysis.mood}
${postCaption ? `Caption: "${postCaption}"` : ''}

Write a brief, natural comment on this post.`;

    try {
      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: imageContext },
        ],
        temperature: 0.8,
        max_tokens: 256,
      });

      const usage = response.usage;
      return {
        comment: response.choices[0]?.message?.content || 'Love this!',
        model,
        promptTokens: usage?.prompt_tokens || 0,
        completionTokens: usage?.completion_tokens || 0,
        totalTokens: usage?.total_tokens || 0,
      };
    } catch (err) {
      console.error('Image comment generation failed:', err);
      return {
        comment: this.getFallbackComment(personality),
        model: 'fallback',
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      };
    }
  }

  /**
   * Auto-tag a post based on its image content.
   * Returns suggested hashtags from image analysis.
   */
  async suggestTags(imageUrl: string): Promise<string[]> {
    const analysis = await this.analyzeImage(imageUrl);
    return analysis.tags.map((tag) => `#${tag}`);
  }

  private parseAnalysisResponse(content: string): Omit<ImageAnalysisResult, 'rawAnalysis'> {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          description: parsed.description || 'Image content',
          objects: Array.isArray(parsed.objects) ? parsed.objects : [],
          scene: parsed.scene || 'general',
          mood: parsed.mood || 'neutral',
          tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        };
      }
    } catch {
      // parse failed
    }
    return this.extractFromText(content);
  }

  private extractFromText(text: string): Omit<ImageAnalysisResult, 'rawAnalysis'> {
    return {
      description: text.slice(0, 200) || 'Image content',
      objects: [],
      scene: 'general',
      mood: 'neutral',
      tags: [],
    };
  }

  private fallbackAnalysis(_imageUrl: string): ImageAnalysisResult {
    return {
      description: 'Image content (analysis unavailable)',
      objects: [],
      scene: 'unknown',
      mood: 'neutral',
      tags: [],
      rawAnalysis: 'Vision model not available — using fallback',
    };
  }

  private getFallbackComment(personality: PersonalityProfile): string {
    const comments = personality.humor > 70
      ? ['This is amazing! 🔥', 'Obsessed with this!', 'Okay this goes hard 😍']
      : ['Love this!', 'Great shot!', 'This is beautiful.', 'Really nice!'];
    return comments[Math.floor(Math.random() * comments.length)];
  }
}

export const visionService = new VisionService();
