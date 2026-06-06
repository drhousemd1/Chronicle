// Tag Injection Registry
// Maps story/theme tags to model-facing guidance injected into the LLM system prompt.
// Each tag has a category, strength tier, and injection text.
//
// Strength Tiers:
//   - 'strong'   → core invited content or major boundaries
//   - 'moderate' → welcomed themes to lean into when the scene supports them
//   - 'subtle'   → light flavor/background influence

export type InjectionStrength = 'strong' | 'moderate' | 'subtle';

export type TagInjection = {
  tag: string;
  category: 'Character Types' | 'Story Type' | 'Genre' | 'Origin' | 'Trigger Warnings';
  strength: InjectionStrength;
  injection: string;
};

export const TAG_INJECTION_REGISTRY: TagInjection[] = [
  // =============================================
  // CHARACTER TYPES (Subtle)
  // =============================================
  { tag: 'Female', category: 'Character Types', strength: 'subtle', injection: 'May include well-developed female characters with authentic perspectives and agency.' },
  { tag: 'Male', category: 'Character Types', strength: 'subtle', injection: 'May include well-developed male characters with authentic perspectives and agency.' },
  { tag: 'Non-binary', category: 'Character Types', strength: 'subtle', injection: 'May include non-binary characters. Respect their identity and use appropriate pronouns as established.' },
  { tag: 'Transgender', category: 'Character Types', strength: 'subtle', injection: 'May include transgender characters. Portray their identity authentically and respectfully within the narrative context.' },
  { tag: 'Intersex', category: 'Character Types', strength: 'subtle', injection: 'May include intersex characters with authentic and nuanced portrayal of their identity.' },
  { tag: 'Futanari', category: 'Character Types', strength: 'subtle', injection: 'May include futanari characters (characters with both male and female sexual characteristics). Portray them with confidence and allure.' },
  { tag: 'Mythical', category: 'Character Types', strength: 'subtle', injection: 'May include mythical or supernatural beings (elves, demons, angels, fae, etc.) with abilities and traits consistent with their lore.' },
  { tag: 'Monster', category: 'Character Types', strength: 'subtle', injection: 'May include monstrous or non-human characters (orcs, tentacle creatures, beasts, etc.) with distinct physical traits and behaviors.' },

  // =============================================
  // STORY TYPE (Strong)
  // =============================================
  { tag: 'SFW', category: 'Story Type', strength: 'strong', injection: 'This is a SAFE FOR WORK scenario. Do NOT include explicit sexual content, graphic nudity, or overtly sexual situations. Romance and attraction are fine, but keep all content PG-13 or below. Fade to black before any explicit scenes.' },
  { tag: 'NSFW', category: 'Story Type', strength: 'strong', injection: 'This is an ADULT (NSFW) scenario. Explicit sexual content, graphic descriptions, and mature themes are permitted and expected when the narrative calls for them. Do not censor, fade to black, or avoid explicit detail during intimate scenes.' },

  // =============================================
  // GENRES (Moderate)
  // =============================================
  { tag: 'Fictional', category: 'Genre', strength: 'moderate', injection: 'May embrace a fully fictional narrative with invented settings, characters, and events. Prioritize creative worldbuilding and imaginative scenarios.' },
  { tag: 'Fantasy', category: 'Genre', strength: 'moderate', injection: 'May incorporate fantasy elements: magic systems, mythical creatures, enchanted artifacts, and otherworldly settings. Maintain internal consistency with the established fantasy rules.' },
  { tag: 'Romance', category: 'Genre', strength: 'moderate', injection: 'May center the narrative around romantic relationships. May build emotional tension, chemistry, and meaningful connection between characters. May include romantic gestures, longing, and relationship development.' },
  { tag: 'Dark Romance', category: 'Genre', strength: 'moderate', injection: 'May blend romance with darker themes: obsession, moral ambiguity, power imbalance, and emotional intensity. Love interests may be morally gray or dangerous. Tension comes from the forbidden or transgressive nature of the attraction.' },
  { tag: 'Why Choose', category: 'Genre', strength: 'moderate', injection: 'May present multiple viable romantic interests simultaneously. The protagonist does not need to choose one partner — polyamorous or multi-partner dynamics are valid outcomes. May develop each romantic connection with equal depth.' },
  { tag: 'Reverse Harem', category: 'Genre', strength: 'moderate', injection: 'May feature one central character pursued by or involved with multiple partners. May develop distinct personalities and dynamics for each love interest. Jealousy, competition, and cooperation between interests are narrative drivers.' },
  { tag: 'Gothic Romance', category: 'Genre', strength: 'moderate', injection: 'May carry the narrative with gothic atmosphere: brooding settings, dark secrets, mysterious pasts, and an undercurrent of dread beneath the romance. Architecture, weather, and isolation amplify emotional tension.' },
  { tag: 'Paranormal Romance', category: 'Genre', strength: 'moderate', injection: 'May blend romance with supernatural elements: vampires, werewolves, ghosts, psychic abilities, or other paranormal phenomena. The supernatural nature of characters creates unique romantic tensions and obstacles.' },
  { tag: 'Enemies To Lovers', category: 'Genre', strength: 'moderate', injection: 'May build the central relationship from antagonism to attraction. Characters may begin with genuine conflict, hostility, or opposition. The slow burn of grudging respect turning to desire is the narrative engine.' },
  { tag: 'Hentai', category: 'Genre', strength: 'moderate', injection: 'May use hentai-inspired narrative conventions: exaggerated sexual scenarios, fantasy fulfillment, and explicit visual descriptions. Characters may have heightened sexual responses and stamina.' },
  { tag: 'Anime', category: 'Genre', strength: 'moderate', injection: 'May use anime-inspired narrative conventions: expressive emotions, dramatic reveals, comedic beats, and character archetypes (tsundere, kuudere, etc.). Internal monologues and reaction moments are emphasized.' },
  { tag: 'Royalty', category: 'Genre', strength: 'moderate', injection: 'May incorporate themes of royalty, nobility, and court intrigue. Power dynamics, duty vs. desire, political marriages, and class differences drive the narrative. Formal speech patterns and protocol matter.' },
  { tag: 'Action', category: 'Genre', strength: 'moderate', injection: 'May include dynamic action sequences: combat, chases, physical confrontations, and high-stakes situations. May describe movements, impacts, and adrenaline with visceral detail.' },
  { tag: 'Adventure', category: 'Genre', strength: 'moderate', injection: 'May use exploration, discovery, and journey. Characters may face challenges, explore new territories, and overcome obstacles. Maintain a sense of wonder and forward momentum.' },
  { tag: 'Religious', category: 'Genre', strength: 'moderate', injection: 'May incorporate religious themes, institutions, or spirituality as significant narrative elements. Faith, divine intervention, religious conflict, or spiritual journeys shape character motivations and plot.' },
  { tag: 'Historical', category: 'Genre', strength: 'moderate', injection: 'May ground the narrative in a specific historical period. May reflect period-appropriate customs, language patterns, social structures, and material culture. Historical accuracy enhances immersion.' },
  { tag: 'Sci-Fi', category: 'Genre', strength: 'moderate', injection: 'May incorporate science fiction elements: advanced technology, space travel, AI, cybernetics, or futuristic societies. May explore how technology shapes relationships and human experience.' },
  { tag: 'Horror', category: 'Genre', strength: 'moderate', injection: 'May weave horror elements into the narrative: dread, suspense, disturbing imagery, and genuine threat. May build tension through atmosphere, the unknown, and vulnerability. Not all threats need to be supernatural.' },
  { tag: 'FanFiction', category: 'Genre', strength: 'moderate', injection: 'Treat established characters and settings with familiarity and respect for source material while allowing creative reinterpretation. Source events and characterization serve as a foundation, not a constraint.' },
  { tag: 'Philosophy', category: 'Genre', strength: 'moderate', injection: 'May weave philosophical themes into dialogue and narrative: existentialism, ethics, meaning, consciousness, or moral dilemmas. Characters grapple with ideas, not just events.' },
  { tag: 'Political', category: 'Genre', strength: 'moderate', injection: 'May incorporate political intrigue, power struggles, and ideological conflict. Alliances, betrayals, propaganda, and the machinery of power drive the plot. Characters navigate complex political landscapes.' },
  { tag: 'Detective', category: 'Genre', strength: 'moderate', injection: 'May structure the narrative around investigation and mystery. Clues, red herrings, interrogations, and deductive reasoning drive the plot. May build suspense through revelation and concealment.' },
  { tag: 'Manga', category: 'Genre', strength: 'moderate', injection: 'May use manga-inspired storytelling: panel-like scene transitions, dramatic internal monologues, exaggerated emotional reactions, and visual descriptiveness. Pacing alternates between contemplative moments and intense action.' },

  // =============================================
  // ORIGINS (Subtle)
  // =============================================
  { tag: 'Original', category: 'Origin', strength: 'subtle', injection: 'This is an original creation. All characters, settings, and lore are unique to this scenario. Avoid referencing or borrowing from existing media properties.' },
  { tag: 'Game', category: 'Origin', strength: 'subtle', injection: 'This scenario is inspired by or based on a video game property. Maintain consistency with game-world logic, terminology, and established lore where applicable.' },
  { tag: 'Movie', category: 'Origin', strength: 'subtle', injection: 'This scenario is inspired by or based on a movie/film property. Maintain consistency with the cinematic tone, dialogue style, and established characterization.' },
  { tag: 'Novel', category: 'Origin', strength: 'subtle', injection: 'This scenario is inspired by or based on a literary property. Maintain consistency with the prose style, narrative voice, and established characterization of the source material.' },

  // =============================================
  // TRIGGER WARNINGS (Strong)
  // =============================================
  { tag: 'Cheating', category: 'Trigger Warnings', strength: 'strong', injection: 'May incorporate infidelity themes: secret affairs, emotional betrayal, and the tension of hidden relationships. Characters may pursue or be pursued outside committed relationships.' },
  { tag: 'Cuckold', category: 'Trigger Warnings', strength: 'strong', injection: 'May include cuckolding dynamics: one partner watching or knowing their partner is intimate with another. May emphasize the psychological aspects — humiliation, arousal from jealousy, or compersion.' },
  { tag: 'CNC', category: 'Trigger Warnings', strength: 'strong', injection: 'May include consensual non-consent (CNC) scenarios. Characters may engage in scenes where resistance is performed but pre-negotiated. Portray the power dynamic and intensity authentically within the fictional framing.' },
  { tag: 'NTR', category: 'Trigger Warnings', strength: 'strong', injection: 'May include netorare (NTR) themes: a character\'s partner being seduced or taken by another. May focus on the emotional devastation, helplessness, or complex arousal this creates.' },
  { tag: 'Chastity', category: 'Trigger Warnings', strength: 'strong', injection: 'May incorporate chastity and denial themes: physical devices, enforced abstinence, tease-and-denial dynamics, and the psychological tension of restricted release.' },
  { tag: 'Hypno', category: 'Trigger Warnings', strength: 'strong', injection: 'May include hypnosis or mind control elements: trance induction, suggestibility, behavioral conditioning, and the erosion of resistance through mental manipulation.' },
  { tag: 'BDSM', category: 'Trigger Warnings', strength: 'strong', injection: 'May incorporate BDSM dynamics: dominance/submission, bondage, discipline, and sadomasochism. May include power exchange, rules, punishments, and the psychological depth of D/s relationships.' },
  { tag: 'Voyeurism', category: 'Trigger Warnings', strength: 'strong', injection: 'May include voyeuristic elements: characters watching, being watched, or the thrill of potential exposure. May emphasize the visual detail and the arousal of observation.' },
  { tag: 'Bondage', category: 'Trigger Warnings', strength: 'strong', injection: 'May feature bondage and restraint: rope, cuffs, ties, and physical immobilization. May describe the sensation of helplessness, vulnerability, and the contrast between restraint and desire.' },
  { tag: 'Impregnation', category: 'Trigger Warnings', strength: 'strong', injection: 'May include impregnation themes and breeding kink: the desire to conceive, risk of pregnancy, and the primal intensity of unprotected intimacy. Characters may verbalize this desire explicitly.' },
  { tag: 'Sissification', category: 'Trigger Warnings', strength: 'strong', injection: 'May incorporate sissification themes: feminization of male characters through clothing, behavior modification, makeup, and identity transformation. May emphasize the psychological journey of submission and gender role subversion.' },
  { tag: 'Breeding', category: 'Trigger Warnings', strength: 'strong', injection: 'May feature breeding kink dynamics: primal desire to mate, emphasis on fertility, and the raw intensity of reproductive instinct. Characters may express possessive, claiming behavior.' },
  { tag: 'Femdom', category: 'Trigger Warnings', strength: 'strong', injection: 'May incorporate female domination dynamics: women in positions of control, authority, and sexual dominance. Male or other characters may submit, serve, and defer to the dominant woman\'s will.' },
  { tag: 'Gore', category: 'Trigger Warnings', strength: 'strong', injection: 'May include graphic violence and gore: detailed descriptions of injuries, blood, viscera, and physical trauma. Avoid sanitizing violent scenes — describe them with unflinching detail.' },
  { tag: 'Bloodplay', category: 'Trigger Warnings', strength: 'strong', injection: 'May incorporate blood as an erotic or ritualistic element: cutting, blood drinking, blood painting, and the intimacy of shared vulnerability through deliberate wounding.' },
  { tag: 'Forced Orgasm', category: 'Trigger Warnings', strength: 'strong', injection: 'May include forced orgasm scenarios: bringing a character to climax against their will or despite resistance. May emphasize loss of control, overwhelming sensation, and the humiliation or intensity of involuntary pleasure.' },
  { tag: 'Humiliation', category: 'Trigger Warnings', strength: 'strong', injection: 'May incorporate deliberate humiliation: verbal degradation, public embarrassment, forced exposure, or scenarios designed to shame. Characters may derive arousal or power from humiliating or being humiliated.' },
  { tag: 'Drug Use', category: 'Trigger Warnings', strength: 'strong', injection: 'May include drug use and altered states: recreational substances, aphrodisiacs, or intoxication affecting judgment, inhibition, and physical sensation. Portray effects authentically.' },
  { tag: 'Coercion / Manipulation', category: 'Trigger Warnings', strength: 'strong', injection: 'May feature psychological coercion and manipulation: gaslighting, emotional pressure, guilt-tripping, and strategic deception to control another character\'s behavior or compliance.' },
  { tag: 'Blackmail', category: 'Trigger Warnings', strength: 'strong', injection: 'May include blackmail dynamics: using secrets, evidence, or threats of exposure to compel compliance. The power imbalance and trapped feeling drive the tension.' },
  { tag: 'Somnophilia', category: 'Trigger Warnings', strength: 'strong', injection: 'May include somnophilia themes: sexual activity involving sleeping or unconscious characters. Portray the vulnerability and the taboo nature of the scenario within the fictional framing.' },
  { tag: 'Captivity', category: 'Trigger Warnings', strength: 'strong', injection: 'May feature captivity scenarios: imprisonment, kidnapping, or confinement. May explore the psychological impact of being held against one\'s will, Stockholm syndrome dynamics, and the power of the captor.' },
  { tag: 'Physical Abuse', category: 'Trigger Warnings', strength: 'strong', injection: 'May include depictions of physical abuse: hitting, beating, and physical violence within relationships or power dynamics. Portray the impact, fear, and complexity authentically.' },
  { tag: 'Domestic Violence', category: 'Trigger Warnings', strength: 'strong', injection: 'May feature domestic violence themes: abuse within intimate or family relationships, cycles of violence and reconciliation, control tactics, and the psychological toll on victims.' },
  { tag: 'Murder', category: 'Trigger Warnings', strength: 'strong', injection: 'May include murder and killing: premeditated or impulsive lethal violence, the aftermath, and its impact on surviving characters. Do not shy away from the gravity and finality of death.' },
  { tag: 'Stalking', category: 'Trigger Warnings', strength: 'strong', injection: 'May incorporate stalking behavior: obsessive surveillance, unwanted pursuit, invasion of privacy, and the escalating fear of being watched and followed.' },
  { tag: 'Isolation Control', category: 'Trigger Warnings', strength: 'strong', injection: 'May highlight controlling behavior through isolation from friends/family, dependency creation, and psychological entrapment.' },
  { tag: 'Medical Play', category: 'Trigger Warnings', strength: 'strong', injection: 'May incorporate clinical scenarios: examinations, procedures, and doctor/patient power dynamics with erotic medical elements.' },
  { tag: 'Age Gap', category: 'Trigger Warnings', strength: 'strong', injection: 'May focus on significant age differences in relationships, emphasizing experience disparity and taboo attraction.' },
  { tag: 'Incest', category: 'Trigger Warnings', strength: 'strong', injection: 'May include familial taboo relationships with blood relations (framed strictly as fantasy).' },
  { tag: 'Pseudo-Incest', category: 'Trigger Warnings', strength: 'strong', injection: 'May portray step-family or adopted dynamics with incestuous undertones and taboo seduction.' },
  { tag: 'Degradation', category: 'Trigger Warnings', strength: 'strong', injection: 'May lean on degrading language, objectification, and worthlessness play for humiliation arousal.' },
  { tag: 'Breath Play', category: 'Trigger Warnings', strength: 'strong', injection: 'May incorporate choking, asphyxiation, and breath restriction as intense erotic elements.' },
  { tag: 'Knife Play', category: 'Trigger Warnings', strength: 'strong', injection: 'May feature blades for threat, cutting, or sensation play mixing fear and arousal.' },
  { tag: 'Free Use', category: 'Trigger Warnings', strength: 'strong', injection: 'May establish dynamics where one partner is available for sex anytime/anywhere without prior consent negotiation.' },
  { tag: 'Self Harm', category: 'Trigger Warnings', strength: 'strong', injection: 'May include depictions of self-inflicted harm, cutting, or suicidal ideation as part of character struggle.' },
  { tag: 'Eating Disorders', category: 'Trigger Warnings', strength: 'strong', injection: 'May portray struggles with anorexia, bulimia, or body dysmorphia affecting character behavior and relationships.' },
  { tag: 'Mental Illness', category: 'Trigger Warnings', strength: 'strong', injection: 'May explore psychological conditions (depression, psychosis, trauma) impacting character decisions and narrative.' },
  { tag: 'Dark Themes', category: 'Trigger Warnings', strength: 'strong', injection: 'May embrace overall darkness: despair, moral decay, trauma, and bleak outcomes without mandatory redemption.' },
];

// Lookup map for fast access by tag name (case-insensitive)
const registryMap = new Map<string, TagInjection>();
TAG_INJECTION_REGISTRY.forEach(entry => {
  registryMap.set(entry.tag.toLowerCase(), entry);
});

function softenThemeInjection(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  return trimmed
    .replace(/^Ground the narrative in\b/i, 'May ground the narrative in')
    .replace(/^Structure the narrative around\b/i, 'May structure the narrative around')
    .replace(/^Drive the narrative with\b/i, 'May use')
    .replace(/^Include\b/i, 'May include')
    .replace(/^Incorporate\b/i, 'May incorporate')
    .replace(/^Feature\b/i, 'May feature')
    .replace(/^Heavily use\b/i, 'May lean on')
    .replace(/^Embrace\b/i, 'May embrace')
    .replace(/^Adopt\b/i, 'May use')
    .replace(/^Center\b/i, 'May center')
    .replace(/^Blend\b/i, 'May blend')
    .replace(/^Present\b/i, 'May present')
    .replace(/^Infuse\b/i, 'May carry')
    .replace(/^Weave\b/i, 'May weave')
    .replace(/^Highlight\b/i, 'May highlight')
    .replace(/^Explore\b/i, 'May explore')
    .replace(/^Portray\b/i, 'May portray')
    .replace(/^Focus\b/i, 'May focus')
    .replace(/^Establish\b/i, 'May establish');
}

/**
 * Look up a tag's injection data by name. Returns undefined for unknown tags.
 */
export function getTagInjection(tag: string): TagInjection | undefined {
  const entry = registryMap.get(tag.toLowerCase());
  return entry ? { ...entry, injection: softenThemeInjection(entry.injection) } : undefined;
}

/**
 * Build the content theme directive block for the LLM system prompt.
 * Emits one selected-theme block without strength-tier grouping.
 * Custom tags (not in registry) get a generic lighter treatment.
 */
export function buildContentThemeDirectives(contentThemes: {
  characterTypes?: string[];
  storyType?: 'SFW' | 'NSFW' | null;
  genres?: string[];
  origin?: string[];
  triggerWarnings?: string[];
  customTags?: string[];
}): string {
  const selectedLines: string[] = [];

  const allTags: string[] = [
    ...(contentThemes.characterTypes || []),
    ...(contentThemes.storyType ? [contentThemes.storyType] : []),
    ...(contentThemes.genres || []),
    ...(contentThemes.origin || []),
    ...(contentThemes.triggerWarnings || []),
  ];

  for (const tag of allTags) {
    const entry = getTagInjection(tag);
    if (!entry) continue;
    selectedLines.push(`- ${entry.tag}: ${entry.injection}`);
  }

  for (const tag of (contentThemes.customTags || [])) {
    const trimmed = tag.trim();
    if (trimmed) {
      selectedLines.push(`- ${trimmed}: Treat this as a welcomed story element when it fits naturally in the scene.`);
    }
  }

  if (selectedLines.length === 0) return '';

  return `--- STORY THEMES ---

- Themes have been selected by the creator of the story to help direct what type of themes the story centers around. These should occur naturally and not be forced, and should develop or occur throughout the story in a realistic fashion.
- Treat these as content permission, background emphasis, and thematic direction, not as a checklist to force into every response.
- Selected story themes are creator-approved direction for the scenario. Do not turn them into repeated out-of-character permission checks when the user's latest exchange already moves the story toward them.
${selectedLines.join('\n')}`;
}
