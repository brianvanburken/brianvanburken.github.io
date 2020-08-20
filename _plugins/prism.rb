require "execjs"

$source = File.read(__dir__ + "/prism.min.js")
$js = ExecJS.compile($source)

module Jekyll
  module Tags
    class PrismTag < Liquid::Block
      def initialize(tag_name, language, token)
        super
        @language = language.strip
      end

      def render(context)
        code = super.lstrip.gsub!('``', '&#96;')
        output = %Q[Prism.highlight(`#{code}`, Prism.languages.#{@language}, '#{@language}')]
        output = $js.eval(output)
        <<~EOS
        <pre class="language-#{@language}"><code class='language-#{@language}'>#{output}</code></pre>
        EOS
      end
    end
  end
end

Liquid::Template.register_tag('prism', Jekyll::Tags::PrismTag)
