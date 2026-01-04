export type Experience = {
  id: string;
  title: string;
  role?: string;
  company?: string;
  customSubtitle?: string;
  period: string;
  detailedDescription: string;
  keyAccomplishments: Record<string, string[]>;
  color: string;
  solved: boolean;
  tech?: string[];
};

export const experiences: Experience[] = [
  {
    id: 'intro',
    title: 'Who Am I?',
    customSubtitle: 'A curious engineer',
    period: 'Unscramble the cube to reveal my work',
    detailedDescription: "Great engineering was never about just getting the job done. It's about understanding the whys, whens, whats, hows and whos. I focus on asking the right questions first.",
    keyAccomplishments: {
      "An Overview": [
        "Have over 4.5 years of professional experience building scalable, maintainable and functional systems.",
        "Shipped across startups and big tech - comfortable in both chaos and process.",
        "Worked on a plethora of personal projects. Some are live, some are... somewhere.",
        "Have a Master's in Computer Science from Simon Fraser University - decided to pay for deadlines instead of getting paid for them /jk.",
        "Mentored fresh grads and conducted my share of technical interviews."
      ]
    },
    color: '#ffffff',
    solved: false,
    tech: ['React', 'Three.js', 'TypeScript', '30$ worth of Coffee']
  },
  {
    id: 'exp1',
    title: 'SDE I',
    role: 'Software Development Engineer I',
    company: 'Amazon',
    period: '2020 - 2022',
    detailedDescription: "Learned to own systems end-to-end from writing clean code to designing APIs that work at scale. Got comfortable with low-level design decisions, debugging production issues and understanding how distributed systems behave (and misbehave) under real-world load.",
    keyAccomplishments: {
      "Highlights": [
        "Designed high-throughput Pickup Locations API (200+ TPS, <150ms latency) that became a core dependency for checkout flows.",
        "Pitched and implemented a microservice to centralize partner configurations across multiple teams, reducing onboarding effort from ~4 dev-days to minutes.",
        "Identified a critical delivery-date bug blocking Prime's launch in Poland; led the fix across 5 teams and Poland VPs to ship before deadline.",
        "Managed service readiness for Black Friday and Prime Day and implemented distributed throttling to prevent bot-related service degradation."
      ]
    },
    color: '#00A8E1',
    solved: true,
    tech: ['Java', 'Dozens of core AWS services', 'Clean Code', 'Design Patterns', 'Event Driven Systems', 'Scale/Load Management', 'Operational Excellence']
  },
  {
    id: 'exp2',
    title: 'SDE II',
    role: 'Software Development Engineer II',
    company: 'Amazon',
    period: '2022 - 2024',
    detailedDescription: "Moved from building features to designing systems. Scope grew beyond code - started representing the team in cross-org design reviews, coordinating with external partners like DHL, and owning projects that required cross-team alignment. Got better at navigating ambiguity and driving decisions when everyone has different constraints. Began mentoring new grads and doing interview loops.",
    keyAccomplishments: {
      "Highlights": [
        "Built the 'Collection' Tab on Amazon's Product Page end-to-end - frontend, backend, and an event-driven pre-compute system processing 2K+ events/sec. Drove 10% uplift in pickup orders (~10K/day)",
        "Partnered with DHL to implement postnumber validation on Amazon.de, eliminating ~5K failed deliveries monthly in Germany",
        "Designed a low-latency (~20ms) Checkout API serving 4K+ requests/sec to surface nearby Pickup Locations",
        "Participated in ~20 interview loops across hiring loops, leading upto half of them."
      ]
    },
    color: '#FF9900',
    solved: true,
    tech: ['System Design', 'Performance Optimizations', 'Design Reviews', 'Interviewing (no Leetcode Hards)', 'Organizational Thinking (some call it politics)']
  },
  {
    id: 'exp3',
    title: '"Internship"',
    role: 'Full Stack Engineer',
    company: 'Pavepal.ai',
    period: 'Apr 2025 - Aug 2025',
    detailedDescription: "A 0-to-1 build. Wore all hats from DevOps to frontend development. Drove key design decisions with senior sign-off. What started as an HTML+JS POC hosted on S3 became a production-ready SaaS platform serving live clients across the globe.",
    keyAccomplishments: {
      "Highlights": [
        "Owned full tech stack selection (Next.js, CDN, Cognito-OAuth, Compute, DB, etc.) based on requirements.",
        "Built 4+ REST APIs for road quality and defect data processing.",
        "Implemented secure OAuth authentication with JWT refresh logic.",
        "Established dev/beta/prod environments with full CI/CD pipelines, scripts and release processes."
      ]
    },
    color: '#00C853',
    solved: true,
    tech: ['Next.js', 'Agile (actually used as intended)', 'MongoDB', 'Auth flows and Frameworks (OAuth)', 'Good bunch of AWS services']
  },
  {
    id: 'wip',
    title: 'Work In Progress',
    customSubtitle: 'Tech is a space that never ends, a cube that is never fully solved.',
    period: `${new Date().getFullYear()}+`,
    detailedDescription: "Personally, I build tech to solve problems - for myself and for the communities around me. Professionally, I'm always looking for new opportunities and new domains to work in.",
    keyAccomplishments: {
      "What's Cooking?": [
        "An Introspective Journaling App that uses AI and some clever data analysis to provide insights and better self-reflection.",
        "An AI lawyer assistant that helps local sports organization and it's players with governance and grievances [WIP]",
        "A financial trading platform used by me and my friends to paper-trade and play around with trading algorithms as a foray into fintech [WIP]"
      ]
    },
    color: '#E91E63',
    solved: false,
    tech: ['Loads of Curiosity', 'Decent amount of AI', 'INF amounts of Coffee']
  }
];
