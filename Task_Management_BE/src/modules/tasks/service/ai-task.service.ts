import {
  BadGatewayException,
  HttpException,
  HttpStatus,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, Type } from '@google/genai';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ProjectAccessService } from '../../../common/access/project-access.service';
import { AiTaskDraftDto } from '../dto/ai-task.dto';
import {
  buildTaskDescriptionPrompt,
  buildTaskDraftPrompt,
} from '../prompts/ai-task.prompts';

const PRIMARY_MODEL_ID = 'gemini-2.5-flash';
const DEFAULT_FALLBACK_MODEL_ID = 'gemini-2.5-flash-lite';
const ALLOWED_PRIORITIES = new Set(['LOW', 'MEDIUM', 'HIGH']);

@Injectable()
export class AiTaskService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly projectAccessService: ProjectAccessService,
  ) {}

  async generateTaskDraft(
    userId: string,
    projectId: string,
    prompt: string,
  ): Promise<AiTaskDraftDto> {
    const trimmedPrompt = prompt.trim();
    await this.projectAccessService.ensureProjectMember(userId, projectId);

    const apiKey = this.configService.get<string>('gemini.apiKey');
    if (!apiKey) {
      throw new ServiceUnavailableException('Gemini API key is not configured');
    }

    const projectContext = await this.buildProjectContext(projectId);
    const responseText = await this.callGemini(apiKey, trimmedPrompt, projectContext);
    const parsed = this.parseJson(responseText);
    const sanitized = this.sanitizeDraft(parsed);
    const dto = plainToInstance(AiTaskDraftDto, sanitized);
    const errors = validateSync(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length) {
      throw new BadGatewayException('Gemini returned invalid task JSON');
    }

    return dto;
  }

  async generateTaskDescription(
    title: string,
    description: string,
  ): Promise<{ markdown: string }> {
    const apiKey = this.configService.get<string>('gemini.apiKey');
    if (!apiKey) {
      throw new ServiceUnavailableException('Gemini API key is not configured');
    }

    const markdown = await this.callGeminiMarkdown(
      apiKey,
      buildTaskDescriptionPrompt(title.trim(), description.trim()),
    );
    const sanitized = sanitizeMarkdown(markdown);

    if (!sanitized) {
      throw new BadGatewayException('Gemini returned an empty description');
    }

    return { markdown: sanitized };
  }

  private async buildProjectContext(projectId: string): Promise<string> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        name: true,
        description: true,
        taskStatuses: {
          orderBy: { position: 'asc' },
          select: { name: true, isDone: true },
        },
        taskGroups: {
          orderBy: { position: 'asc' },
          select: { name: true },
        },
        members: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return JSON.stringify({
      name: project?.name ?? '',
      description: project?.description ?? '',
      statuses: project?.taskStatuses ?? [],
      groups: project?.taskGroups ?? [],
      members:
        project?.members.map((member) => ({
          name: member.user.fullName,
          email: member.user.email,
        })) ?? [],
    });
  }

  private async callGemini(
    apiKey: string,
    userPrompt: string,
    projectContext: string,
  ): Promise<string> {
    const ai = new GoogleGenAI({ apiKey });
    const modelIds = this.getModelIds();
    let lastGeminiError: { statusCode: number; message: string; isHighDemand: boolean } | null =
      null;

    for (const modelId of modelIds) {
      try {
      const response = await ai.models.generateContent({
        model: modelId,
        contents: buildTaskDraftPrompt(userPrompt, projectContext),
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              behavior: { type: Type.STRING },
              acceptanceCriteria: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              priority: {
                type: Type.STRING,
                enum: ['LOW', 'MEDIUM', 'HIGH'],
              },
              suggestedSubtasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                  },
                  required: ['title', 'description'],
                },
              },
            },
            required: [
              'title',
              'description',
              'behavior',
              'acceptanceCriteria',
              'priority',
              'suggestedSubtasks',
            ],
          },
          temperature: 0.3,
        },
      });

      if (!response.text) {
        throw new BadGatewayException('Gemini returned an empty response');
      }

      return response.text;
      } catch (error) {
        if (error instanceof BadGatewayException) {
          throw error;
        }

        const geminiError = parseGeminiApiError(error);
        if (geminiError) {
          lastGeminiError = geminiError;
          if (geminiError.isHighDemand && modelId !== modelIds[modelIds.length - 1]) {
            continue;
          }

          throw new HttpException(geminiError.message, geminiError.statusCode);
        }

        throw new BadGatewayException(buildGeminiNetworkMessage(error));
      }
    }

    if (lastGeminiError) {
      throw new HttpException(lastGeminiError.message, lastGeminiError.statusCode);
    }

    throw new BadGatewayException('Gemini did not return a task draft');
  }

  private async callGeminiMarkdown(
    apiKey: string,
    prompt: string,
  ): Promise<string> {
    const ai = new GoogleGenAI({ apiKey });
    const modelIds = this.getModelIds();
    let lastGeminiError: { statusCode: number; message: string; isHighDemand: boolean } | null =
      null;

    for (const modelId of modelIds) {
      try {
        const response = await ai.models.generateContent({
          model: modelId,
          contents: prompt,
          config: {
            responseMimeType: 'text/plain',
            temperature: 0.3,
          },
        });

        if (!response.text) {
          throw new BadGatewayException('Gemini returned an empty response');
        }

        return response.text;
      } catch (error) {
        if (error instanceof BadGatewayException) {
          throw error;
        }

        const geminiError = parseGeminiApiError(error);
        if (geminiError) {
          lastGeminiError = geminiError;
          if (geminiError.isHighDemand && modelId !== modelIds[modelIds.length - 1]) {
            continue;
          }

          throw new HttpException(geminiError.message, geminiError.statusCode);
        }

        throw new BadGatewayException(buildGeminiNetworkMessage(error));
      }
    }

    if (lastGeminiError) {
      throw new HttpException(lastGeminiError.message, lastGeminiError.statusCode);
    }

    throw new BadGatewayException('Gemini did not return a description');
  }

  private getModelIds(): string[] {
    const fallbackModel = this.configService
      .get<string>('gemini.fallbackModel')
      ?.trim();
    const resolvedFallbackModel = fallbackModel || DEFAULT_FALLBACK_MODEL_ID;

    return resolvedFallbackModel && resolvedFallbackModel !== PRIMARY_MODEL_ID
      ? [PRIMARY_MODEL_ID, resolvedFallbackModel]
      : [PRIMARY_MODEL_ID];
  }

  private parseJson(responseText: string): unknown {
    try {
      return JSON.parse(responseText);
    } catch {
      throw new BadGatewayException('Gemini returned invalid JSON');
    }
  }

  private sanitizeDraft(rawDraft: unknown): Record<string, unknown> {
    if (!rawDraft || typeof rawDraft !== 'object' || Array.isArray(rawDraft)) {
      throw new BadGatewayException('Gemini returned invalid task JSON');
    }

    const draft = rawDraft as Record<string, unknown>;
    const priority = String(draft.priority ?? 'MEDIUM').trim().toUpperCase();

    return {
      title: cleanText(draft.title, 255),
      description: cleanText(draft.description, 8000),
      behavior: cleanText(draft.behavior, 8000),
      acceptanceCriteria: cleanStringArray(draft.acceptanceCriteria, 7),
      priority: ALLOWED_PRIORITIES.has(priority) ? priority : 'MEDIUM',
      suggestedSubtasks: cleanSubtasks(draft.suggestedSubtasks),
    };
  }
}

function cleanText(value: unknown, maxLength: number): string {
  return String(value ?? '')
    .replace(/\u0000/g, '')
    .trim()
    .slice(0, maxLength);
}

function cleanStringArray(value: unknown, maxItems: number): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => cleanText(item, 1000))
    .filter(Boolean)
    .slice(0, maxItems);
}

function cleanSubtasks(value: unknown): Array<{ title: string; description: string }> {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return null;
      }

      const subtask = item as Record<string, unknown>;
      const title = cleanText(subtask.title, 255);
      if (!title) return null;

      return {
        title,
        description: cleanText(subtask.description, 4000),
      };
    })
    .filter((item): item is { title: string; description: string } => Boolean(item))
    .slice(0, 6);
}

function parseGeminiApiError(
  error: unknown,
): { statusCode: number; message: string; isHighDemand: boolean } | null {
  const rawMessage = error instanceof Error ? error.message : String(error ?? '');

  try {
    const payload = JSON.parse(rawMessage) as {
      error?: {
        code?: number;
        message?: string;
        status?: string;
      };
    };
    const geminiError = payload.error;
    if (!geminiError?.message) return null;

    const statusCode =
      geminiError.code && geminiError.code >= 400 && geminiError.code < 600
        ? geminiError.code
        : HttpStatus.BAD_GATEWAY;

    return {
      statusCode,
      message: `Gemini error: ${geminiError.message}`,
      isHighDemand:
        statusCode === HttpStatus.SERVICE_UNAVAILABLE ||
        geminiError.status === 'UNAVAILABLE' ||
        /high demand|try again later/i.test(geminiError.message),
    };
  } catch {
    return null;
  }
}

function buildGeminiNetworkMessage(error: unknown): string {
  const cause = (error as { cause?: { code?: string; message?: string } })?.cause;
  const causeText = cause?.code || cause?.message;

  return [
    'Cannot connect to Gemini. Check backend internet access, proxy settings, and GEMINI_API_KEY.',
    causeText ? `Cause: ${causeText}` : '',
  ]
    .filter(Boolean)
    .join(' ');
}

function sanitizeMarkdown(value: string): string {
  return value
    .replace(/\u0000/g, '')
    .replace(/^```(?:markdown|md)?\s*/i, '')
    .replace(/```$/i, '')
    .trim()
    .slice(0, 12000);
}
