# frozen_string_literal: true

class Pictures
  class << self
    @@regex = /(!\[(.*?)?\]\(([a-zA-z0-9\._\-\/]+)\))/

    def render(content)
      content.scan @@regex do |match|
        img_block = match[0]
        alt_text = match[1]
        jpeg_src = match[2]
        picture = self.create_picture_tag(jpeg_src, alt_text)
        content = content.gsub(img_block, picture)
      end
      content
    end

    private

    def create_picture_tag(jpeg_src, alt_text)
      cache.getset(jpeg_src + alt_text) do
        webp_src = get_webp_src(jpeg_src)
        <<~EOS
          <picture>
            <source srcset="#{webp_src}" type="image/webp">
            <img src="#{jpeg_src}" alt="#{alt_text}"/>
          </picture>
        EOS
      end
    end

    def get_webp_src(jpeg_src)
      jpeg_src.gsub(".jpg", ".webp")
    end

    def cache
      @@cache ||= Jekyll::Cache.new(self.class.name)
    end

  end
end

Jekyll::Hooks.register(:posts, :pre_render) do |document|
  document.content = Pictures.render(document.content)
end
