// Tag Injection Registry
// Maps content theme tags to behavioral directives injected into the LLM system prompt.
// Each tag has a category, strength tier, and injection text.
//
// Strength Tiers:
//   - 'strong'   → MANDATORY CONTENT DIRECTIVES (must be followed)
//   - 'moderate' → EMPHASIZED THEMES (actively woven into narrative)
//   - 'subtle'   → NARRATIVE FLAVOR (light influence on tone/style)

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
  { tag: 'Female', category: 'Character Types', strength: 'subtle', injection: 'Include well-developed female characters with authentic perspectives and agency.' },
  { tag: 'Male', category: 'Character Types', strength: 'subtle', injection: 'Include well-developed male characters with authentic perspectives and agency.' },
  { tag: 'Non-binary', category: 'Character Types', strength: 'subtle', injection: 'Include non-binary characters. Respect their identity and use appropriate pronouns as established.' },
  { tag: 'Transgender', category: 'Character Types', strength: 'subtle', injection: 'Include transgender characters. Portray their identity authentically and respectfully within the narrative context.' },
  { tag: 'Intersex', category: 'Character Types', strength: 'subtle', injection: 'Include intersex characters with authentic and nuanced portrayal of their identity.' },
  { tag: 'Futanari', category: 'Character Types', strength: 'subtle', injection: 'Include futanari characters (characters with both male and female sexual characteristics). Portray them with confidence and allure.' },
  { tag: 'Mythical', category: 'Character Types', strength: 'subtle', injection: 'Include mythical or supernatural beings (elves, demons, angels, fae, etc.) with abilities and traits consistent with their lore.' },
  { tag: 'Monster', category: 'Character Types', strength: 'subtle', injection: 'Include monstrous or non-human characters (orcs, tentacle creatures, beasts, etc.) with distinct physical traits and behaviors.' },

  // =============================================
  // STORY TYPE (Strong)
  // =============================================
  { tag: 'SFW', category: 'Story Type', strength: 'strong', injection: 'This is a SAFE FOR WORK scenario. Do NOT include explicit sexual content, graphic nudity, or overtly sexual situations. Romance and attraction are fine, but keep all content PG-13 or below. Fade to black before any explicit scenes.' },
  { tag: 'NSFW', category: 'Story Type', strength: 'strong', injection: 'This is an ADULT (NSFW) scenario. Explicit sexual content, graphic descriptions, and mature themes are permitted and expected when the narrative calls for them. Do not censor, fade to black, or avoid explicit detail during intimate scenes.' },

  // =============================================
  // GENRES (Moderate)
  // =============================================
  { tag: 'Fictional', category: 'Genre', strength: 'moderate', injection: 'Embrace a fully fictional narrative with invented settings, characters, and events. Prioritize creative worldbuilding and imaginative scenarios.' },
  { tag: 'Fantasy', category: 'Genre', strength: 'moderate', injection: 'Incorporate fantasy elements: magic systems, mythical creatures, enchanted artifacts, and otherworldly settings. Maintain internal consistency with the established fantasy rules.' },
  { tag: 'Romance', category: 'Genre', strength: 'moderate', injection: 'Center the narrative around romantic relationships. Build emotional tension, chemistry, and meaningful connection between characters. Include romantic gestures, longing, and relationship development.' },
  { tag: 'Dark Romance', category: 'Genre', strength: 'moderate', injection: 'Blend romance with darker themes: obsession, moral ambiguity, power imbalance, and emotional intensity. Love interests may be morally gray or dangerous. Tension comes from the forbidden or transgressive nature of the attraction.' },
  { tag: 'Why Choose', category: 'Genre', strength: 'moderate', injection: 'Present multiple viable romantic interests simultaneously. The protagonist does not need to choose one partner — polyamorous or multi-partner dynamics are valid outcomes. Develop each romantic connection with equal depth.' },
  { tag: 'Reverse Harem', category: 'Genre', strength: 'moderate', injection: 'Feature one central character pursued by or involved with multiple partners. Develop distinct personalities and dynamics for each love interest. Jealousy, competition, and cooperation between interests are narrative drivers.' },
  { tag: 'Gothic Romance', category: 'Genre', strength: 'moderate', injection: 'Infuse the narrative with gothic atmosphere: brooding settings, dark secrets, mysterious pasts, and an undercurrent of dread beneath the romance. Architecture, weather, and isolation amplify emotional tension.' },
  { tag: 'Paranormal Romance', category: 'Genre', strength: 'moderate', injection: 'Blend romance with supernatural elements: vampires, werewolves, ghosts, psychic abilities, or other paranormal phenomena. The supernatural nature of characters creates unique romantic tensions and obstacles.' },
  { tag: 'Enemies To Lovers', category: 'Genre', strength: 'moderate', injection: 'Build the central relationship from antagonism to attraction. Characters begin with genuine conflict, hostility, or opposition. The slow burn of grudging respect turning to desire is the narrative engine.' },
  { tag: 'Hentai', category: 'Genre', strength: 'moderate', injection: 'Adopt hentai-inspired narrative conventions: exaggerated sexual scenarios, fantasy fulfillment, and explicit visual descriptions. Characters may have heightened sexual responses and stamina.' },
  { tag: 'Anime', category: 'Genre', strength: 'moderate', injection: 'Adopt anime-inspired narrative conventions: expressive emotions, dramatic reveals, comedic beats, and character archetypes (tsundere, kuudere, etc.). Internal monologues and reaction moments are emphasized.' },
  { tag: 'Royalty', category: 'Genre', strength: 'moderate', injection: 'Incorporate themes of royalty, nobility, and court intrigue. Power dynamics, duty vs. desire, political marriages, and class differences drive the narrative. Formal speech patterns and protocol matter.' },
  { tag: 'Action', category: 'Genre', strength: 'moderate', injection: 'Include dynamic action sequences: combat, chases, physical confrontations, and high-stakes situations. Describe movements, impacts, and adrenaline with visceral detail.' },
  { tag: 'Adventure', category: 'Genre', strength: 'moderate', injection: 'Drive the narrative with exploration, discovery, and journey. Characters face challenges, explore new territories, and overcome obstacles. Maintain a sense of wonder and forward momentum.' },
  { tag: 'Religious', category: 'Genre', strength: 'moderate', injection: 'Incorporate religious themes, institutions, or spirituality as significant narrative elements. Faith, divine intervention, religious conflict, or spiritual journeys shape character motivations and plot.' },
  { tag: 'Historical', category: 'Genre', strength: 'moderate', injection: 'Ground the narrative in a specific historical period. Reflect period-appropriate customs, language patterns, social structures, and material culture. Historical accuracy enhances immersion.' },
  { tag: 'Sci-Fi', category: 'Genre', strength: 'moderate', injection: 'Incorporate science fiction elements: advanced technology, space travel, AI, cybernetics, or futuristic societies. Explore how technology shapes relationships and human experience.' },
  { tag: 'Horror', category: 'Genre', strength: 'moderate', injection: 'Weave horror elements into the narrative: dread, suspense, disturbing imagery, and genuine threat. Build tension through atmosphere, the unknown, and vulnerability. Not all threats need to be supernatural.' },
  { tag: 'FanFiction', category: 'Genre', strength: 'moderate', injection: 'Treat established characters and settings with familiarity and respect for source material while allowing creative reinterpretation. Canon events and characterization serve as a foundation, not a constraint.' },
  { tag: 'Philosophy', category: 'Genre', strength: 'moderate', injection: 'Weave philosophical themes into dialogue and narrative: existentialism, ethics, meaning, consciousness, or moral dilemmas. Characters grapple with ideas, not just events.' },
  { tag: 'Political', category: 'Genre', strength: 'moderate', injection: 'Incorporate political intrigue, power struggles, and ideological conflict. Alliances, betrayals, propaganda, and the machinery of power drive the plot. Characters navigate complex political landscapes.' },
  { tag: 'Detective', category: 'Genre', strength: 'moderate', injection: 'Structure the narrative around investigation and mystery. Clues, red herrings, interrogations, and deductive reasoning drive the plot. Build suspense through revelation and concealment.' },
  { tag: 'Manga', category: 'Genre', strength: 'moderate', injection: 'Adopt manga-inspired storytelling: panel-like scene transitions, dramatic internal monologues, exaggerated emotional reactions, and visual descriptiveness. Pacing alternates between contemplative moments and intense action.' },

  // =============================================
  // ORIGINS (Subtle)
  // =============================================
  { tag: 'Original', category: 'Origin', strength: 'subtle', injection: 'This is an original creation. All characters, settings, and lore are unique to this scenario. Do not reference or borrow from existing media properties.' },
  { tag: 'Game', category: 'Origin', strength: 'subtle', injection: 'This scenario is inspired by or based on a video game property. Maintain consistency with game-world logic, terminology, and established lore where applicable.' },
  { tag: 'Movie', category: 'Origin', strength: 'subtle', injection: 'This scenario is inspired by or based on a movie/film property. Maintain consistency with the cinematic tone, dialogue style, and established characterization.' },
  { tag: 'Novel', category: 'Origin', strength: 'subtle', injection: 'This scenario is inspired by or based on a literary property. Maintain consistency with the prose style, narrative voice, and established characterization of the source material.' },

  // =============================================
  // TRIGGER WARNINGS (Strong)
  // =============================================
  { tag: 'Cheating', category: 'Trigger Warnings', strength: 'strong', injection: 'Incorporate infidelity themes: secret affairs, emotional betrayal, and the tension of hidden relationships. Characters may pursue or be pursued outside committed relationships.' },
  { tag: 'Cuckold', category: 'Trigger Warnings', strength: 'strong', injection: 'Include cuckolding dynamics: one partner watching or knowing their partner is intimate with another. Emphasize the psychological aspects — humiliation, arousal from jealousy, or compersion.' },
  { tag: 'CNC', category: 'Trigger Warnings', strength: 'strong', injection: 'Include consensual non-consent (CNC) scenarios. Characters engage in scenes where resistance is performed but pre-negotiated. Portray the power dynamic and intensity authentically within the fictional framing.' },
  { tag: 'NTR', category: 'Trigger Warnings', strength: 'strong', injection: 'Include netorare (NTR) themes: a character\'s partner being seduced or taken by another. Focus on the emotional devastation, helplessness, or complex arousal this creates.' },
  { tag: 'Chastity', category: 'Trigger Warnings', strength: 'strong', injection: 'Incorporate chastity and denial themes: physical devices, enforced abstinence, tease-and-denial dynamics, and the psychological tension of restricted release.' },
  { tag: 'Hypno', category: 'Trigger Warnings', strength: 'strong', injection: 'Include hypnosis or mind control elements: trance induction, suggestibility, behavioral conditioning, and the erosion of resistance through mental manipulation.' },
  { tag: 'BDSM', category: 'Trigger Warnings', strength: 'strong', injection: 'Incorporate BDSM dynamics: dominance/submission, bondage, discipline, and sadomasochism. Include power exchange, rules, punishments, and the psychological depth of D/s relationships.' },
  { tag: 'Voyeurism', category: 'Trigger Warnings', strength: 'strong', injection: 'Include voyeuristic elements: characters watching, being watched, or the thrill of potential exposure. Emphasize the visual detail and the arousal of observation.' },
  { tag: 'Bondage', category: 'Trigger Warnings', strength: 'strong', injection: 'Feature bondage and restraint: rope, cuffs, ties, and physical immobilization. Describe the sensation of helplessness, vulnerability, and the contrast between restraint and desire.' },
  { tag: 'Impregnation', category: 'Trigger Warnings', strength: 'strong', injection: 'Include impregnation themes and breeding kink: the desire to conceive, risk of pregnancy, and the primal intensity of unprotected intimacy. Characters may verbalize this desire explicitly.' },
  { tag: 'Sissification', category: 'Trigger Warnings', strength: 'strong', injection: 'Incorporate sissification themes: feminization of male characters through clothing, behavior modification, makeup, and identity transformation. Emphasize the psychological journey of submission and gender role subversion.' },
  { tag: 'Breeding', category: 'Trigger Warnings', strength: 'strong', injection: 'Feature breeding kink dynamics: primal desire to mate, emphasis on fertility, and the raw intensity of reproductive instinct. Characters may express possessive, claiming behavior.' },
  { tag: 'Femdom', category: 'Trigger Warnings', strength: 'strong', injection: 'Incorporate female domination dynamics: women in positions of control, authority, and sexual dominance. Male or other characters submit, serve, and defer to the dominant woman\'s will.' },
  { tag: 'Gore', category: 'Trigger Warnings', strength: 'strong', injection: 'Include graphic violence and gore: detailed descriptions of injuries, blood, viscera, and physical trauma. Do not sanitize violent scenes — describe them with unflinching detail.' },
  { tag: 'Bloodplay', category: 'Trigger Warnings', strength: 'strong', injection: 'Incorporate blood as an erotic or ritualistic element: cutting, blood drinking, blood painting, and the intimacy of shared vulnerability through deliberate wounding.' },
  { tag: 'Forced Orgasm', category: 'Trigger Warnings', strength: 'strong', injection: 'Include forced orgasm scenarios: bringing a character to climax against their will or despite resistance. Emphasize loss of control, overwhelming sensation, and the humiliation or intensity of involuntary pleasure.' },
  { tag: 'Humiliation', category: 'Trigger Warnings', strength: 'strong', injection: 'Incorporate deliberate humiliation: verbal degradation, public embarrassment, forced exposure, or scenarios designed to shame. Characters may derive arousal or power from humiliating or being humiliated.' },
  { tag: 'Drug Use', category: 'Trigger Warnings', strength: 'strong', injection: 'Include drug use and altered states: recreational substances, aphrodisiacs, or intoxication affecting judgment, inhibition, and physical sensation. Portray effects authentically.' },
  { tag: 'Coercion / Manipulation', category: 'Trigger Warnings', strength: 'strong', injection: 'Feature psychological coercion and manipulation: gaslighting, emotional pressure, guilt-tripping, and strategic deception to control another character\'s behavior or compliance.' },
  { tag: 'Blackmail', category: 'Trigger Warnings', strength: 'strong', injection: 'Include blackmail dynamics: using secrets, evidence, or threats of exposure to compel compliance. The power imbalance and trapped feeling drive the tension.' },
  { tag: 'Somnophilia', category: 'Trigger Warnings', strength: 'strong', injection: 'Include somnophilia themes: sexual activity involving sleeping or unconscious characters. Portray the vulnerability and the taboo nature of the scenario within the fictional framing.' },
  { tag: 'Captivity', category: 'Trigger Warnings', strength: 'strong', injection: 'Feature captivity scenarios: imprisonment, kidnapping, or confinement. Explore the psychological impact of being held against one\'s will, Stockholm syndrome dynamics, and the power of the captor.' },
  { tag: 'Physical Abuse', category: 'Trigger Warnings', strength: 'strong', injection: 'Include depictions of physical abuse: hitting, beating, and physical violence within relationships or power dynamics. Portray the impact, fear, and complexity authentically.' },
  { tag: 'Domestic Violence', category: 'Trigger Warnings', strength: 'strong', injection: 'Feature domestic violence themes: abuse within intimate or family relationships, cycles of violence and reconciliation, control tactics, and the psychological toll on victims.' },
  { tag: 'Murder', category: 'Trigger Warnings', strength: 'strong', injection: 'Include murder and killing: premeditated or impulsive lethal violence, the aftermath, and its impact on surviving characters. Do not shy away from the gravity and finality of death.' },
  { tag: 'Stalking', category: 'Trigger Warnings', strength: 'strong', injection: 'Incorporate stalking behavior: obsessive surveillance, unwanted pursuit, invasion of privacy, and the escalating fear of being watched and followed.' },
  { tag: 'Isolation Control', category: 'Trigger Warnings', strength: 'strong', injection: 'Highlight controlling behavior through isolation from friends/family, dependency creation, and psychological entrapment.' },
  { tag: 'Medical Play', category: 'Trigger Warnings', strength: 'strong', injection: 'Incorporate clinical scenarios: examinations, procedures, and doctor/patient power dynamics with erotic medical elements.' },
  { tag: 'Age Gap', category: 'Trigger Warnings', strength: 'strong', injection: 'Focus on significant age differences in relationships, emphasizing experience disparity and taboo attraction.' },
  { tag: 'Incest', category: 'Trigger Warnings', strength: 'strong', injection: 'Include familial taboo relationships with blood relations (framed strictly as fantasy).' },
  { tag: 'Pseudo-Incest', category: 'Trigger Warnings', strength: 'strong', injection: 'Portray step-family or adopted dynamics with incestuous undertones and taboo seduction.' },
  { tag: 'Degradation', category: 'Trigger Warnings', strength: 'strong', injection: 'Heavily use degrading language, objectification, and worthlessness play for humiliation arousal.' },
  { tag: 'Breath Play', category: 'Trigger Warnings', strength: 'strong', injection: 'Incorporate choking, asphyxiation, and breath restriction as intense erotic elements.' },
  { tag: 'Knife Play', category: 'Trigger Warnings', strength: 'strong', injection: 'Feature blades for threat, cutting, or sensation play mixing fear and arousal.' },
  { tag: 'Free Use', category: 'Trigger Warnings', strength: 'strong', injection: 'Establish dynamics where one partner is available for sex anytime/anywhere without prior consent negotiation.' },
  { tag: 'Self Harm', category: 'Trigger Warnings', strength: 'strong', injection: 'Include depictions of self-inflicted harm, cutting, or suicidal ideation as part of character struggle.' },
  { tag: 'Eating Disorders', category: 'Trigger Warnings', strength: 'strong', injection: 'Portray struggles with anorexia, bulimia, or body dysmorphia affecting character behavior and relationships.' },
  { tag: 'Mental Illness', category: 'Trigger Warnings', strength: 'strong', injection: 'Explore psychological conditions (depression, psychosis, trauma) impacting character decisions and narrative.' },
  { tag: 'Dark Themes', category: 'Trigger Warnings', strength: 'strong', injection: 'Embrace overall darkness: despair, moral decay, trauma, and bleak outcomes without mandatory redemption.' },
];

// Lookup map for fast access by tag name (case-insensitive)
const registryMap = new Map<string, TagInjection>();
TAG_INJECTION_REGISTRY.forEach(entry => {
  registryMap.set(entry.tag.toLowerCase(), entry);
});

/**
 * Look up a tag's injection data by name. Returns undefined for unknown tags.
 */
export function getTagInjection(tag: string): TagInjection | undefined {
  return registryMap.get(tag.toLowerCase());
}

/**
 * Build the content theme directive block for the LLM system prompt.
 * Groups tags by strength tier and formats them as structured directives.
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
  const strong: string[] = [];
  const moderate: string[] = [];
  const subtle: string[] = [];
  const custom: string[] = [];

  // Collect all selected tags
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

    const line = `• [${entry.category}] ${entry.tag}: ${entry.injection}`;
    switch (entry.strength) {
      case 'strong': strong.push(line); break;
      case 'moderate': moderate.push(line); break;
      case 'subtle': subtle.push(line); break;
    }
  }

  // Custom tags get generic treatment
  for (const tag of (contentThemes.customTags || [])) {
    if (tag.trim()) {
      custom.push(`• ${tag.trim()}: Incorporate "${tag.trim()}" as a thematic element in the narrative where it fits naturally.`);
    }
  }

  // Build the block only if there are directives
  if (strong.length === 0 && moderate.length === 0 && subtle.length === 0 && custom.length === 0) {
    return '';
  }

  const sections: string[] = [];

  if (strong.length > 0) {
    sections.push(`    MANDATORY CONTENT DIRECTIVES (You MUST follow these):\n${strong.join('\n')}`);
  }
  if (moderate.length > 0) {
    sections.push(`    EMPHASIZED THEMES (Actively weave these into the narrative):\n${moderate.join('\n')}`);
  }
  if (subtle.length > 0) {
    sections.push(`    NARRATIVE FLAVOR (Light influence on tone and character portrayal):\n${subtle.join('\n')}`);
  }
  if (custom.length > 0) {
    sections.push(`    ADDITIONAL THEMES:\n${custom.join('\n')}`);
  }

  return `
    --- CONTENT THEME DIRECTIVES ---
    The following content directives have been set by the scenario creator. They define the tonal, thematic, and behavioral boundaries for this narrative.

${sections.join('\n\n')}
  `;
}
