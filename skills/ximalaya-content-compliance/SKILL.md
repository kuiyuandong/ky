---
name: ximalaya-content-compliance
description: |
  This skill should be used whenever content is being prepared for upload to the Ximalaya (喜马拉雅) audio platform.
  It provides platform-specific content compliance rules covering news, health, finance, and religion domains.
  Triggers include: generating English reading materials, preparing audio scripts, drafting tour guide content,
  checking whether existing content violates Ximalaya policies, or planning content calendars for the platform.
  Also triggers when the user mentions '喜马拉雅规范', '平台审核', '内容红线', '上传合规', or similar phrases.
agent_created: true
---

# Ximalaya Content Compliance (喜马拉雅内容合规)

## Overview

Use this skill to audit content before uploading to Ximalaya. The platform enforces strict qualification-based access controls
for news, health, finance, and religion content. Publishing restricted content without proper credentials results in
content removal, account penalties, or permanent banning.

## When to Apply This Skill

Apply the compliance check whenever generating or reviewing content destined for Ximalaya, including:

- Daily English reading materials for the "英语每日朗读" series
- Tour guide scripts with historical/political references
- Any audio content description, title, or metadata
- Content calendar planning (especially topic selection)

## Compliance Check Workflow

### Step 1: Identify the Content Domain

Classify the content into one of the following domains:

| Domain | Key Indicators |
|--------|---------------|
| **News (新闻)** | Politics, diplomacy, military, national security, current events, social incidents |
| **Health (健康)** | Disease treatment, medication guidance, medical advice |
| **Finance (财经)** | Stock recommendations, investment advice, market analysis, cryptocurrency |
| **Religion (宗教)** | Religious preaching, ceremonies, fortune-telling, fengshui, bazi |
| **General** | Education, culture, tourism, technology, language learning, lifestyle |

### Step 2: Run the Prohibited Topics Checklist

Check the content against ALL items in the prohibited topics list. See `references/platform-rules.md` for the complete legal basis and detailed definitions.

**A. Absolutedly Prohibited (No Exceptions):**

- [ ] China's foreign policy, international relations, geopolitics
- [ ] Military, national defense, national security
- [ ] Religious preaching, ceremonies, superstition (bazi, fengshui, fortune-telling)
- [ ] Pornographic, gambling, violent, or terrorist content
- [ ] Content promoting ethnic hatred or discrimination
- [ ] Foreign media/radio station content translated or relayed

**B. Requires Qualifications (Prohibited Without Credentials):**

- [ ] Political news reporting or commentary (requires Internet News Information Service Permit)
- [ ] Stock/security recommendations, investment guidance (requires securities/fund/futures license)
- [ ] Disease treatment or medication guidance (requires medical practitioner certification)
- [ ] Legal advice (requires legal professional qualification)

**C. Style/Format Restrictions:**

- [ ] News headline style titles (e.g., "Today's topic: China's Diplomacy")
- [ ] Content with embedded contact info, QR codes, or off-platform links
- [ ] Small-language audio programs (German, French, Japanese, Korean, Arabic, etc. - all prohibited)

### Step 3: Determine Action

| Check Result | Action |
|-------------|--------|
| All checks pass | Content is safe to upload |
| Minor style issue (e.g., headline wording) | Revise style, re-check |
| Sensitive topic detected | Apply safe replacement strategy (see below) |
| Absolutely prohibited topic | Abandon that topic entirely, choose a safe alternative |

## Safe Replacement Strategy

When the original topic falls into a restricted domain, replace with a safe alternative:

| Restricted Topic | Safe Replacement |
|-----------------|-----------------|
| International politics / diplomacy | Global tech company developments, environmental initiatives, cross-cultural exchange, education trends |
| Military / defense / national security | Science & technology breakthroughs, space exploration |
| Stock market analysis / investment advice | Digital economy trends, industry overviews (tourism economy, e-commerce logistics) |
| Chinese policy / foreign relations | Chinese cultural heritage, green development, rural revitalization, tech achievements |
| Religious / superstitious content | Cultural traditions, festival customs (descriptive, non-promotional) |
| Current events / social incidents | Historical knowledge, educational retrospectives |

## Content Style Guidelines

To avoid triggering Ximalaya's news content detection:

1. **Use knowledge-sharing / educational framing**, not news reporting style
2. **Avoid** "Today's topic is...", "Breaking news...", "This week in politics..."
3. **Use** "Exploring...", "Understanding...", "A look at...", "The story of..."
4. **Keep content descriptive and informative**, not analytical or opinionated about policies
5. **For China-related topics**: focus on culture, history, technology, and nature — avoid policy angles

## Historical Case Reference

**Case: "China's Diplomacy" (2026-06-08)**
- Content was a daily English reading about Chinese diplomatic policy
- Result: Fully removed from Ximalaya with reason "account lacks permission"
- Lesson: Any content touching foreign policy / international relations is classified as "news" and requires qualifications

## References

- `references/platform-rules.md` — Full Ximalaya platform rules with legal citations and detailed violation categories
