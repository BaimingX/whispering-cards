export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-purple-300 mb-8">隐私政策</h1>
      
      <div className="prose prose-invert prose-purple max-w-none">
        <p className="text-lg mb-6">
          呓语之牌尊重并保护所有用户的隐私权。本隐私政策解释了我们如何收集、使用和保护您提供给我们的信息。
        </p>
        
        <h2 className="text-xl font-semibold text-purple-200 mt-8 mb-4">1. 信息收集</h2>
        <p>
          我们可能收集以下类型的信息：
        </p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li>账户信息：当您注册账户时，我们收集您的电子邮件地址、名称和用户创建的内容。</li>
          <li>使用数据：我们自动收集有关您使用我们服务方式的信息，如访问时间、访问的功能以及您的互动。</li>
          <li>设备信息：我们可能收集有关您使用的设备的信息，包括IP地址、浏览器类型、操作系统和设备标识符。</li>
        </ul>
        
        <h2 className="text-xl font-semibold text-purple-200 mt-8 mb-4">2. 信息使用</h2>
        <p>
          我们使用收集的信息：
        </p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li>提供、维护和改进我们的服务</li>
          <li>个性化您的体验</li>
          <li>与您沟通，包括服务通知和更新</li>
          <li>保护我们的服务安全</li>
        </ul>
        
        <h2 className="text-xl font-semibold text-purple-200 mt-8 mb-4">3. 信息共享</h2>
        <p>
          我们不会出售或出租您的个人信息给第三方用于营销目的。我们可能在以下情况下共享信息：
        </p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li>与服务提供商：帮助我们提供服务的第三方服务提供商</li>
          <li>法律要求：如法律程序、法院命令或法律责任所要求</li>
          <li>商业转让：与任何合并、公司资产出售或收购有关</li>
        </ul>
        
        <h2 className="text-xl font-semibold text-purple-200 mt-8 mb-4">4. 数据安全</h2>
        <p>
          我们采取合理的措施保护您的个人信息不被未经授权的访问、使用或披露。然而，没有任何互联网传输或电子存储方法是100%安全的。
        </p>
        
        <h2 className="text-xl font-semibold text-purple-200 mt-8 mb-4">5. 您的权利</h2>
        <p>
          您可以随时访问、更新或删除您的个人信息。如需帮助，请联系我们的支持团队。
        </p>
        
        <h2 className="text-xl font-semibold text-purple-200 mt-8 mb-4">6. 儿童隐私</h2>
        <p>
          我们的服务不面向13岁以下的儿童。我们不会有意收集13岁以下儿童的个人信息。
        </p>
        
        <h2 className="text-xl font-semibold text-purple-200 mt-8 mb-4">7. 隐私政策更新</h2>
        <p>
          我们可能会不时更新本隐私政策。任何变更将在网站上发布，并在显著变更的情况下通知您。
        </p>
        
        <h2 className="text-xl font-semibold text-purple-200 mt-8 mb-4">8. 联系我们</h2>
        <p>
          如果您对本隐私政策有任何疑问，请通过以下方式联系我们：<br />
          <a href="mailto:privacy@whisperingcards.com" className="text-purple-400 hover:text-purple-300">privacy@whisperingcards.com</a>
        </p>
        
        <p className="mt-10 text-sm text-gray-400">
          最后更新日期：{new Date().toLocaleDateString('zh-CN')}
        </p>
      </div>
    </div>
  );
} 