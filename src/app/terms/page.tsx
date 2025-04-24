export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-purple-300 mb-8">服务条款</h1>
      
      <div className="prose prose-invert prose-purple max-w-none">
        <p className="text-lg mb-6">
          欢迎使用呓语之牌！请仔细阅读以下条款和条件，这些条款规定了您使用我们服务的权利和义务。
        </p>
        
        <h2 className="text-xl font-semibold text-purple-200 mt-8 mb-4">1. 接受条款</h2>
        <p>
          通过访问或使用呓语之牌服务，您同意受这些条款的约束。如果您不同意这些条款的任何部分，请不要使用我们的服务。
        </p>
        
        <h2 className="text-xl font-semibold text-purple-200 mt-8 mb-4">2. 服务描述</h2>
        <p>
          呓语之牌是一个神秘卡牌游戏平台，提供每日抽卡、神谕问答以及微剧本体验。我们可能会不定期更新或修改服务内容。
        </p>
        
        <h2 className="text-xl font-semibold text-purple-200 mt-8 mb-4">3. 用户账户</h2>
        <p>
          使用某些服务功能可能需要创建账户。您负责维护您的账户安全，并且对发生在您账户下的所有活动负责。
        </p>
        
        <h2 className="text-xl font-semibold text-purple-200 mt-8 mb-4">4. 隐私政策</h2>
        <p>
          我们重视您的隐私。请查看我们的<a href="/privacy" className="text-purple-400 hover:text-purple-300">隐私政策</a>，了解我们如何收集、使用和分享您的信息。
        </p>
        
        <h2 className="text-xl font-semibold text-purple-200 mt-8 mb-4">5. 知识产权</h2>
        <p>
          呓语之牌及其内容（包括但不限于文本、图形、徽标、图标、图像、音频剪辑和软件）受版权、商标和其他知识产权法保护。
        </p>
        
        <h2 className="text-xl font-semibold text-purple-200 mt-8 mb-4">6. 免责声明</h2>
        <p>
          呓语之牌的内容仅供娱乐目的，不应被解释为专业建议。我们不对任何用户因使用我们的服务而采取的行动负责。
        </p>
        
        <h2 className="text-xl font-semibold text-purple-200 mt-8 mb-4">7. 条款变更</h2>
        <p>
          我们保留随时修改这些条款的权利。修改后的条款将在网站上发布时生效。继续使用服务将被视为接受修改后的条款。
        </p>
        
        <h2 className="text-xl font-semibold text-purple-200 mt-8 mb-4">8. 联系我们</h2>
        <p>
          如有任何问题或疑虑，请通过以下方式联系我们：<br />
          <a href="mailto:contact@whisperingcards.com" className="text-purple-400 hover:text-purple-300">contact@whisperingcards.com</a>
        </p>
        
        <p className="mt-10 text-sm text-gray-400">
          最后更新日期：{new Date().toLocaleDateString('zh-CN')}
        </p>
      </div>
    </div>
  );
} 