# frozen_string_literal: true

require "execjs"
require "json"

class Prism
    @@regex = /((?:`{3})(?:\s*)(\w+\n)?((?:.|\n)*?)(?:`{3}))/

    def initialize
        @@source ||= File.read(__dir__ + "/prism.min.js")
        @@js ||= ExecJS.compile(@@source)
    end

    def render(content)
        content.scan @@regex do |match|
            code_block = match[0]
            language = match[1].nil? ? "none" : match[1].strip
            code = match[2].lstrip
            content = content.gsub code_block, self.prism(code, language)
        end
        content
    end

    private

    def prism(content, language)
        cache.getset(language+content) do
            if language != "none"
                code = JSON.generate(content)
                output = %Q[Prism.highlight(#{code}, Prism.languages.#{language}, '#{language}')]
                content = @@js.eval(output)
            end
            <<~EOS
            <pre class="language-#{language}"><code class="language-#{language}">#{content}</code></pre>
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
