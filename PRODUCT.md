# Product

## Register

brand

## Users
Recruiters and hiring managers evaluating Ahmed Amen Ramadan for senior full-time software engineering roles, plus a secondary audience of founders and CTOs looking for a contractor. They arrive from LinkedIn, a resume link, or search, usually on a laptop at work or a phone between meetings. They are scanning: they want to know within ten seconds that this is a senior, credible engineer, and then find proof (companies, stack, services) and a way to make contact.

## Product Purpose
A personal portfolio site (ahmedamen.com) built with Jekyll. The home page exists to convert a visitor into a scheduled call, an email, or a resume download. Success means a recruiter leaves with a clear impression of seniority and taste, and takes one of the three contact actions. The home page is also a demonstration of craft: the page itself is evidence that its author builds polished software.

## Brand Personality
Precise, warm, ambitious. The voice is direct and confident without boasting. Emotionally the page should feel like the work of someone who ships production systems at scale and also cares about the last pixel. References the user named: Apple and Linear for restraint and cinematic precision; Awwwards-tier creative portfolios for bold WebGL and large type. The two must be reconciled: spectacle in service of credibility, never spectacle for its own sake.

## Anti-references
- The generic AI-template look: glowing gradient cards, neon purple on black, floating blobs, gradient text, identical icon-heading-text card grids.
- Over-the-top agency portfolios where the 3D effect hides the content or makes the page hard to scan.
- Flat resume-style pages with no personality.

## Design Principles
1. Proof before spectacle. Every visual flourish sits next to something a recruiter can verify: a company, a stack, a number, a contact action.
2. Scannable in ten seconds. Name, role, availability, and a contact action are always readable, regardless of what the 3D layer is doing.
3. The page is the portfolio. Motion and rendering quality are treated as evidence of engineering skill, so they must be smooth, intentional, and degrade gracefully.
4. Warmth over coldness. The existing ember palette (warm charcoal, electric orange) is the brand; 3D work should feel lit by that ember, not by sci-fi blue.
5. Respect the visitor's device. Reduced motion, low-power devices, and phones get a lighter but still complete experience.

## Accessibility & Inclusion
No formal WCAG target stated; aim for WCAG 2.1 AA contrast on all text. Honor `prefers-reduced-motion` by freezing or removing the WebGL animation. All 3D content is decorative; every piece of information must exist in accessible HTML. Keep keyboard navigation and focus states intact. Site is bilingual-ready (English primary, Arabic strings in _data), so avoid layouts that break under RTL.
