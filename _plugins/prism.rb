require "execjs"

class Prism
    def initialize
        key = __dir__ + "/prism.min.js"
        source = File.read(key)
        @@js = ExecJS.compile(source)
    end

    def render(content, language)
        cache.getset(language+content) do
            code = content
                .encode('UTF-8')
                .lstrip
                .gsub('`', '&#96;')

            output = %Q[Prism.highlight(`#{code}`, Prism.languages.#{language}, '#{language}')]
            output = @@js.eval(output)
            <<~EOS
            <pre class="language-#{language}"><code class='language-#{language}'>#{output}</code></pre>
            EOS
        end
    end

    def cache
        @@cache ||= Jekyll::Cache.new(self.class.name)
    end
end

Jekyll::Hooks.register(:site, :pre_render) do |_site|
    $converter = Prism.new
end

Jekyll::Hooks.register(:posts, :pre_render) do |document|
    content = document.content
    content.to_s.scan /((`{3})(?:\s*)(\w+)((?:.|\n)*?)\2)/ do |match|
        match = match.select { |m| not m.nil? }
        code_block = match[0]
        language = match[2].strip
        code = match[3]
        content = content.gsub code_block, $converter.render(code, language)
    end
    document.content = content
end
