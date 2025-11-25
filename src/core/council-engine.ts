/**
 * LLM Council Engine
 * Implements the 3-stage workflow: First Opinions → Peer Review → Chairman Synthesis
 */

export interface CouncilMember {
	id: string;
	name: string;
	provider: 'gemini' | 'openai' | 'anthropic' | 'xai';
	model: string;
	apiKey: string;
	role?: 'chairman';
}

export interface OpinionResult {
	memberId: string;
	memberName: string;
	response: string;
	timestamp: number;
}

export interface Ranking {
	anonymousId: string;
	actualMemberId: string;
	rank: number;
	reasoning: string;
}

export interface ReviewResult {
	reviewerId: string;
	reviewerName: string;
	rankings: Ranking[];
	timestamp: number;
}

export interface SynthesisResult {
	chairmanId: string;
	chairmanName: string;
	synthesis: string;
	timestamp: number;
	sources: string[];
}

export interface CouncilSession {
	sessionId: string;
	query: string;
	startTime: number;
	stage1: OpinionResult[];
	stage2: ReviewResult[];
	stage3: SynthesisResult;
	endTime: number;
}

/**
 * LLM Council Engine
 * Orchestrates the 3-stage council workflow
 */
export class CouncilEngine {
	private members: CouncilMember[] = [];
	private chairman: CouncilMember | null = null;

	constructor() {}

	/**
	 * Register council members
	 */
	setMembers(members: CouncilMember[]): void {
		this.members = members.filter((m) => m.role !== 'chairman');
		const chairman = members.find((m) => m.role === 'chairman');
		this.chairman = chairman || members[0]; // Default to first member if no chairman
	}

	/**
	 * Get all registered members (excluding chairman)
	 */
	getMembers(): CouncilMember[] {
		return [...this.members];
	}

	/**
	 * Get chairman
	 */
	getChairman(): CouncilMember | null {
		return this.chairman;
	}

	/**
	 * Stage 1: Collect first opinions from all council members
	 */
	async stage1_collectOpinions(
		query: string,
		streamCallback?: (memberId: string, chunk: string) => void
	): Promise<OpinionResult[]> {
		const opinions: OpinionResult[] = [];

		// Query all members in parallel
		const promises = this.members.map(async (member) => {
			const response = await this.queryMember(member, query, streamCallback);
			return {
				memberId: member.id,
				memberName: member.name,
				response,
				timestamp: Date.now(),
			};
		});

		const results = await Promise.all(promises);
		opinions.push(...results);

		return opinions;
	}

	/**
	 * Stage 2: Each member reviews and ranks other responses (anonymized)
	 */
	async stage2_peerReview(query: string, opinions: OpinionResult[]): Promise<ReviewResult[]> {
		const reviews: ReviewResult[] = [];

		// Each member reviews all OTHER responses
		for (const reviewer of this.members) {
			// Get all responses except the reviewer's own
			const otherOpinions = opinions.filter((op) => op.memberId !== reviewer.id);

			// Create anonymized mapping
			const anonymousMap = this.anonymizeResponses(otherOpinions);

			// Build review prompt
			const reviewPrompt = this.buildReviewPrompt(query, anonymousMap.anonymized);

			// Get review from member
			const reviewResponse = await this.queryMember(reviewer, reviewPrompt);

			// Parse rankings from response
			const rankings = this.parseRankings(reviewResponse, anonymousMap.mapping);

			reviews.push({
				reviewerId: reviewer.id,
				reviewerName: reviewer.name,
				rankings,
				timestamp: Date.now(),
			});
		}

		return reviews;
	}

	/**
	 * Stage 3: Chairman synthesizes final response
	 */
	async stage3_synthesize(
		query: string,
		opinions: OpinionResult[],
		reviews: ReviewResult[]
	): Promise<SynthesisResult> {
		if (!this.chairman) {
			throw new Error('No chairman designated');
		}

		// Calculate aggregate rankings
		const scores = this.calculateAggregateScores(reviews);

		// Build synthesis prompt
		const synthesisPrompt = this.buildSynthesisPrompt(query, opinions, reviews, scores);

		// Get synthesis from chairman
		const synthesis = await this.queryMember(this.chairman, synthesisPrompt);

		return {
			chairmanId: this.chairman.id,
			chairmanName: this.chairman.name,
			synthesis,
			timestamp: Date.now(),
			sources: opinions.map((op) => op.memberId),
		};
	}

	/**
	 * Run complete council workflow
	 */
	async runCouncil(
		query: string,
		streamCallback?: (stage: number, memberId: string, chunk: string) => void
	): Promise<CouncilSession> {
		const sessionId = `session-${Date.now()}`;
		const startTime = Date.now();

		// Stage 1: First opinions
		const stage1 = await this.stage1_collectOpinions(
			query,
			streamCallback
				? (memberId, chunk) => streamCallback(1, memberId, chunk)
				: undefined
		);

		// Stage 2: Peer review
		const stage2 = await this.stage2_peerReview(query, stage1);

		// Stage 3: Chairman synthesis
		const stage3 = await this.stage3_synthesize(query, stage1, stage2);

		return {
			sessionId,
			query,
			startTime,
			stage1,
			stage2,
			stage3,
			endTime: Date.now(),
		};
	}

	/**
	 * Query a specific council member
	 */
	private async queryMember(
		member: CouncilMember,
		prompt: string,
		streamCallback?: (memberId: string, chunk: string) => void
	): Promise<string> {
		// Import StreamingClient dynamically to avoid circular dependencies
		const { StreamingClient } = await import('./streaming-client.js');

		const client = new StreamingClient(member.provider, member.apiKey, member.model);

		let fullResponse = '';

		for await (const chunk of client.streamChat(prompt)) {
			if (!chunk.done) {
				fullResponse += chunk.text;
				if (streamCallback) {
					streamCallback(member.id, chunk.text);
				}
			}
		}

		return fullResponse;
	}

	/**
	 * Anonymize responses for unbiased review
	 */
	private anonymizeResponses(opinions: OpinionResult[]): {
		anonymized: Array<{ id: string; response: string }>;
		mapping: Map<string, string>;
	} {
		const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
		const anonymized: Array<{ id: string; response: string }> = [];
		const mapping = new Map<string, string>();

		// Shuffle opinions to prevent position bias
		const shuffled = [...opinions].sort(() => Math.random() - 0.5);

		shuffled.forEach((opinion, index) => {
			const anonymousId = `Response ${labels[index]}`;
			anonymized.push({
				id: anonymousId,
				response: opinion.response,
			});
			mapping.set(anonymousId, opinion.memberId);
		});

		return { anonymized, mapping };
	}

	/**
	 * Build review prompt for a council member
	 */
	private buildReviewPrompt(
		originalQuery: string,
		anonymizedResponses: Array<{ id: string; response: string }>
	): string {
		const responsesText = anonymizedResponses
			.map((r) => `## ${r.id}\n${r.response}`)
			.join('\n\n');

		return `You are reviewing responses from other AI models. The responses are anonymized to prevent bias.

Original Question:
${originalQuery}

Anonymous Responses:
${responsesText}

Please rank these responses from best to worst based on:
1. Accuracy and correctness
2. Depth of insight
3. Clarity and structure
4. Usefulness to the user

For each response, provide:
- Rank (1 = best)
- Brief reasoning for the ranking

Format your response as:
RANKINGS:
1. [Response ID]: [reasoning]
2. [Response ID]: [reasoning]
...`;
	}

	/**
	 * Build synthesis prompt for chairman
	 */
	private buildSynthesisPrompt(
		query: string,
		opinions: OpinionResult[],
		reviews: ReviewResult[],
		scores: Map<string, number>
	): string {
		// Sort opinions by aggregate score
		const sortedOpinions = [...opinions].sort((a, b) => {
			const scoreA = scores.get(a.memberId) || 0;
			const scoreB = scores.get(b.memberId) || 0;
			return scoreA - scoreB; // Lower score = better rank
		});

		const opinionsText = sortedOpinions
			.map((op) => {
				const score = scores.get(op.memberId) || 0;
				return `## Response from ${op.memberName} (Avg Rank: ${score.toFixed(1)})\n${op.response}`;
			})
			.join('\n\n');

		return `You are the Chairman of an LLM Council. Multiple AI models have responded to a question, and their responses have been peer-reviewed and ranked.

Original Question:
${query}

Reviewed Responses (sorted by peer ranking):
${opinionsText}

Your task as Chairman:
1. Synthesize the best elements from all responses
2. Resolve any contradictions with sound reasoning
3. Provide additional insight where gaps exist
4. Create a comprehensive, well-structured final answer

Produce a single, authoritative response that represents the council's collective wisdom.`;
	}

	/**
	 * Parse rankings from review response
	 */
	private parseRankings(reviewText: string, mapping: Map<string, string>): Ranking[] {
		const rankings: Ranking[] = [];

		// Look for numbered list pattern
		const lines = reviewText.split('\n');
		let currentRank = 0;

		for (const line of lines) {
			// Match patterns like "1. Response A:" or "1) Response A -"
			const match = line.match(/^\s*(\d+)[.)]\s*(Response [A-Z])[:\-\s]/i);

			if (match) {
				currentRank = parseInt(match[1]);
				const anonymousId = match[2];
				const actualMemberId = mapping.get(anonymousId);

				if (actualMemberId) {
					// Extract reasoning (rest of line)
					const reasoning = line
						.substring(line.indexOf(anonymousId) + anonymousId.length)
						.replace(/^[:\-\s]+/, '')
						.trim();

					rankings.push({
						anonymousId,
						actualMemberId,
						rank: currentRank,
						reasoning: reasoning || 'No reasoning provided',
					});
				}
			}
		}

		return rankings;
	}

	/**
	 * Calculate aggregate scores from all reviews
	 * Lower score = better (average of ranks)
	 */
	private calculateAggregateScores(reviews: ReviewResult[]): Map<string, number> {
		const scores = new Map<string, number>();
		const counts = new Map<string, number>();

		for (const review of reviews) {
			for (const ranking of review.rankings) {
				const current = scores.get(ranking.actualMemberId) || 0;
				const count = counts.get(ranking.actualMemberId) || 0;

				scores.set(ranking.actualMemberId, current + ranking.rank);
				counts.set(ranking.actualMemberId, count + 1);
			}
		}

		// Calculate averages
		const avgScores = new Map<string, number>();
		for (const [memberId, totalScore] of scores.entries()) {
			const count = counts.get(memberId) || 1;
			avgScores.set(memberId, totalScore / count);
		}

		return avgScores;
	}
}
