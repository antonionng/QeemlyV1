export interface RoleDescription {
  role_id: string;
  level_id?: string;
  title: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
}

export const STANDARD_ROLE_DESCRIPTIONS: Record<string, RoleDescription> = {
  swe: {
    role_id: 'swe',
    title: 'Software Engineer',
    summary: 'Designs, develops, and maintains software systems. Collaborates with cross-functional teams to deliver high-quality products.',
    responsibilities: [
      'Design and implement scalable software solutions',
      'Write clean, maintainable, and well-tested code',
      'Participate in code reviews and architectural discussions',
      'Collaborate with product and design teams on feature delivery',
    ],
    requirements: [
      'Strong proficiency in one or more programming languages',
      'Experience with modern development frameworks and tools',
      'Understanding of software design patterns and best practices',
      'Bachelor\'s degree in Computer Science or equivalent experience',
    ],
  },
  'swe-fe': {
    role_id: 'swe-fe',
    title: 'Frontend Engineer',
    summary: 'Builds and optimizes user-facing applications with a focus on performance, accessibility, and user experience.',
    responsibilities: [
      'Develop responsive and accessible web applications',
      'Optimize application performance and load times',
      'Implement design systems and component libraries',
      'Ensure cross-browser compatibility and mobile responsiveness',
    ],
    requirements: [
      'Expert knowledge of HTML, CSS, and JavaScript/TypeScript',
      'Experience with React, Vue, or Angular frameworks',
      'Understanding of web performance optimization techniques',
      'Familiarity with design tools and design systems',
    ],
  },
  'swe-be': {
    role_id: 'swe-be',
    title: 'Backend Engineer',
    summary: 'Designs and builds server-side systems, APIs, and data pipelines that power product experiences at scale.',
    responsibilities: [
      'Design and build RESTful APIs and microservices',
      'Optimize database queries and data access patterns',
      'Implement authentication, authorization, and security controls',
      'Monitor and improve system reliability and performance',
    ],
    requirements: [
      'Strong experience with server-side languages (Node.js, Python, Go, Java)',
      'Proficiency with SQL and NoSQL databases',
      'Experience with cloud platforms (AWS, GCP, Azure)',
      'Understanding of distributed systems and scalability patterns',
    ],
  },
  'swe-mobile': {
    role_id: 'swe-mobile',
    title: 'Mobile Engineer',
    summary: 'Develops native and cross-platform mobile applications for iOS and Android platforms.',
    responsibilities: [
      'Build and maintain mobile applications for iOS and/or Android',
      'Implement responsive UI following platform design guidelines',
      'Optimize app performance, battery usage, and memory management',
      'Integrate with backend APIs and third-party SDKs',
    ],
    requirements: [
      'Experience with Swift/Kotlin or React Native/Flutter',
      'Understanding of mobile app architecture patterns (MVVM, Clean Architecture)',
      'Knowledge of App Store/Play Store submission processes',
      'Familiarity with mobile testing frameworks',
    ],
  },
  'swe-devops': {
    role_id: 'swe-devops',
    title: 'DevOps Engineer',
    summary: 'Automates infrastructure, CI/CD pipelines, and operational processes to enable rapid, reliable software delivery.',
    responsibilities: [
      'Design and maintain CI/CD pipelines',
      'Manage cloud infrastructure using IaC tools (Terraform, Pulumi)',
      'Implement monitoring, alerting, and incident response procedures',
      'Optimize deployment processes for speed and reliability',
    ],
    requirements: [
      'Experience with containerization (Docker, Kubernetes)',
      'Proficiency with CI/CD tools (GitHub Actions, Jenkins, CircleCI)',
      'Strong knowledge of cloud platforms and networking',
      'Scripting skills in Bash, Python, or similar',
    ],
  },
  'swe-data': {
    role_id: 'swe-data',
    title: 'Data Engineer',
    summary: 'Builds and maintains data infrastructure, pipelines, and warehouses that enable analytics and ML workloads.',
    responsibilities: [
      'Design and build scalable data pipelines and ETL processes',
      'Maintain data warehouse and lake architectures',
      'Ensure data quality, governance, and lineage tracking',
      'Collaborate with data scientists and analysts on data needs',
    ],
    requirements: [
      'Experience with data processing frameworks (Spark, Airflow, dbt)',
      'Proficiency with SQL and data warehousing solutions',
      'Knowledge of streaming data platforms (Kafka, Kinesis)',
      'Understanding of data modeling and schema design',
    ],
  },
  'swe-ml': {
    role_id: 'swe-ml',
    title: 'ML Engineer',
    summary: 'Develops and deploys machine learning models and systems that drive intelligent product features.',
    responsibilities: [
      'Design, train, and deploy ML models to production',
      'Build and maintain ML infrastructure and pipelines',
      'Collaborate with data scientists on model experimentation',
      'Monitor model performance and implement retraining strategies',
    ],
    requirements: [
      'Strong foundation in machine learning and statistical methods',
      'Experience with ML frameworks (PyTorch, TensorFlow, scikit-learn)',
      'Proficiency in Python and data manipulation libraries',
      'Knowledge of MLOps practices and tools',
    ],
  },
  pm: {
    role_id: 'pm',
    title: 'Product Manager',
    summary: 'Defines product vision and strategy, prioritizes features, and works with engineering and design to deliver impactful products.',
    responsibilities: [
      'Define product roadmap and prioritize features based on business impact',
      'Conduct user research and analyze market trends',
      'Write product requirements and acceptance criteria',
      'Coordinate cross-functional teams for product delivery',
    ],
    requirements: [
      'Experience in product management or related roles',
      'Strong analytical and problem-solving skills',
      'Excellent communication and stakeholder management',
      'Familiarity with agile development methodologies',
    ],
  },
  tpm: {
    role_id: 'tpm',
    title: 'Technical Program Manager',
    summary: 'Drives complex technical programs across multiple teams, ensuring alignment, risk mitigation, and timely delivery.',
    responsibilities: [
      'Plan and drive execution of complex cross-team technical programs',
      'Identify dependencies, risks, and mitigation strategies',
      'Facilitate technical decision-making and alignment',
      'Report progress and escalate blockers to leadership',
    ],
    requirements: [
      'Strong technical background with program management experience',
      'Experience managing large-scale software projects',
      'Excellent organizational and communication skills',
      'PMP or similar certification preferred',
    ],
  },
  designer: {
    role_id: 'designer',
    title: 'Product Designer',
    summary: 'Creates intuitive and visually compelling user experiences through research-driven design across web and mobile platforms.',
    responsibilities: [
      'Design user interfaces and interaction flows',
      'Conduct user research and usability testing',
      'Create and maintain design systems and component libraries',
      'Collaborate with product and engineering on feature design',
    ],
    requirements: [
      'Proficiency in design tools (Figma, Sketch, Adobe XD)',
      'Strong portfolio demonstrating UX/UI design skills',
      'Understanding of user-centered design principles',
      'Experience with design systems and atomic design methodology',
    ],
  },
  'ux-researcher': {
    role_id: 'ux-researcher',
    title: 'UX Researcher',
    summary: 'Conducts qualitative and quantitative research to uncover user needs and inform product decisions.',
    responsibilities: [
      'Plan and conduct user research studies (interviews, surveys, usability tests)',
      'Synthesize research findings into actionable insights',
      'Present research findings to stakeholders',
      'Develop and maintain research repositories and knowledge bases',
    ],
    requirements: [
      'Experience with qualitative and quantitative research methods',
      'Strong analytical and synthesis skills',
      'Excellent presentation and storytelling abilities',
      'Degree in HCI, Psychology, or related field preferred',
    ],
  },
  'data-scientist': {
    role_id: 'data-scientist',
    title: 'Data Scientist',
    summary: 'Applies statistical analysis and machine learning to extract insights from data and drive business decisions.',
    responsibilities: [
      'Develop predictive models and statistical analyses',
      'Design and analyze A/B tests and experiments',
      'Create data visualizations and dashboards',
      'Communicate findings and recommendations to stakeholders',
    ],
    requirements: [
      'Strong foundation in statistics and machine learning',
      'Proficiency in Python/R and SQL',
      'Experience with data visualization tools',
      'Advanced degree in quantitative field preferred',
    ],
  },
  'data-analyst': {
    role_id: 'data-analyst',
    title: 'Data Analyst',
    summary: 'Transforms raw data into actionable business insights through analysis, reporting, and visualization.',
    responsibilities: [
      'Analyze business data to identify trends and insights',
      'Build and maintain dashboards and reports',
      'Support stakeholders with ad-hoc data requests',
      'Ensure data accuracy and consistency across reports',
    ],
    requirements: [
      'Proficiency in SQL and spreadsheet tools',
      'Experience with BI tools (Tableau, Looker, Power BI)',
      'Strong analytical and problem-solving skills',
      'Attention to detail and data quality',
    ],
  },
  security: {
    role_id: 'security',
    title: 'Security Engineer',
    summary: 'Protects systems and data by designing security controls, conducting assessments, and responding to threats.',
    responsibilities: [
      'Design and implement security controls and architectures',
      'Conduct security assessments and penetration testing',
      'Monitor for security incidents and lead incident response',
      'Develop security policies and best practices documentation',
    ],
    requirements: [
      'Experience with security tools and methodologies',
      'Knowledge of OWASP, NIST, and compliance frameworks',
      'Understanding of network security and cryptography',
      'Security certifications (CISSP, CEH) preferred',
    ],
  },
  qa: {
    role_id: 'qa',
    title: 'QA Engineer',
    summary: 'Ensures software quality through manual and automated testing, test strategy development, and defect management.',
    responsibilities: [
      'Develop and execute test plans and test cases',
      'Build and maintain automated test suites',
      'Identify, document, and track defects',
      'Collaborate with developers on quality improvements',
    ],
    requirements: [
      'Experience with manual and automated testing methodologies',
      'Proficiency with testing frameworks (Selenium, Cypress, Playwright)',
      'Knowledge of CI/CD and test automation integration',
      'Strong attention to detail and analytical skills',
    ],
  },
};

export function getRoleDescription(roleId: string): RoleDescription | undefined {
  return STANDARD_ROLE_DESCRIPTIONS[roleId];
}

export function getRoleSummary(roleId: string): string {
  return STANDARD_ROLE_DESCRIPTIONS[roleId]?.summary || '';
}
