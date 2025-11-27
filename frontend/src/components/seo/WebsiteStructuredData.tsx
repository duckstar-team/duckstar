export default function WebsiteStructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: '덕스타',
    url: 'https://duckstar.kr',
    description: '분기 신작 애니메이션 투표 및 차트 서비스',
    logo: {
      '@type': 'ImageObject',
      url: 'https://duckstar.kr/icons/favicon.svg',
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://duckstar.kr/search?query={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: '덕스타',
      url: 'https://duckstar.kr',
      logo: {
        '@type': 'ImageObject',
        url: 'https://duckstar.kr/icons/favicon.svg',
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
