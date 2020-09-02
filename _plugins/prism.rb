require "execjs"
require "json"

class Prism
    def initialize
        @@source ||= File.read(__dir__ + "/prism.min.js")
        @@js ||= ExecJS.compile(@@source)
    end

    def render(content)
        content.scan /((`{3})(?:\s*)(\w+)((?:.|\n)*?)\2)/ do |match|
            code_block = match[0]
            language = match[2].strip
            code = match[3]
            content = content.gsub code_block, self.prism(code, language)
        end
        content
    end

    private

    def prism(content, language)
        cache.getset(language+content) do
            code = JSON.generate(content.lstrip)
            output = %Q[Prism.highlight(#{code}, Prism.languages.#{language}, '#{language}')]
            output = @@js.eval(output)
            <<~EOS
            <pre class="language-#{language}"><code class="language-#{language}">#{output}</code></pre>
            EOS
        end
    rescue ExecJS::RuntimeError => e
        puts "Something is wrong with this code block: #{content}"
    end


    def cache
        @@cache ||= Jekyll::Cache.new(self.class.name)
    end
end

Jekyll::Hooks.register(:site, :pre_render) do |_site|
    $converter = Prism.new
end

Jekyll::Hooks.register(:posts, :pre_render) do |document|
    document.content = $converter.render(document.content)
end
