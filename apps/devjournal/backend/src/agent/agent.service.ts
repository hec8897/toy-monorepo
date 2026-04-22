import {
  FunctionCallingMode,
  GoogleGenerativeAI,
  SchemaType,
  Tool,
} from '@google/generative-ai';
import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { ConceptConnection, RelationType } from '@devjournal/types';

const MODEL_FALLBACKS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
];

const EXTRACT_CONCEPTS_TOOL: Tool = {
  functionDeclarations: [
    {
      name: 'extract_concepts',
      description:
        '일기 텍스트에서 기술 개념을 추출하고 구조화된 데이터로 반환합니다.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          concepts: {
            type: SchemaType.ARRAY,
            description: '추출된 기술 개념 목록',
            items: {
              type: SchemaType.OBJECT,
              properties: {
                name: {
                  type: SchemaType.STRING,
                  description: '개념명 (영문 권장)',
                },
                category: {
                  type: SchemaType.STRING,
                  format: 'enum',
                  enum: [
                    'language',
                    'framework',
                    'pattern',
                    'principle',
                    'tool',
                    'concept',
                  ],
                  description: '개념 카테고리',
                },
                confidence: {
                  type: SchemaType.NUMBER,
                  description: '신뢰도 (0.0~1.0)',
                },
                description: {
                  type: SchemaType.STRING,
                  description: '한 줄 설명 (한국어)',
                },
                aliases: {
                  type: SchemaType.ARRAY,
                  items: { type: SchemaType.STRING },
                  description: '동의어/약어 목록',
                },
              },
              required: [
                'name',
                'category',
                'confidence',
                'description',
                'aliases',
              ],
            },
          },
          entry_summary: {
            type: SchemaType.STRING,
            description: '일기 전체 요약 (한 문장, 한국어)',
          },
          primary_topic: {
            type: SchemaType.STRING,
            description: '주요 주제 개념명',
          },
        },
        required: ['concepts', 'entry_summary', 'primary_topic'],
      },
    },
  ],
};

const MIN_CONFIDENCE = 0.6;

export interface SimilarConcept {
  id: string;
  name: string;
  category: string;
  similarity: number;
}

export interface SearchConnectionsResult {
  connections: ConceptConnection[];
  cluster_suggestion: string;
}

const SEARCH_CONNECTIONS_TOOL: Tool = {
  functionDeclarations: [
    {
      name: 'search_connections',
      description:
        '새로 추출된 개념과 기존 개념 후보들 사이의 관계를 분류하고 연결 정보를 반환합니다.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          connections: {
            type: SchemaType.ARRAY,
            description: '개념 간 연결 목록',
            items: {
              type: SchemaType.OBJECT,
              properties: {
                from_concept: {
                  type: SchemaType.STRING,
                  description: '출발 개념명',
                },
                to_concept: {
                  type: SchemaType.STRING,
                  description: '도착 개념명',
                },
                strength: {
                  type: SchemaType.NUMBER,
                  description: '연결 강도 (0.1~1.0)',
                },
                relation_type: {
                  type: SchemaType.STRING,
                  format: 'enum',
                  enum: [
                    'is_related_to',
                    'is_prerequisite_of',
                    'is_implementation_of',
                    'is_part_of',
                    'is_alternative_to',
                    'is_opposite_of',
                    'is_used_with',
                  ],
                  description: '관계 유형',
                },
                explanation: {
                  type: SchemaType.STRING,
                  description: '연결 이유 (한국어)',
                },
              },
              required: [
                'from_concept',
                'to_concept',
                'strength',
                'relation_type',
                'explanation',
              ],
            },
          },
          cluster_suggestion: {
            type: SchemaType.STRING,
            description: '이번 학습 클러스터명 (한국어)',
          },
        },
        required: ['connections', 'cluster_suggestion'],
      },
    },
  ],
};

export interface ConceptItem {
  name: string;
  category:
    | 'language'
    | 'framework'
    | 'pattern'
    | 'principle'
    | 'tool'
    | 'concept';
  confidence: number;
  description: string;
  aliases: string[];
}

export interface ExtractConceptsResult {
  concepts: ConceptItem[];
  entry_summary: string;
  primary_topic: string;
}

@Injectable()
export class AgentService implements OnModuleInit {
  private readonly logger = new Logger(AgentService.name);
  private genAI: GoogleGenerativeAI;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const apiKey = this.config.getOrThrow<string>('GEMINI_API_KEY');
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.logger.log(
      `AgentService initialized (fallbacks: ${MODEL_FALLBACKS.join(' → ')})`,
    );
  }

  async extractConcepts(entryContent: string): Promise<ExtractConceptsResult> {
    for (const modelName of MODEL_FALLBACKS) {
      try {
        const model = this.genAI.getGenerativeModel({
          model: modelName,
          tools: [EXTRACT_CONCEPTS_TOOL],
        });

        const result = await model.generateContent({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `다음 개발 일기에서 기술 개념을 추출해주세요.\n\n${entryContent}`,
                },
              ],
            },
          ],
          toolConfig: {
            functionCallingConfig: {
              mode: FunctionCallingMode.ANY,
              allowedFunctionNames: ['extract_concepts'],
            },
          },
        });

        const candidate = result.response.candidates?.[0];
        const functionCall = candidate?.content?.parts?.[0]?.functionCall;

        if (!functionCall || functionCall.name !== 'extract_concepts') {
          throw new Error(
            'extract_concepts function call not returned by model',
          );
        }

        const args = functionCall.args as ExtractConceptsResult;
        this.logger.log(`extractConcepts succeeded with model: ${modelName}`);

        return {
          concepts: args.concepts.filter((c) => c.confidence >= MIN_CONFIDENCE),
          entry_summary: args.entry_summary,
          primary_topic: args.primary_topic,
        };
      } catch (err: unknown) {
        const status = (err as { status?: number }).status;
        if (status === 429) {
          this.logger.warn(
            `${modelName} quota exceeded (429), trying next model...`,
          );
          continue;
        }
        throw err;
      }
    }

    throw new ServiceUnavailableException(
      'All models quota exceeded. Please try again later.',
    );
  }

  async searchConnections(
    newConceptNames: string[],
    candidateConcepts: SimilarConcept[],
  ): Promise<SearchConnectionsResult> {
    if (candidateConcepts.length === 0) {
      return { connections: [], cluster_suggestion: '' };
    }

    const candidateContext = candidateConcepts
      .map(
        (c) =>
          `- ${c.name} (카테고리: ${c.category}, 유사도: ${c.similarity.toFixed(2)})`,
      )
      .join('\n');

    const prompt =
      `새로 학습한 개념: ${newConceptNames.join(', ')}\n\n` +
      `pgvector 유사도 검색으로 찾은 기존 개념 후보:\n${candidateContext}\n\n` +
      `위의 새 개념들과 기존 개념 후보들 사이의 관계를 분석해주세요. ` +
      `관계가 명확한 것만 포함하고, 모호한 것은 제외하세요.`;

    for (const modelName of MODEL_FALLBACKS) {
      try {
        const model = this.genAI.getGenerativeModel({
          model: modelName,
          tools: [SEARCH_CONNECTIONS_TOOL],
        });

        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          toolConfig: {
            functionCallingConfig: {
              mode: FunctionCallingMode.ANY,
              allowedFunctionNames: ['search_connections'],
            },
          },
        });

        const candidate = result.response.candidates?.[0];
        const functionCall = candidate?.content?.parts?.[0]?.functionCall;

        if (!functionCall || functionCall.name !== 'search_connections') {
          throw new Error(
            'search_connections function call not returned by model',
          );
        }

        const args = functionCall.args as {
          connections: (Omit<ConceptConnection, 'relation_type'> & {
            relation_type: RelationType;
          })[];
          cluster_suggestion: string;
        };

        this.logger.log(
          `searchConnections succeeded with model: ${modelName}, connections: ${args.connections.length}개`,
        );

        return {
          connections: args.connections,
          cluster_suggestion: args.cluster_suggestion,
        };
      } catch (err: unknown) {
        const status = (err as { status?: number }).status;
        if (status === 429) {
          this.logger.warn(
            `${modelName} quota exceeded (429), trying next model...`,
          );
          continue;
        }
        throw err;
      }
    }

    throw new ServiceUnavailableException(
      'All models quota exceeded. Please try again later.',
    );
  }
}
