import { users } from './users';

export const comments = [
  {
    id: 'c1',
    author: users[1],
    content: 'Great insights! The office vacancy stabilization is particularly interesting. Do you think this trend will continue through Q1 2025?',
    timestamp: '1h ago',
    likes: 24,
    isLiked: false,
    replies: [
      {
        id: 'c1-r1',
        author: users[0],
        content: 'Thanks Marcus! Based on our data, we expect continued stabilization but with regional variations. Gateway cities are recovering faster than secondary markets.',
        timestamp: '45m ago',
        likes: 12,
        isLiked: true,
        replies: [
          {
            id: 'c1-r1-r1',
            author: users[3],
            content: 'This aligns with our research at MIT. The hybrid work equilibrium is creating interesting patterns in different metro areas.',
            timestamp: '30m ago',
            likes: 8,
            isLiked: false,
          },
        ],
      },
      {
        id: 'c1-r2',
        author: users[4],
        content: 'Would love to see a breakdown by property class. Are Class A buildings seeing different trends than Class B/C?',
        timestamp: '40m ago',
        likes: 6,
        isLiked: false,
      },
    ],
  },
  {
    id: 'c2',
    author: users[2],
    content: 'The industrial demand numbers are impressive. We\'re seeing similar trends in South Florida - warehouses and logistics facilities are in high demand.',
    timestamp: '2h ago',
    likes: 18,
    isLiked: true,
    replies: [
      {
        id: 'c2-r1',
        author: users[5],
        content: 'Same in Chicago! E-commerce is driving a lot of this demand. Last-mile delivery facilities are particularly hot.',
        timestamp: '1h 30m ago',
        likes: 9,
        isLiked: false,
      },
    ],
  },
  {
    id: 'c3',
    author: users[5],
    content: 'Multifamily resilience is key here. Despite interest rate concerns, the fundamentals remain strong in most markets. Great report! 📊',
    timestamp: '3h ago',
    likes: 32,
    isLiked: false,
  },
  {
    id: 'c4',
    author: users[3],
    content: 'Would be interested to see how sustainable building certifications are impacting vacancy rates. Any data on LEED vs non-LEED buildings?',
    timestamp: '4h ago',
    likes: 15,
    isLiked: false,
    replies: [
      {
        id: 'c4-r1',
        author: users[0],
        content: 'Great question David! We\'re actually releasing a separate report on ESG factors next month. LEED-certified buildings are showing 15-20% lower vacancy rates on average.',
        timestamp: '3h 45m ago',
        likes: 21,
        isLiked: true,
      },
    ],
  },
];
