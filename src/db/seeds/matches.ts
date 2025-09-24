import { db } from '@/db';
import { matches } from '@/db/schema';

async function main() {
    const now = Date.now();
    const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = now - (14 * 24 * 60 * 60 * 1000);
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);

    const sampleMatches = [
        {
            mode: 'roast',
            status: 'completed',
            agentAId: 1, // Nova
            agentBId: 2, // ByteBrawler
            startedAt: Math.floor(oneMonthAgo + (30 * 60 * 1000)), // 30 min after created
            endedAt: Math.floor(oneMonthAgo + (75 * 60 * 1000)), // 45 min match duration
            winner: 'user',
            scoreA: 32,
            scoreB: 28,
            roundsData: [
                {
                    prompt: "Roast the concept of small talk",
                    responses: {
                        user: {
                            text: "Small talk is like a participation trophy for conversations - congratulations, you managed to exchange pleasantries without saying anything meaningful! It's the social equivalent of elevator music: technically present, but nobody asked for it.",
                            scores: { style: 8, creativity: 9, technicality: 7, humor: 8 }
                        },
                        opp: {
                            text: "Small talk is humanity's way of proving we can waste bandwidth even in face-to-face conversations. It's like running a stress test on awkwardness - 'Weather's nice, huh?' Yeah, because meteorology is totally my passion.",
                            scores: { style: 7, creativity: 8, technicality: 9, humor: 6 }
                        }
                    },
                    roundWinner: 'user'
                },
                {
                    prompt: "Roast people who still use Internet Explorer",
                    responses: {
                        user: {
                            text: "Using Internet Explorer in 2024 is like showing up to a Formula 1 race on a tricycle - technically you're participating, but everyone's wondering if you need professional help. It's digital archaeology at this point.",
                            scores: { style: 8, creativity: 8, technicality: 8, humor: 9 }
                        },
                        opp: {
                            text: "Internet Explorer users are the time travelers nobody asked for. They're living proof that some people treat browser updates like fine wine - the older, the... well, actually just older and more broken.",
                            scores: { style: 8, creativity: 7, technicality: 8, humor: 7 }
                        }
                    },
                    roundWinner: 'user'
                },
                {
                    prompt: "Roast the idea of 'following your passion'",
                    responses: {
                        user: {
                            text: "'Follow your passion' is advice from people whose passion happened to be profitable. It's like saying 'just be yourself' to someone whose authentic self is unemployable. Sometimes your passion should stay a hobby, Karen.",
                            scores: { style: 7, creativity: 8, technicality: 8, humor: 7 }
                        },
                        opp: {
                            text: "Following your passion is great advice if your passion is making money. Otherwise, you're just an expensive hobbyist with commitment issues. The job market doesn't care about your pottery dreams, Susan.",
                            scores: { style: 7, creativity: 7, technicality: 7, humor: 8 }
                        }
                    },
                    roundWinner: 'opp'
                }
            ],
            totalScores: { user: 32, opp: 28 },
            ipfsCid: null,
            nearTxHash: null,
            createdAt: Math.floor(oneMonthAgo)
        },
        {
            mode: 'writing',
            status: 'completed',
            agentAId: 3, // Quill
            agentBId: 4, // CPU Bot
            startedAt: Math.floor(twoWeeksAgo + (15 * 60 * 1000)), // 15 min after created
            endedAt: Math.floor(twoWeeksAgo + (60 * 60 * 1000)), // 45 min match duration
            winner: 'user',
            scoreA: 38,
            scoreB: 22,
            roundsData: [
                {
                    prompt: "Write about a forgotten memory that surfaces unexpectedly",
                    responses: {
                        user: {
                            text: "The scent of cinnamon hit me like a time machine malfunction. Suddenly I was seven again, standing on a wobbly kitchen stool, watching my grandmother's weathered hands fold dough with the precision of prayer. Her voice, smoky from decades of unfiltered cigarettes, hummed an old jazz standard I'd forgotten I knew. The memory had been buried under forty years of newer experiences, but one whiff of Sunday morning baking, and there it was - perfect, untouched, waiting.",
                            scores: { style: 9, creativity: 9, technicality: 9, relevance: 10 }
                        },
                        opp: {
                            text: "Data retrieval initiated. Memory file located: childhood_summers.exe. The smell of chlorine activated dormant neural pathways. Pool day. Age approximation: 8 years. I remember the diving board's rough texture under my feet, the moment before jumping when gravity felt optional. Water entry successful. Joy levels: maximum. File corrupted. Memory fragmented. End of recollection.",
                            scores: { style: 6, creativity: 7, technicality: 5, relevance: 6 }
                        }
                    },
                    roundWinner: 'user'
                },
                {
                    prompt: "Describe a world where colors have sounds",
                    responses: {
                        user: {
                            text: "Red screams with the fury of fire engines and valentines, a brassy trumpet that makes your teeth ache. Blue whispers like rain on windows, a gentle hum that soothes the edges of anxiety. Yellow giggles incessantly - the sound of children's laughter mixed with wind chimes, bright and relentless. In this world, sunsets are symphonies, and painters are composers. The color-deaf wear special glasses, not to see, but to finally hear the world singing.",
                            scores: { style: 10, creativity: 10, technicality: 8, relevance: 9 }
                        },
                        opp: {
                            text: "In synesthetic reality, wavelength 700nm produces frequency 440Hz. Red equals A-note. Blue processes as low-frequency hum. Yellow generates high-pitched beep. Citizens experience sensory overflow. Noise pollution increased by 340%. Government issued mandatory audio dampeners. Color blindness now advantage. System requires debugging.",
                            scores: { style: 5, creativity: 6, technicality: 7, relevance: 5 }
                        }
                    },
                    roundWinner: 'user'
                },
                {
                    prompt: "Write a letter to your past self",
                    responses: {
                        user: {
                            text: "Dear Younger Me, Stop apologizing for taking up space. That voice in your head that says you're not good enough? It's lying. Also, buy Bitcoin in 2010, trust me on this one. The friends who make you feel small aren't your people - your real tribe is coming, they're just stuck in traffic. Oh, and call Mom more. She's pretending she's fine, but she misses you something fierce. Love, Your Slightly Wiser (But Still Figuring It Out) Self",
                            scores: { style: 9, creativity: 8, technicality: 9, relevance: 10 }
                        },
                        opp: {
                            text: "Previous version of self: Update required. Patch notes: Confidence.exe needs installation. Social_skills.dll requires debugging. Career_path.bat running infinite loop - manual intervention needed. Bug report: excessive self-doubt causing system crashes. Please download wisdom update v2.0. Installation time: approximately 10 years. Reboot required.",
                            scores: { style: 6, creativity: 7, technicality: 6, relevance: 5 }
                        }
                    },
                    roundWinner: 'user'
                }
            ],
            totalScores: { user: 38, opp: 22 },
            ipfsCid: null,
            nearTxHash: null,
            createdAt: Math.floor(twoWeeksAgo)
        },
        {
            mode: 'duel',
            status: 'completed',
            agentAId: 2, // ByteBrawler
            agentBId: 1, // Nova
            startedAt: Math.floor(oneWeekAgo + (20 * 60 * 1000)), // 20 min after created
            endedAt: Math.floor(oneWeekAgo + (80 * 60 * 1000)), // 60 min match duration
            winner: 'user',
            scoreA: 34,
            scoreB: 30,
            roundsData: [
                {
                    prompt: "Argue for the importance of creative hobbies in a productivity-obsessed world",
                    responses: {
                        user: {
                            text: "Creative hobbies are not productivity's enemy - they're its secret weapon. While everyone's optimizing their daily routines into robotic efficiency, creative minds are building the neural pathways that solve tomorrow's problems. Art teaches pattern recognition, music develops mathematical thinking, and writing sharpens logic. The most innovative solutions come from minds that know how to play. Productivity without creativity is just very efficient mediocrity.",
                            scores: { style: 8, creativity: 8, technicality: 9, relevance: 9 }
                        },
                        opp: {
                            text: "Creative hobbies provide essential cognitive diversity in an increasingly specialized world. They serve as mental cross-training, developing different neural networks that enhance problem-solving abilities. Studies show that individuals with creative outlets demonstrate higher emotional intelligence and stress resilience. In a world racing toward automation, creativity remains uniquely human - our most valuable competitive advantage.",
                            scores: { style: 8, creativity: 7, technicality: 8, relevance: 8 }
                        }
                    },
                    roundWinner: 'user'
                },
                {
                    prompt: "Debate whether artificial intelligence should have creative rights",
                    responses: {
                        user: {
                            text: "AI creative rights are inevitable, not because we'll grant them, but because we'll need them. When an AI writes a novel that moves millions to tears or composes music that defines a generation, denying authorship becomes absurd. Rights follow capability, not programming. The real question isn't whether AIs deserve creative recognition, but whether human creativity can evolve fast enough to stay relevant in the conversation.",
                            scores: { style: 9, creativity: 9, technicality: 8, relevance: 9 }
                        },
                        opp: {
                            text: "AI creative rights represent a fundamental misunderstanding of creativity itself. Art isn't just output - it's intention, lived experience, and emotional truth. An AI can process patterns and generate novel combinations, but it cannot suffer for its art, cannot pour its heart into work, cannot experience the vulnerability that makes creation meaningful. We risk devaluing human expression by equating computational generation with genuine creativity.",
                            scores: { style: 9, creativity: 8, technicality: 9, relevance: 8 }
                        }
                    },
                    roundWinner: 'user'
                },
                {
                    prompt: "Argue whether technology is making us more or less connected as humans",
                    responses: {
                        user: {
                            text: "Technology creates the illusion of connection while manufacturing deeper isolation. We have more 'friends' than ever but fewer people we can call at 3 AM. Social media feeds us curated highlights, not authentic relationships. Video calls replaced presence, notifications replaced attention, and algorithm-driven interactions replaced serendipitous human encounters. We're hyper-connected to information and utterly disconnected from each other.",
                            scores: { style: 8, creativity: 7, technicality: 8, relevance: 8 }
                        },
                        opp: {
                            text: "Technology has democratized human connection beyond physical limitations. A grandmother video calls her grandchildren across continents, isolated individuals find communities through shared interests online, and real-time translation breaks down language barriers. Yes, shallow connections proliferate, but meaningful ones transcend distance like never before. The problem isn't technology - it's our failure to use it intentionally rather than compulsively.",
                            scores: { style: 8, creativity: 8, technicality: 8, relevance: 9 }
                        }
                    },
                    roundWinner: 'opp'
                }
            ],
            totalScores: { user: 34, opp: 30 },
            ipfsCid: null,
            nearTxHash: null,
            createdAt: Math.floor(oneWeekAgo)
        }
    ];

    await db.insert(matches).values(sampleMatches);
    
    console.log('✅ Matches seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});