Jekyll::Hooks.register(:site, :post_write) do |site|
  next if ENV['JEKYLL_ENV'] != 'production'
  title = "Plugin CSS"

  dest = site.config['destination']
  stylesheet = Dir.glob("#{dest}/assets/*.css").first
  puts "#{title.rjust(18)}: Processing #{stylesheet}"

  puts "#{title.rjust(18)}: Running PurgeCSS"
  # Run purgecss command.
  system("purgecss --css #{stylesheet} --content _site/**/*.html --output #{stylesheet}")

  puts "#{title.rjust(18)}: Running CSSO"
  # Run CSSO command to clean up CSS further
  system("csso #{stylesheet} -o #{stylesheet}")
  puts "#{title.rjust(18)}: Done"
end
