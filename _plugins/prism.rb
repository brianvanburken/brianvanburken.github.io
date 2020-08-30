require "execjs"

module Jekyll
  module Tags
    class PrismTag < Liquid::Block
      def initialize(tag_name, language, token)
        super
        @language = language.strip
        @js = init_prism
      end

      def render(context)
        cache.getset(super) do
          code = super.lstrip.gsub('`', '&#96;')
          output = %Q[Prism.highlight(`#{code}`, Prism.languages.#{@language}, '#{@language}')]
          output = @js.eval(output)
          <<~EOS
          <pre class="language-#{@language}"><code class='language-#{@language}'>#{output}</code></pre>
          EOS
        end
      end

      def init_prism
        key = __dir__ + "/prism.min.js"
        cache.getset(key)  do
          source = File.read(key)
          ExecJS.compile(source)
        end
      end

      def cache
        @@cache ||= Jekyll::Cache.new(self.class.name)
      end
    end
  end
end

Liquid::Template.register_tag('prism', Jekyll::Tags::PrismTag)
