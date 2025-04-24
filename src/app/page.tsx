import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center">
      <div className="text-center max-w-3xl">
        <h1 className="text-5xl font-bold text-purple-300 mb-6">呓语之牌</h1>
        <p className="text-xl text-gray-300 mb-12">
          探索神秘的卡牌世界，聆听古老的呓语，体验命运的转折
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl mt-8">
        <FeatureCard 
          title="每日抽卡" 
          description="每日获得一张神秘卡牌，了解其背后的秘密和力量。" 
          href="/daily" 
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          } 
        />
        
        <FeatureCard 
          title="微剧本" 
          description="体验短小精悍的神秘剧本，你的选择将决定故事的走向。" 
          href="/scenario" 
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          } 
        />

        <FeatureCard 
          title="创作者空间" 
          description="设计你自己的卡牌和剧本，创造独特的呓语世界，分享给其他玩家。" 
          href="/creator" 
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          } 
        />
      </div>

      <div className="mt-20 text-center max-w-xl">
        <h2 className="text-2xl font-semibold text-purple-200 mb-4">感受古老意志的回响</h2>
        <p className="text-gray-400">
          呓语之牌将带你进入一个超自然的世界，在这里，每一张卡牌都蕴含着神秘的力量，每一次抽取都可能改变你的命运。
          无论是寻求指引，还是体验故事，呓语之牌都能给予你独特的体验。
        </p>
      </div>
    </div>
  );
}

function FeatureCard({ title, description, href, icon }: { 
  title: string; 
  description: string; 
  href: string; 
  icon: React.ReactNode 
}) {
  return (
    <div className="bg-gray-800/70 rounded-lg p-6 border border-purple-900/30 hover:border-purple-500/50 transition-all shadow-lg hover:shadow-purple-900/20 group">
      <div className="text-purple-400 mb-4 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h2 className="text-xl font-semibold text-purple-200 mb-3">{title}</h2>
      <p className="text-gray-400 mb-6">{description}</p>
      <Link 
        href={href}
        className="inline-flex items-center text-purple-400 hover:text-purple-300 transition-colors"
      >
        开始体验
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}
