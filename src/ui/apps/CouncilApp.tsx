import { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import Spinner from 'ink-spinner';
import { CouncilEngine, type CouncilMember, type OpinionResult, type ReviewResult, type SynthesisResult } from '../../core/council-engine.js';

interface CouncilAppProps {
	members: CouncilMember[];
	query: string;
}

export const CouncilApp = ({ members, query }: CouncilAppProps) => {
	const { exit } = useApp();
	const [stage, setStage] = useState<number | 'done'>(1);
	const [opinions, setOpinions] = useState<OpinionResult[]>([]);
	const [reviews, setReviews] = useState<ReviewResult[]>([]);
	const [synthesis, setSynthesis] = useState<SynthesisResult | null>(null);
	const [selectedTab, setSelectedTab] = useState(0);
	const [streamingMember, setStreamingMember] = useState('');
	const [memberBuffers, setMemberBuffers] = useState<Map<string, string>>(new Map());

	useEffect(() => {
		runCouncil();
	}, []);

	const runCouncil = async () => {
		const engine = new CouncilEngine();
		engine.setMembers(members);

		try {
			// Stage 1: Collect first opinions
			setStage(1);
			const stage1Results = await engine.stage1_collectOpinions(
				query,
				(memberId: string, chunk: string) => {
					setStreamingMember(memberId);
					setMemberBuffers((prev) => {
						const newMap = new Map(prev);
						const current = newMap.get(memberId) || '';
						newMap.set(memberId, current + chunk);
						return newMap;
					});
				}
			);
			setOpinions(stage1Results);

			// Stage 2: Peer review
			setStage(2);
			const stage2Results = await engine.stage2_peerReview(query, stage1Results);
			setReviews(stage2Results);

			// Stage 3: Chairman synthesis
			setStage(3);
			const stage3Result = await engine.stage3_synthesize(query, stage1Results, stage2Results);
			setSynthesis(stage3Result);

			setStage('done');
		} catch (error) {
			console.error('Council error:', error);
			exit();
		}
	};

	// Tab navigation
	useInput((input, key) => {
		if (stage === 1 && opinions.length > 0) {
			if (key.leftArrow && selectedTab > 0) {
				setSelectedTab(selectedTab - 1);
			} else if (key.rightArrow && selectedTab < opinions.length - 1) {
				setSelectedTab(selectedTab + 1);
			}
		}

		if (input === 'q' && stage === 'done') {
			exit();
		}
	});

	return (
		<Box flexDirection="column" padding={1}>
			{/* Header */}
			<Box borderStyle="round" borderColor="cyan" padding={1} marginBottom={1}>
				<Box flexDirection="column">
					<Text bold color="cyan">
						🏛️  LLM COUNCIL
					</Text>
					<Text dimColor>
						Query: <Text color="white">{query}</Text>
					</Text>
				</Box>
			</Box>

			{/* Stage 1: First Opinions */}
			{stage === 1 && (
				<Box flexDirection="column">
					<Box marginBottom={1}>
						<Text bold color="yellow">
							<Spinner type="dots" /> Stage 1: Collecting First Opinions
						</Text>
					</Box>

					{/* Member tabs */}
					<Box marginBottom={1}>
						{members
							.filter((m) => m.role !== 'chairman')
							.map((member, idx) => (
								<Box key={member.id} marginRight={1}>
									<Text bold={idx === selectedTab} color={idx === selectedTab ? 'cyan' : 'gray'}>
										{idx === selectedTab ? '▶ ' : '  '}
										{member.name}
										{streamingMember === member.id ? ' ⚡' : ''}
									</Text>
								</Box>
							))}
					</Box>

					{/* Opinion content */}
					<Box borderStyle="single" borderColor="cyan" padding={1} flexDirection="column">
						{opinions[selectedTab] ? (
							<Text>{opinions[selectedTab].response}</Text>
						) : memberBuffers.get(members[selectedTab]?.id) ? (
							<Text>{memberBuffers.get(members[selectedTab].id)}</Text>
						) : (
							<Text dimColor>Waiting for response...</Text>
						)}
					</Box>

					<Box marginTop={1}>
						<Text dimColor>
							Use ← → to switch tabs | Progress: {opinions.length}/{members.length - 1}
						</Text>
					</Box>
				</Box>
			)}

			{/* Stage 2: Peer Review */}
			{stage === 2 && (
				<Box flexDirection="column">
					<Box marginBottom={1}>
						<Text bold color="magenta">
							<Spinner type="dots" /> Stage 2: Peer Review & Ranking
						</Text>
					</Box>

					<Box borderStyle="single" borderColor="magenta" padding={1}>
						<Box flexDirection="column">
							<Text>Each council member is reviewing and ranking other responses...</Text>
							<Text dimColor>
								Reviews completed: {reviews.length}/{members.length - 1}
							</Text>
						</Box>
					</Box>
				</Box>
			)}

			{/* Stage 3: Chairman Synthesis */}
			{stage === 3 && !synthesis && (
				<Box flexDirection="column">
					<Box marginBottom={1}>
						<Text bold color="green">
							<Spinner type="dots" /> Stage 3: Chairman Synthesis
						</Text>
					</Box>

					<Box borderStyle="single" borderColor="green" padding={1}>
						<Text>The Chairman is compiling the final response from all council opinions...</Text>
					</Box>
				</Box>
			)}

			{/* Final Results */}
			{stage === 'done' && synthesis && (
				<Box flexDirection="column">
					<Box marginBottom={1}>
						<Text bold color="green">
							✅ Council Deliberation Complete
						</Text>
					</Box>

					{/* Peer Review Rankings */}
					<Box
						borderStyle="round"
						borderColor="yellow"
						padding={1}
						marginBottom={1}
						flexDirection="column"
					>
						<Text bold color="yellow">
							📊 Peer Review Rankings
						</Text>

						{reviews.length > 0 && (
							<Box flexDirection="column" marginTop={1}>
								{opinions
									.map((op) => {
										// Calculate average rank
										let totalRank = 0;
										let count = 0;

										for (const review of reviews) {
											const ranking = review.rankings.find((r) => r.actualMemberId === op.memberId);
											if (ranking) {
												totalRank += ranking.rank;
												count++;
											}
										}

										const avgRank = count > 0 ? totalRank / count : 0;
										return { ...op, avgRank };
									})
									.sort((a, b) => a.avgRank - b.avgRank)
									.map((op, idx) => (
										<Text key={op.memberId}>
											{idx + 1}. {op.memberName} (Avg Rank:{' '}
											{op.avgRank.toFixed(1)})
										</Text>
									))}
							</Box>
						)}
					</Box>

					{/* Chairman's Final Response */}
					<Box borderStyle="double" borderColor="green" padding={1} flexDirection="column">
						<Text bold color="green">
							🏛️  Chairman's Final Response
						</Text>
						<Text dimColor>From: {synthesis.chairmanName}</Text>
						<Box marginTop={1}>
							<Text>{synthesis.synthesis}</Text>
						</Box>
					</Box>

					<Box marginTop={1}>
						<Text dimColor>Press 'q' to exit</Text>
					</Box>
				</Box>
			)}
		</Box>
	);
};
